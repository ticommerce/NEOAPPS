"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import { ACTIVE_BUSINESS_COOKIE, getPanelContext } from "@/lib/auth";
import { parseMoneyToCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

// Todas las acciones usan la sesión del usuario: además de las validaciones
// de aquí, la base de datos rechaza cualquier fila de otro negocio (RLS).
async function context() {
  const [ctx, supabase, t] = await Promise.all([
    getPanelContext(),
    createClient(),
    getTranslations("panel.messages"),
  ]);
  return { ...ctx, businessId: ctx.business.id, supabase, t };
}

const uuid = z.uuid();
const text = (max: number) => z.string().trim().max(max);
const str = (formData: FormData, key: string) => String(formData.get(key) ?? "");

function done(path: string, message?: string): FormState {
  revalidatePath(path, "layout");
  return { ok: true, message };
}

// --- Negocio activo --------------------------------------------------------

export async function switchBusiness(formData: FormData) {
  const { memberships } = await getPanelContext();
  const id = str(formData, "business_id");
  if (memberships.some((m) => m.business.id === id)) {
    (await cookies()).set(ACTIVE_BUSINESS_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  redirect("/panel");
}

// --- Catálogo: categorías --------------------------------------------------

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, t } = await context();
  const name = text(60).min(1).safeParse(str(formData, "name"));
  if (!name.success) return { error: t("nameRequired") };
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  const { error } = await supabase
    .from("categories")
    .insert({ business_id: businessId, name: name.data, position: count ?? 0 });
  if (error) return { error: t("generic") };
  return done("/panel/catalogo");
}

export async function renameCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, t } = await context();
  const name = text(60).min(1).safeParse(str(formData, "name"));
  if (!name.success || !uuid.safeParse(id).success) return { error: t("nameRequired") };
  const { error } = await supabase
    .from("categories")
    .update({ name: name.data })
    .eq("id", id)
    .eq("business_id", businessId);
  if (error) return { error: t("generic") };
  return done("/panel/catalogo", t("saved"));
}

export async function deleteCategory(id: string) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase.from("categories").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/catalogo", "layout");
}

// --- Catálogo: productos y servicios ---------------------------------------

const productSchema = z.object({
  name: text(100).min(1),
  description: text(500),
  category_id: z.union([z.literal(""), uuid]),
  kind: z.enum(["product", "service"]),
  duration: z.union([z.literal(""), z.coerce.number().int().min(5).max(600)]),
  groups: z.array(uuid).max(30),
});

export async function saveProduct(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, t } = await context();
  const parsed = productSchema.safeParse({
    name: str(formData, "name"),
    description: str(formData, "description"),
    category_id: str(formData, "category_id"),
    kind: str(formData, "kind"),
    duration: str(formData, "duration_minutes").trim(),
    groups: formData.getAll("groups").map(String),
  });
  if (!parsed.success) return { error: t("invalidProduct") };
  const priceCents = parseMoneyToCents(str(formData, "price"));
  if (priceCents === null) return { error: t("invalidPrice") };
  if (parsed.data.kind === "service" && parsed.data.duration === "") {
    return { error: t("durationRequired") };
  }
  if (id !== null && !uuid.safeParse(id).success) return { error: t("generic") };

  const row = {
    business_id: businessId,
    name: parsed.data.name,
    description: parsed.data.description,
    category_id: parsed.data.category_id || null,
    kind: parsed.data.kind,
    price_cents: priceCents,
    duration_minutes:
      parsed.data.kind === "service" && parsed.data.duration !== "" ? parsed.data.duration : null,
    available: formData.get("available") === "on",
  };

  let productId = id;
  if (id === null) {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) return { error: t("generic") };
    productId = data.id;
  } else {
    const { error } = await supabase.from("products").update(row).eq("id", id).eq("business_id", businessId);
    if (error) return { error: t("generic") };
  }

  const { error: unlinkError } = await supabase
    .from("product_modifier_groups")
    .delete()
    .eq("product_id", productId!)
    .eq("business_id", businessId);
  if (unlinkError) return { error: t("generic") };
  if (parsed.data.groups.length > 0) {
    const { error } = await supabase.from("product_modifier_groups").insert(
      parsed.data.groups.map((groupId) => ({
        business_id: businessId,
        product_id: productId!,
        group_id: groupId,
      })),
    );
    if (error) return { error: t("generic") };
  }

  revalidatePath("/panel/catalogo", "layout");
  redirect("/panel/catalogo");
}

