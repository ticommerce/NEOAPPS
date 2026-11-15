import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteFaq, saveBusiness, saveFaq, saveHours } from "../actions";

const types = ["restaurant", "salon", "clinic", "workshop", "other"] as const;
// Se muestra de lunes a domingo; en la base 0 es domingo.
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

export default async function BusinessPage() {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.business");
  const tTypes = await getTranslations("businessTypes");
  const weekdays = t.raw("weekdays") as string[];
  const supabase = await createClient();
  const b = ctx.business;
  const readOnly = !ctx.isOwner;

  const [{ data: hours }, { data: faqs }] = await Promise.all([
    supabase.from("business_hours").select("*").eq("business_id", b.id),
    supabase.from("faqs").select("id, question, answer").eq("business_id", b.id).order("position").order("created_at"),
  ]);
  const hoursByDay = new Map((hours ?? []).map((h) => [h.weekday, h]));

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      {readOnly ? (
        <p className="mb-5 rounded-xl bg-sun-soft px-4 py-3 text-sm text-[#8a5300]">{t("readOnly")}</p>
      ) : null}

      <Card>
        <h2 className="font-display text-lg font-bold">{t("data.title")}</h2>
        <ActionForm action={saveBusiness} className="mt-4">
          <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("data.name")}>
              <Input name="name" required minLength={2} maxLength={80} defaultValue={b.name} />
            </Field>
            <Field label={t("data.type")}>
              <Select name="type" defaultValue={b.type}>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {tTypes(type)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("data.description")} hint={t("data.descriptionHint")} className="sm:col-span-2">
              <Textarea name="description" maxLength={600} defaultValue={b.description} />
            </Field>
            <Field label={t("data.phone")}>
              <Input name="phone" type="tel" maxLength={30} defaultValue={b.phone} />
            </Field>
            <Field label={t("data.whatsapp")}>
              <Input name="whatsapp" type="tel" maxLength={30} defaultValue={b.whatsapp} />
            </Field>
            <Field label={t("data.email")}>
              <Input name="email" type="email" maxLength={200} defaultValue={b.email} />
            </Field>
            <Field label={t("data.city")}>
              <Input name="city" maxLength={80} defaultValue={b.city} />
            </Field>
            <Field label={t("data.address")} hint={t("data.addressHint")} className="sm:col-span-2">
              <Textarea name="address" maxLength={300} defaultValue={b.address} className="min-h-16" />
            </Field>
            <Field label={t("data.mapsUrl")} className="sm:col-span-2">
              <Input name="maps_url" type="url" maxLength={500} defaultValue={b.maps_url} placeholder="https://maps.app.goo.gl/..." />
            </Field>
            <Field label={t("data.policies")} hint={t("data.policiesHint")} className="sm:col-span-2">
              <Textarea name="policies" maxLength={3000} defaultValue={b.policies} className="min-h-32" />
            </Field>
          </fieldset>
          {readOnly ? null : <SubmitButton className="mt-5">{t("save")}</SubmitButton>}
        </ActionForm>
      </Card>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-bold">{t("hours.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("hours.lead")}</p>
        <ActionForm action={saveHours} className="mt-4">
          <fieldset disabled={readOnly} className="divide-y divide-line">
            {weekOrder.map((day) => {
              const row = hoursByDay.get(day);
              return (
                <div key={day} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[8rem_1fr_auto]">
                  <p className="font-medium">{weekdays[day]}</p>
                  <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                    <Input
                      name={`opens_${day}`}
                      type="time"
                      defaultValue={(row?.opens ?? "08:00").slice(0, 5)}
                      aria-label={t("hours.opens", { day: weekdays[day] })}
                      className="max-w-36"
                    />
                    <span className="text-muted">–</span>
                    <Input
                      name={`closes_${day}`}
                      type="time"
                      defaultValue={(row?.closes ?? "17:00").slice(0, 5)}
                      aria-label={t("hours.closes", { day: weekdays[day] })}
                      className="max-w-36"
                    />
                  </div>
                  <label className="col-start-2 row-start-1 flex items-center gap-2 text-sm sm:col-start-3">
                    <input
                      type="checkbox"
                      name={`closed_${day}`}
                      defaultChecked={row?.closed ?? false}
                      className="h-4 w-4 accent-brand"
                    />
                    {t("hours.closed")}
                  </label>
                </div>
              );
            })}
          </fieldset>
          {readOnly ? null : <SubmitButton className="mt-4">{t("hours.save")}</SubmitButton>}
        </ActionForm>
      </Card>

      <Card className="mt-6 scroll-mt-6" id="preguntas">
        <h2 className="font-display text-lg font-bold">{t("faqs.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("faqs.lead")}</p>

        <div className="mt-4 space-y-3">
          {(faqs ?? []).map((faq) => (
            <details key={faq.id} className="rounded-xl border border-line px-4 py-3">
              <summary className="cursor-pointer font-medium">{faq.question}</summary>
              {readOnly ? (
                <p className="mt-2 whitespace-pre-line text-sm text-muted">{faq.answer}</p>
              ) : (
                <>
                  <ActionForm action={saveFaq.bind(null, faq.id)} className="mt-3">
                    <div className="space-y-3">
                      <Field label={t("faqs.question")}>
                        <Input name="question" required maxLength={300} defaultValue={faq.question} />
                      </Field>
                      <Field label={t("faqs.answer")}>
                        <Textarea name="answer" required maxLength={1500} defaultValue={faq.answer} />
                      </Field>
                    </div>
                    <SubmitButton size="sm" className="mt-3">
                      {t("save")}
                    </SubmitButton>
                  </ActionForm>
                  <form action={deleteFaq.bind(null, faq.id)} className="mt-2">
                    <SubmitButton variant="danger" size="sm">
                      {t("faqs.delete")}
                    </SubmitButton>
                  </form>
                </>
              )}
            </details>
          ))}
          {(faqs ?? []).length === 0 ? <p className="text-sm text-muted">{t("faqs.empty")}</p> : null}
        </div>

        {readOnly ? null : (
          <ActionForm action={saveFaq.bind(null, null)} resetOnSuccess className="mt-5 border-t border-line pt-5">
            <h3 className="font-semibold">{t("faqs.add")}</h3>
            <div className="mt-3 space-y-3">
              <Field label={t("faqs.question")}>
                <Input name="question" required maxLength={300} placeholder={t("faqs.questionPlaceholder")} />
              </Field>
              <Field label={t("faqs.answer")}>
                <Textarea name="answer" required maxLength={1500} />
              </Field>
            </div>
            <SubmitButton className="mt-3">{t("faqs.addButton")}</SubmitButton>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
