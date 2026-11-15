import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { createBusiness, signOut } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("welcome.title"), robots: { index: false } };
}

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/ingresar");
  const t = await getTranslations("auth");
  const tTypes = await getTranslations("businessTypes");
  const types = ["restaurant", "salon", "clinic", "workshop", "other"] as const;

  return (
    <>
      <h1 className="font-display text-2xl font-bold">{t("welcome.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("welcome.lead")}</p>
      <ActionForm action={createBusiness} className="mt-6">
        <div className="space-y-4">
          <Field label={t("welcome.name")}>
            <Input name="name" required minLength={2} maxLength={80} autoComplete="organization" />
          </Field>
          <Field label={t("welcome.type")}>
            <Select name="type" defaultValue="restaurant">
              {types.map((type) => (
                <option key={type} value={type}>
                  {tTypes(type)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <SubmitButton size="lg" className="mt-6 w-full">
          {t("welcome.submit")}
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-xs text-muted">{t("welcome.invited", { email: session.email })}</p>
      <form action={signOut} className="mt-4 text-center">
        <button type="submit" className="text-sm font-semibold text-muted hover:text-ink">
          {t("signOut")}
        </button>
      </form>
    </>
  );
}
