import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { PanelNav } from "@/components/panel-nav";
import { Badge } from "@/components/ui";
import { site } from "@/config/site";
import { getPanelContext } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { switchBusiness } from "./actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel");
  const items = [
    { href: "/panel", label: t("nav.overview") },
    { href: "/panel/catalogo", label: t("nav.catalog") },
    { href: "/panel/negocio", label: t("nav.business") },
    { href: "/panel/agente", label: t("nav.agent") },
    { href: "/panel/equipo", label: t("nav.team") },
  ];

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 lg:block lg:px-5 lg:pt-6">
          <Link href="/panel" className="flex items-center gap-2 font-display font-bold">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
              R
            </span>
            <span className="hidden sm:inline">{site.name}</span>
          </Link>
          <div className="min-w-0 text-right lg:mt-6 lg:text-left">
            {ctx.memberships.length > 1 ? (
              <form action={switchBusiness}>
                <AutoSubmitSelect
                  name="business_id"
                  aria-label={t("switchBusiness")}
                  defaultValue={ctx.business.id}
                  className="py-1.5 font-semibold"
                >
                  {ctx.memberships.map((m) => (
                    <option key={m.business.id} value={m.business.id}>
                      {m.business.name}
                    </option>
                  ))}
                </AutoSubmitSelect>
              </form>
            ) : (
              <p className="truncate font-semibold">{ctx.business.name}</p>
            )}
            <div className="mt-1">
              <Badge tone={ctx.isOwner ? "brand" : "neutral"}>{t(`roles.${ctx.role}`)}</Badge>
            </div>
          </div>
        </div>
        <div className="px-2 py-3 lg:flex-1 lg:px-3 lg:py-6">
          <PanelNav items={items} />
        </div>
        <div className="hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-xs text-muted">{ctx.email}</p>
          <form action={signOut}>
            <button type="submit" className="mt-1 text-sm font-semibold text-muted hover:text-ink">
              {t("signOut")}
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
        <form action={signOut} className="px-4 pb-8 text-center lg:hidden">
          <button type="submit" className="text-sm font-semibold text-muted hover:text-ink">
            {t("signOut")} · {ctx.email}
          </button>
        </form>
      </div>
    </div>
  );
}
