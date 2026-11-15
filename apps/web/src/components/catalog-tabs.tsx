import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cx } from "@/components/ui";

export async function CatalogTabs({ active }: { active: "items" | "modifiers" }) {
  const t = await getTranslations("panel.catalog");
  const tabs = [
    { key: "items", href: "/panel/catalogo", label: t("tabs.items") },
    { key: "modifiers", href: "/panel/catalogo/modificadores", label: t("tabs.modifiers") },
  ] as const;
  return (
    <div className="mb-6 flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={cx(
            "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold",
            tab.key === active ? "border-brand text-brand-dark" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
