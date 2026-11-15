import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { signUp } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signup.title"), robots: { index: false } };
}

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="font-display text-2xl font-bold">{t("signup.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("signup.lead")}</p>
      <ActionForm action={signUp} className="mt-6">
        <div className="space-y-4">
          <Field label={t("fullName")}>
            <Input name="full_name" required minLength={2} maxLength={120} autoComplete="name" />
          </Field>
          <Field label={t("email")}>
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t("password")} hint={t("passwordHint")}>
            <Input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          </Field>
        </div>
        <SubmitButton size="lg" className="mt-6 w-full">
          {t("signup.submit")}
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-muted">
        {t("signup.haveAccount")}{" "}
        <Link href="/ingresar" className="font-semibold text-brand hover:underline">
          {t("signup.loginLink")}
        </Link>
      </p>
    </>
  );
}