export async function deleteProduct(id: string) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase.from("products").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/catalogo", "layout");
  redirect("/panel/catalogo");
}

export async function setProductAvailable(id: string, available: boolean) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase
    .from("products")
    .update({ available })
    .eq("id", id)
    .eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/catalogo", "layout");
}

// --- Catálogo: modificadores -----------------------------------------------

const groupSchema = z
  .object({
    name: text(60).min(1),
    min_select: z.coerce.number().int().min(0).max(20),
    max_select: z.coerce.number().int().min(1).max(20),
  })
  .refine((g) => g.min_select <= g.max_select);

export async function saveModifierGroup(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, t } = await context();
  const parsed = groupSchema.safeParse({
    name: str(formData, "name"),
    min_select: str(formData, "min_select"),
    max_select: str(formData, "max_select"),
  });
  if (!parsed.success) return { error: t("invalidGroup") };
  if (id === null) {
    const { error } = await supabase.from("modifier_groups").insert({ business_id: businessId, ...parsed.data });
    if (error) return { error: t("generic") };
    return done("/panel/catalogo");
  }
  if (!uuid.safeParse(id).success) return { error: t("generic") };
  const { error } = await supabase
    .from("modifier_groups")
    .update(parsed.data)
    .eq("id", id)
    .eq("business_id", businessId);
  if (error) return { error: t("generic") };
  return done("/panel/catalogo", t("saved"));
}

export async function deleteModifierGroup(id: string) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase.from("modifier_groups").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/catalogo", "layout");
}

export async function addModifier(groupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, t } = await context();
  const name = text(60).min(1).safeParse(str(formData, "name"));
  if (!name.success || !uuid.safeParse(groupId).success) return { error: t("nameRequired") };
  const rawPrice = str(formData, "price").trim();
  const priceCents = rawPrice === "" ? 0 : parseMoneyToCents(rawPrice);
  if (priceCents === null) return { error: t("invalidPrice") };
  const { count } = await supabase
    .from("modifiers")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  const { error } = await supabase.from("modifiers").insert({
    business_id: businessId,
    group_id: groupId,
    name: name.data,
    price_cents: priceCents,
    position: count ?? 0,
  });
  if (error) return { error: t("generic") };
  return done("/panel/catalogo");
}

export async function deleteModifier(id: string) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase.from("modifiers").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/catalogo", "layout");
}

// --- Datos del negocio -----------------------------------------------------

const businessSchema = z.object({
  name: text(80).min(2),
  type: z.enum(["restaurant", "salon", "clinic", "workshop", "other"]),
  description: text(600),
  phone: text(30),
  whatsapp: text(30),
  email: z.union([z.literal(""), z.email().max(200)]),
  address: text(300),
  city: text(80),
  maps_url: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(500)]),
  policies: text(3000),
});

export async function saveBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  const fields = Object.keys(businessSchema.shape) as Array<keyof typeof businessSchema.shape>;
  const parsed = businessSchema.safeParse(
    Object.fromEntries(fields.map((key) => [key, str(formData, key).trim()])),
  );
  if (!parsed.success) return { error: t("invalidBusiness") };
  const { error } = await supabase.from("businesses").update(parsed.data).eq("id", businessId);
  if (error) return { error: t("generic") };
  return done("/panel", t("saved"));
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export async function saveHours(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  const rows = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const closed = formData.get(`closed_${weekday}`) === "on";
    const opens = time.safeParse(str(formData, `opens_${weekday}`).slice(0, 5));
    const closes = time.safeParse(str(formData, `closes_${weekday}`).slice(0, 5));
    if (closed) {
      rows.push({ business_id: businessId, weekday, closed: true, opens: "08:00", closes: "17:00" });
      continue;
    }
    if (!opens.success || !closes.success || opens.data >= closes.data) {
      return { error: t("invalidHours") };
    }
    rows.push({ business_id: businessId, weekday, closed: false, opens: opens.data, closes: closes.data });
  }
  const { error } = await supabase.from("business_hours").upsert(rows);
  if (error) return { error: t("generic") };
  return done("/panel", t("saved"));
}

