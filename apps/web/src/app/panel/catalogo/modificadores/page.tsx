import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { CatalogTabs } from "@/components/catalog-tabs";
import { PageHeader } from "@/components/page-header";
import { Card, Field, Input } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { addModifier, deleteModifier, deleteModifierGroup, saveModifierGroup } from "../../actions";

export default async function ModifiersPage() {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.modifiers");
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("modifier_groups")
    .select("id, name, min_select, max_select, modifiers(id, name, price_cents, position)")
    .eq("business_id", ctx.business.id)
    .order("created_at")
    .order("position", { referencedTable: "modifiers" });

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <CatalogTabs active="modifiers" />

      <div className="space-y-5">
        {(groups ?? []).map((group) => (
          <Card key={group.id}>
            <ActionForm action={saveModifierGroup.bind(null, group.id)}>
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_7rem_auto]">
                <Field label={t("groupName")}>
                  <Input name="name" required maxLength={60} defaultValue={group.name} />
                </Field>
                <Field label={t("min")}>
                  <Input name="min_select" type="number" min={0} max={20} required defaultValue={group.min_select} />
                </Field>
                <Field label={t("max")}>
                  <Input name="max_select" type="number" min={1} max={20} required defaultValue={group.max_select} />
                </Field>
                <SubmitButton variant="secondary">{t("save")}</SubmitButton>
              </div>
            </ActionForm>

            <ul className="mt-4 divide-y divide-line border-y border-line">
              {group.modifiers.length === 0 ? (
                <li className="py-3 text-sm text-muted">{t("noOptions")}</li>
              ) : null}
              {group.modifiers.map((modifier) => (
                <li key={modifier.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{modifier.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums text-muted">
                      {modifier.price_cents === 0
                        ? t("free")
                        : `+${formatMoney(modifier.price_cents, ctx.business.currency)}`}
                    </span>
                    <form action={deleteModifier.bind(null, modifier.id)}>
                      <SubmitButton variant="danger" size="sm">
                        {t("remove")}
                      </SubmitButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>

            <ActionForm action={addModifier.bind(null, group.id)} resetOnSuccess className="mt-4">
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_9rem_auto]">
                <Field label={t("optionName")}>
                  <Input name="name" required maxLength={60} />
                </Field>
                <Field label={t("optionPrice")}>
                  <Input name="price" inputMode="decimal" placeholder="0" />
                </Field>
                <SubmitButton>{t("addOption")}</SubmitButton>
              </div>
            </ActionForm>

            <form action={deleteModifierGroup.bind(null, group.id)} className="mt-4">
              <SubmitButton variant="danger" size="sm">
                {t("deleteGroup")}
              </SubmitButton>
            </form>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-bold">{t("newGroup")}</h2>
        <p className="mt-1 text-sm text-muted">{t("newGroupHint")}</p>
        <ActionForm action={saveModifierGroup.bind(null, null)} resetOnSuccess className="mt-3">
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_7rem_auto]">
            <Field label={t("groupName")}>
              <Input name="name" required maxLength={60} placeholder={t("groupPlaceholder")} />
            </Field>
            <Field label={t("min")}>
              <Input name="min_select" type="number" min={0} max={20} required defaultValue={0} />
            </Field>
            <Field label={t("max")}>
              <Input name="max_select" type="number" min={1} max={20} required defaultValue={1} />
            </Field>
            <SubmitButton>{t("add")}</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
