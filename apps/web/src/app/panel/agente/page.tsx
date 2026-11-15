import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveAgent } from "../actions";

const tones = ["amable", "formal", "casual"] as const;

export default async function AgentPage() {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.agent");
  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agent_settings")
    .select("*")
    .eq("business_id", ctx.business.id)
    .single();
  const readOnly = !ctx.isOwner;

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      {readOnly ? (
        <p className="mb-5 rounded-xl bg-sun-soft px-4 py-3 text-sm text-[#8a5300]">{t("readOnly")}</p>
      ) : null}
      <Card>
        <ActionForm action={saveAgent}>
          <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name")} hint={t("nameHint")}>
              <Input name="agent_name" required maxLength={40} defaultValue={agent?.agent_name} />
            </Field>
            <Field label={t("tone")}>
              <Select name="tone" defaultValue={agent?.tone ?? "amable"}>
                {tones.map((tone) => (
                  <option key={tone} value={tone}>
                    {t(`tones.${tone}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("greeting")} hint={t("greetingHint")} className="sm:col-span-2">
              <Textarea name="greeting" maxLength={400} defaultValue={agent?.greeting} />
            </Field>
            <Field label={t("instructions")} hint={t("instructionsHint")} className="sm:col-span-2">
              <Textarea name="extra_instructions" maxLength={2000} defaultValue={agent?.extra_instructions} className="min-h-32" />
            </Field>
            <Field label={t("escalation")} hint={t("escalationHint")}>
              <Input name="escalation_phone" type="tel" maxLength={30} defaultValue={agent?.escalation_phone} />
            </Field>
            <label className="flex items-center gap-2.5 self-center text-sm font-medium sm:pt-5">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={agent?.enabled ?? true}
                className="h-4 w-4 accent-brand"
              />
              {t("enabled")}
            </label>
          </fieldset>
          {readOnly ? null : <SubmitButton className="mt-5">{t("save")}</SubmitButton>}
        </ActionForm>
      </Card>
    </>
  );
}
