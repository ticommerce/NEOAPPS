import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, buttonClass } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.overview");
  const supabase = await createClient();
  const id = ctx.business.id;
  const head = { count: "exact", head: true } as const;

  const [products, faqs, members, agent] = await Promise.all([
    supabase.from("products").select("id", head).eq("business_id", id),
    supabase.from("faqs").select("id", head).eq("business_id", id),
    supabase.from("memberships").select("user_id", head).eq("business_id", id),
    supabase.from("agent_settings").select("greeting, enabled, agent_name").eq("business_id", id).single(),
  ]);

  const b = ctx.business;
  const steps = [
    { key: "business", done: Boolean(b.phone && b.address), href: "/panel/negocio" },
    { key: "catalog", done: (products.count ?? 0) > 0, href: "/panel/catalogo" },
    { key: "faqs", done: (faqs.count ?? 0) > 0, href: "/panel/negocio#preguntas" },
    { key: "agent", done: Boolean(agent.data?.greeting), href: "/panel/agente" },
  ] as const;
  const pending = steps.filter((s) => !s.done).length;

  const stats = [
    { label: t("stats.products"), value: products.count ?? 0 },
    { label: t("stats.faqs"), value: faqs.count ?? 0 },
    { label: t("stats.members"), value: members.count ?? 0 },
  ];

  return (
    <>
      <PageHeader title={t("title", { name: b.name })} lead={t("lead")} />

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold">{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">{t("setup.title")}</h2>
          <Badge tone={pending === 0 ? "brand" : "sun"}>
            {pending === 0 ? t("setup.ready") : t("setup.pending", { count: pending })}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{t("setup.lead")}</p>
        <ul className="mt-4 divide-y divide-line">
          {steps.map((step) => (
            <li key={step.key} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={
                    step.done
                      ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white"
                      : "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-line"
                  }
                >
                  {step.done ? "✓" : ""}
                </span>
                <div>
                  <p className="font-medium">{t(`setup.steps.${step.key}.title`)}</p>
                  <p className="text-sm text-muted">{t(`setup.steps.${step.key}.body`)}</p>
                </div>
              </div>
              <Link href={step.href} className={buttonClass(step.done ? "secondary" : "primary", "sm")}>
                {step.done ? t("setup.review") : t("setup.complete")}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold">
            {t("agent.title", { name: agent.data?.agent_name ?? "" })}
          </h2>
          <Badge tone={agent.data?.enabled ? "brand" : "neutral"}>
            {agent.data?.enabled ? t("agent.on") : t("agent.off")}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{t("agent.lead")}</p>
      </Card>
    </>
  );
}