const faqSchema = z.object({ question: text(300).min(1), answer: text(1500).min(1) });

export async function saveFaq(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  const parsed = faqSchema.safeParse({ question: str(formData, "question"), answer: str(formData, "answer") });
  if (!parsed.success) return { error: t("invalidFaq") };
  if (id === null) {
    const { count } = await supabase
      .from("faqs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);
    const { error } = await supabase
      .from("faqs")
      .insert({ business_id: businessId, ...parsed.data, position: count ?? 0 });
    if (error) return { error: t("generic") };
    return done("/panel");
  }
  if (!uuid.safeParse(id).success) return { error: t("generic") };
  const { error } = await supabase.from("faqs").update(parsed.data).eq("id", id).eq("business_id", businessId);
  if (error) return { error: t("generic") };
  return done("/panel", t("saved"));
}

export async function deleteFaq(id: string) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase.from("faqs").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel", "layout");
}

// --- Agente ----------------------------------------------------------------

const agentSchema = z.object({
  agent_name: text(40).min(1),
  tone: z.enum(["amable", "formal", "casual"]),
  greeting: text(400),
  extra_instructions: text(2000),
  escalation_phone: text(30),
});

export async function saveAgent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  const parsed = agentSchema.safeParse({
    agent_name: str(formData, "agent_name"),
    tone: str(formData, "tone"),
    greeting: str(formData, "greeting"),
    extra_instructions: str(formData, "extra_instructions"),
    escalation_phone: str(formData, "escalation_phone"),
  });
  if (!parsed.success) return { error: t("invalidAgent") };
  const { error } = await supabase
    .from("agent_settings")
    .update({
      ...parsed.data,
      enabled: formData.get("enabled") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId);
  if (error) return { error: t("generic") };
  return done("/panel", t("saved"));
}

// --- Equipo ----------------------------------------------------------------

const role = z.enum(["owner", "employee"]);

export async function inviteMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  const parsed = z
    .object({ email: z.email().max(200), role })
    .safeParse({ email: str(formData, "email").trim().toLowerCase(), role: str(formData, "role") });
  if (!parsed.success) return { error: t("invalidEmail") };
  const { error } = await supabase.from("invitations").insert({ business_id: businessId, ...parsed.data });
  if (error) return { error: t(error.code === "23505" ? "alreadyInvited" : "generic") };
  return done("/panel/equipo", t("invited"));
}

export async function revokeInvitation(id: string) {
  const { supabase, businessId } = await context();
  if (!uuid.safeParse(id).success) return;
  const { error } = await supabase.from("invitations").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/equipo");
}

export async function changeRole(userId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  const parsed = role.safeParse(str(formData, "role"));
  if (!parsed.success || !uuid.safeParse(userId).success) return { error: t("generic") };
  const { error } = await supabase
    .from("memberships")
    .update({ role: parsed.data })
    .eq("business_id", businessId)
    .eq("user_id", userId);
  if (error) return { error: t(error.message.includes("last_owner") ? "lastOwner" : "generic") };
  return done("/panel", t("saved"));
}

export async function removeMember(userId: string): Promise<FormState> {
  const { supabase, businessId, isOwner, t } = await context();
  if (!isOwner) return { error: t("ownerOnly") };
  if (!uuid.safeParse(userId).success) return { error: t("generic") };
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", userId);
  if (error) return { error: t(error.message.includes("last_owner") ? "lastOwner" : "generic") };
  return done("/panel");
}
