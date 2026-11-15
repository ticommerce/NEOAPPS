"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().max(120),
  industry: z.string().trim().max(40),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(30)
    .regex(/^[+\d][\d\s()-]+$/),
  email: z.union([z.literal(""), z.email().max(200)]),
  message: z.string().trim().max(2000),
});

export async function submitLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("landing.contact");

  // Campo trampa: las personas no lo ven; si viene lleno es un bot.
  if (formData.get("website")) return { ok: true, message: t("success") };

  const parsed = leadSchema.safeParse({
    name: formData.get("name") ?? "",
    business_name: formData.get("business_name") ?? "",
    industry: formData.get("industry") ?? "",
    phone: formData.get("phone") ?? "",
    email: String(formData.get("email") ?? "").trim(),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return { error: t("invalid") };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert(parsed.data);
  if (error) return { error: t("error") };
  return { ok: true, message: t("success") };
}
