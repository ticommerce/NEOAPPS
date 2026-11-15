"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email().max(200),
  password: z.string().min(8).max(72),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("auth");
  const parsed = credentials.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t("errors.credentials") };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: t(error.code === "email_not_confirmed" ? "errors.unconfirmed" : "errors.credentials") };
  }
  await supabase.rpc("accept_invitations");
  redirect("/panel");
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("auth");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const parsed = credentials.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (fullName.length < 2 || fullName.length > 120) return { error: t("errors.name") };
  if (!parsed.success) return { error: t("errors.signup") };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    return { error: t(error.code === "weak_password" ? "errors.signup" : "errors.generic") };
  }
  // Con confirmación de correo activa no hay sesión hasta abrir el enlace.
  if (!data.session) return { ok: true, message: t("checkEmail") };
  await supabase.rpc("accept_invitations");
  redirect("/panel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVE_BUSINESS_COOKIE);
  redirect("/ingresar");
}

const businessTypes = ["restaurant", "salon", "clinic", "workshop", "other"] as const;

export async function createBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("auth");
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), type: z.enum(businessTypes) })
    .safeParse({ name: formData.get("name"), type: formData.get("type") });
  if (!parsed.success) return { error: t("errors.businessName") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_business", {
    p_name: parsed.data.name,
    p_type: parsed.data.type,
  });
  if (error || !data) {
    return { error: t(error?.message.includes("too_many") ? "errors.tooMany" : "errors.generic") };
  }
  (await cookies()).set(ACTIVE_BUSINESS_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/panel");
}
