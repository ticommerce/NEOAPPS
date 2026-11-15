// Prueba de aislamiento entre negocios contra una base real (Supabase local
// con los datos demo: `pnpm db:reset && pnpm db:seed`). Cada cliente usa la
// sesión de un usuario, igual que la aplicación, así que lo que se verifica
// aquí es la seguridad por filas de la base de datos.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const PASSWORD = "demo-recepcion";

type Client = SupabaseClient<Database>;

async function signedIn(email: string): Promise<Client> {
  const client = createClient<Database>(url!, key!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`No se pudo ingresar como ${email}: ${error.message}`);
  return client;
}

async function businessId(client: Client) {
  const { data } = await client.from("businesses").select("id").single();
  return data!.id;
}

describe.skipIf(!url || !key)("aislamiento por negocio (RLS)", () => {
  let restaurantOwner: Client;
  let restaurantEmployee: Client;
  let salonOwner: Client;
  let anonymous: Client;
  let restaurantId: string;
  let salonId: string;

  beforeAll(async () => {
    [restaurantOwner, restaurantEmployee, salonOwner] = await Promise.all([
      signedIn("dueno.restaurante@demo.test"),
      signedIn("empleado.restaurante@demo.test"),
      signedIn("dueno.salon@demo.test"),
    ]);
    anonymous = createClient<Database>(url!, key!, { auth: { persistSession: false } });
    restaurantId = await businessId(restaurantOwner);
    salonId = await businessId(salonOwner);
  });

  it("cada usuario ve solo su negocio", async () => {
    const { data: mine } = await restaurantOwner.from("businesses").select("slug");
    expect(mine).toEqual([{ slug: "soda-la-guaria" }]);
    const { data: theirs } = await salonOwner.from("businesses").select("slug");
    expect(theirs).toEqual([{ slug: "salon-brisa" }]);
  });

  it("no se lee el catálogo, preguntas, horarios ni equipo de otro negocio", async () => {
    for (const table of ["products", "categories", "modifiers", "faqs", "business_hours", "agent_settings", "memberships"] as const) {
      const { data, error } = await restaurantOwner.from(table).select("business_id").eq("business_id", salonId);
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
    const { data: own } = await restaurantOwner.from("products").select("business_id");
    expect(own!.length).toBeGreaterThan(0);
    expect(new Set(own!.map((p) => p.business_id))).toEqual(new Set([restaurantId]));
  });

  it("no se puede crear ni modificar datos en otro negocio", async () => {
    const insert = await restaurantOwner
      .from("products")
      .insert({ business_id: salonId, name: "Intruso", price_cents: 100 });
    expect(insert.error).not.toBeNull();

    const update = await restaurantOwner
      .from("products")
      .update({ price_cents: 1 })
      .eq("business_id", salonId)
      .select("id");
    expect(update.data).toEqual([]);

    const rename = await restaurantOwner.from("businesses").update({ name: "Tomado" }).eq("id", salonId).select("id");
    expect(rename.data).toEqual([]);

    const del = await restaurantOwner.from("faqs").delete().eq("business_id", salonId).select("id");
    expect(del.data).toEqual([]);
    const { count } = await salonOwner.from("faqs").select("id", { count: "exact", head: true });
    expect(count).toBeGreaterThan(0);
  });

  it("un producto no puede usar una categoría de otro negocio", async () => {
    const { data: salonCategory } = await salonOwner.from("categories").select("id").limit(1).single();
    const { error } = await restaurantOwner
      .from("products")
      .insert({ business_id: restaurantId, category_id: salonCategory!.id, name: "Cruce", price_cents: 100 });
    expect(error).not.toBeNull();
  });

  it("el empleado administra el catálogo pero no la configuración", async () => {
    const created = await restaurantEmployee
      .from("products")
      .insert({ business_id: restaurantId, name: "Producto de prueba", price_cents: 150000 })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    await restaurantEmployee.from("products").delete().eq("id", created.data!.id);

    const business = await restaurantEmployee.from("businesses").update({ name: "Otro" }).eq("id", restaurantId).select("id");
    expect(business.data).toEqual([]);
    const agent = await restaurantEmployee.from("agent_settings").update({ tone: "formal" }).eq("business_id", restaurantId).select("business_id");
    expect(agent.data).toEqual([]);
    const faq = await restaurantEmployee.from("faqs").insert({ business_id: restaurantId, question: "¿?", answer: "." });
    expect(faq.error).not.toBeNull();
    const invite = await restaurantEmployee.from("invitations").insert({ business_id: restaurantId, email: "x@demo.test" });
    expect(invite.error).not.toBeNull();
    const promote = await restaurantEmployee.from("memberships").update({ role: "owner" }).eq("business_id", restaurantId).select("user_id");
    expect(promote.data).toEqual([]);
  });

  it("nadie se agrega a sí mismo a un negocio", async () => {
    const { data: user } = await restaurantOwner.auth.getUser();
    const { error } = await restaurantOwner
      .from("memberships")
      .insert({ business_id: salonId, user_id: user.user!.id, role: "owner" });
    expect(error).not.toBeNull();
  });

  it("el negocio no se queda sin dueño", async () => {
    const { data: user } = await restaurantOwner.auth.getUser();
    const demote = await restaurantOwner
      .from("memberships")
      .update({ role: "employee" })
      .eq("business_id", restaurantId)
      .eq("user_id", user.user!.id);
    expect(demote.error?.message).toContain("last_owner");
  });

  it("sin sesión no se lee nada y solo se puede enviar el formulario de contacto", async () => {
    for (const table of ["businesses", "products", "faqs", "memberships", "profiles", "leads"] as const) {
      const { data } = await anonymous.from(table).select("*");
      expect(data ?? [], table).toEqual([]);
    }
    const lead = await anonymous.from("leads").insert({ name: "Prueba automática", phone: "8888 0000" });
    expect(lead.error).toBeNull();
    const rpc = await anonymous.rpc("create_business", { p_name: "Sin sesión", p_type: "other" });
    expect(rpc.error).not.toBeNull();
  });

  it("las invitaciones se aceptan solo con el correo de la sesión", async () => {
    const email = "empleado.salon@demo.test";
    await restaurantOwner.from("invitations").delete().eq("email", email);
    const invite = await restaurantOwner.from("invitations").insert({ business_id: restaurantId, email, role: "employee" });
    expect(invite.error).toBeNull();

    // Otro usuario no puede aceptar una invitación ajena.
    const other = await salonOwner.rpc("accept_invitations");
    expect(other.data).toBe(0);

    const invited = await signedIn(email);
    const accepted = await invited.rpc("accept_invitations");
    expect(accepted.data).toBe(1);
    const { data: businesses } = await invited.from("businesses").select("slug").order("slug");
    expect(businesses).toEqual([{ slug: "salon-brisa" }, { slug: "soda-la-guaria" }]);

    // Limpieza: el dueño lo retira del restaurante.
    const { data: user } = await invited.auth.getUser();
    await restaurantOwner.from("memberships").delete().eq("business_id", restaurantId).eq("user_id", user.user!.id);
    const { data: after } = await invited.from("businesses").select("slug");
    expect(after).toEqual([{ slug: "salon-brisa" }]);
  });
});
