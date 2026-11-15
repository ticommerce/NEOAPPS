import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { signIn } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("login.title"), robots: { index: false } };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="font-display text-2xl font-bold">{t("login.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("login.lead")}</p>
      <ActionForm action={signIn} className="mt-6">
        <div className="space-y-4">
          <Field label={t("email")}>
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t("password")}>
            <Input name="password" type="password" required autoComplete="current-password" />
          </Field>
        </div>
        <SubmitButton size="lg" className="mt-6 w-full">
          {t("login.submit")}
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-muted">
        {t("login.noAccount")}{" "}
        <Link href="/registro" className="font-semibold text-brand hover:underline">
          {t("login.signupLink")}
        </Link>
      </p>
    </>
  );
}
