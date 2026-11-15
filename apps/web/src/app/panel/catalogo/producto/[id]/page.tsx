import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Card, Field, Input, Select, Textarea, buttonClass } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct, saveProduct } from "../../../actions";

export default async function ProductPage({ params }: PageProps<"/panel/catalogo/producto/[id]">) {
  const { id } = await params;
  const isNew = id === "nuevo";
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.product");
  const supabase = await createClient();
  const businessId = ctx.business.id;

  const [{ data: categories }, { data: groups }, product] = await Promise.all([
    supabase.from("categories").select("id, name").eq("business_id", businessId).order("position"),
    supabase.from("modifier_groups").select("id, name").eq("business_id", businessId).order("created_at"),
    isNew || !/^[0-9a-f-]{36}$/i.test(id)
      ? null
      : supabase
          .from("products")
          .select("*, product_modifier_groups(group_id)")
          .eq("business_id", businessId)
          .eq("id", id)
          .maybeSingle()
          .then((result) => result.data),
  ]);
  if (!isNew && !product) notFound();

  const linked = new Set(product?.product_modifier_groups.map((link) => link.group_id));
  const defaultKind = product?.kind ?? (ctx.business.type === "restaurant" ? "product" : "service");

  return (
    <>
      <PageHeader title={isNew ? t("newTitle") : t("editTitle")} />
      <Card>
        <ActionForm action={saveProduct.bind(null, product?.id ?? null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name")} className="sm:col-span-2">
              <Input name="name" required maxLength={100} defaultValue={product?.name} />
            </Field>
            <Field label={t("description")} hint={t("descriptionHint")} className="sm:col-span-2">
              <Textarea name="description" maxLength={500} defaultValue={product?.description} />
            </Field>
            <Field label={t("price", { currency: ctx.business.currency })}>
              <Input
                name="price"
                required
                inputMode="decimal"
                placeholder="3500"
                defaultValue={product ? String(product.price_cents / 100) : ""}
              />
            </Field>
            <Field label={t("category")}>
              <Select name="category_id" defaultValue={product?.category_id ?? ""}>
                <option value="">{t("noCategory")}</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("kind")} hint={t("kindHint")}>
              <Select name="kind" defaultValue={defaultKind}>
                <option value="product">{t("kindProduct")}</option>
                <option value="service">{t("kindService")}</option>
              </Select>
            </Field>
            <Field label={t("duration")} hint={t("durationHint")}>
              <Input
                name="duration_minutes"
                type="number"
                min={5}
                max={600}
                step={5}
                defaultValue={product?.duration_minutes ?? ""}
              />
            </Field>
          </div>

          {(groups ?? []).length > 0 ? (
            <fieldset className="mt-5">
              <legend className="text-sm font-medium">{t("modifiers")}</legend>
              <p className="text-xs text-muted">{t("modifiersHint")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(groups ?? []).map((group) => (
                  <label
                    key={group.id}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                  >
                    <input
                      type="checkbox"
                      name="groups"
                      value={group.id}
                      defaultChecked={linked.has(group.id)}
                      className="accent-brand"
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <label className="mt-5 flex items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              name="available"
              defaultChecked={product?.available ?? true}
              className="h-4 w-4 accent-brand"
            />
            {t("available")}
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <SubmitButton>{t("save")}</SubmitButton>
            <Link href="/panel/catalogo" className={buttonClass("secondary")}>
              {t("cancel")}
            </Link>
          </div>
        </ActionForm>
      </Card>

      {product ? (
        <form action={deleteProduct.bind(null, product.id)} className="mt-6">
          <SubmitButton variant="danger">{t("delete")}</SubmitButton>
        </form>
      ) : null}
    </>
  );
}
