import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { CatalogTabs } from "@/components/catalog-tabs";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, Input, buttonClass } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  setProductAvailable,
} from "../actions";

export default async function CatalogPage() {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.catalog");
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("business_id", ctx.business.id).order("position").order("created_at"),
    supabase
      .from("products")
      .select("id, name, description, price_cents, kind, duration_minutes, available, category_id")
      .eq("business_id", ctx.business.id)
      .order("position")
      .order("created_at"),
  ]);

  const groups = [
    ...(categories ?? []).map((category) => ({
      category,
      items: (products ?? []).filter((p) => p.category_id === category.id),
    })),
    { category: null, items: (products ?? []).filter((p) => p.category_id === null) },
  ].filter((group) => group.category !== null || group.items.length > 0);

  return (
    <>
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        action={
          <Link href="/panel/catalogo/producto/nuevo" className={buttonClass("primary")}>
            {t("newItem")}
          </Link>
        }
      />
      <CatalogTabs active="items" />

      {groups.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-lg font-bold">{t("empty.title")}</p>
          <p className="mt-1 text-muted">{t("empty.body")}</p>
        </Card>
      ) : null}

      <div className="space-y-5">
        {groups.map(({ category, items }) => (
          <Card key={category?.id ?? "none"} className="p-0 sm:p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <h2 className="font-display text-lg font-bold">{category?.name ?? t("uncategorized")}</h2>
              {category ? (
                <details className="relative">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-brand hover:underline [&::-webkit-details-marker]:hidden">
                    {t("editCategory")}
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-line bg-white p-4 shadow-lg">
                    <ActionForm action={renameCategory.bind(null, category.id)}>
                      <div className="flex gap-2">
                        <Input name="name" defaultValue={category.name} required maxLength={60} aria-label={t("categoryName")} />
                        <SubmitButton size="sm">{t("save")}</SubmitButton>
                      </div>
                    </ActionForm>
                    <form action={deleteCategory.bind(null, category.id)} className="mt-3 border-t border-line pt-3">
                      <SubmitButton variant="danger" size="sm">
                        {t("deleteCategory")}
                      </SubmitButton>
                      <p className="mt-1.5 text-xs text-muted">{t("deleteCategoryHint")}</p>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
            {items.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">{t("emptyCategory")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {item.name}
                        {item.kind === "service" ? (
                          <Badge tone="sun">
                            {t("serviceBadge", { minutes: item.duration_minutes ?? 0 })}
                          </Badge>
                        ) : null}
                        {!item.available ? <Badge tone="danger">{t("unavailable")}</Badge> : null}
                      </p>
                      {item.description ? (
                        <p className="mt-0.5 truncate text-sm text-muted">{item.description}</p>
                      ) : null}
                    </div>
                    <p className="font-semibold tabular-nums">
                      {formatMoney(item.price_cents, ctx.business.currency)}
                    </p>
                    <div className="flex items-center gap-2">
                      <form action={setProductAvailable.bind(null, item.id, !item.available)}>
                        <SubmitButton variant="secondary" size="sm">
                          {item.available ? t("markUnavailable") : t("markAvailable")}
                        </SubmitButton>
                      </form>
                      <Link href={`/panel/catalogo/producto/${item.id}`} className={buttonClass("secondary", "sm")}>
                        {t("edit")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-bold">{t("addCategory")}</h2>
        <ActionForm action={createCategory} resetOnSuccess className="mt-3">
          <div className="flex max-w-md gap-2">
            <Input name="name" required maxLength={60} placeholder={t("categoryPlaceholder")} aria-label={t("categoryName")} />
            <SubmitButton>{t("add")}</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
