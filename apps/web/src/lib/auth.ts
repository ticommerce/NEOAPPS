import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Role = Database["public"]["Enums"]["member_role"];

export const ACTIVE_BUSINESS_COOKIE = "nr_negocio";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { userId: claims.sub, email: (claims.email as string | undefined) ?? "" };
});

async function loadMemberships() {
  const supabase = await createClient();
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from("memberships")
    .select("role, created_at, businesses(*)")
    .eq("user_id", session.userId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map((m) => ({ role: m.role, business: m.businesses }));
}

// Contexto de toda página y acción del panel: usuario, negocio activo y rol.
// Redirige si no hay sesión o si el usuario todavía no tiene negocio.
export const getPanelContext = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/ingresar");

  let memberships = await loadMemberships();
  if (memberships.length === 0) {
    const supabase = await createClient();
    const { data: accepted } = await supabase.rpc("accept_invitations");
    if (accepted) memberships = await loadMemberships();
  }
  if (memberships.length === 0) redirect("/bienvenida");

  const wanted = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
  const active = memberships.find((m) => m.business.id === wanted) ?? memberships[0];

  return {
    ...session,
    business: active.business,
    role: active.role,
    isOwner: active.role === "owner",
    memberships,
  };
});
