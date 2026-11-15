import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { ChatDemo, type DemoScript } from "@/components/landing/chat-demo";
import { icons, type IconName } from "@/components/landing/icons";
import { Field, Input, Select, Textarea, buttonClass, cx } from "@/components/ui";
import { pricing } from "@/config/pricing";
import { site, whatsappLink } from "@/config/site";
import { formatMoney } from "@/lib/money";
import { submitLead } from "./actions";

type TextItem = { title: string; body: string };
type FeatureItem = TextItem & { icon: IconName };
type FaqItem = { q: string; a: string };

function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="mt-3 text-lg text-muted text-pretty">{lead}</p> : null}
    </div>
  );
}

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const nav = ["how", "features", "industries", "pricing", "faq"] as const;
  const steps = t.raw("how.steps") as TextItem[];
  const features = t.raw("features.items") as FeatureItem[];
  const industries = t.raw("industries.items") as TextItem[];
  const included = t.raw("pricing.included") as string[];
  const faqs = t.raw("faq.items") as FaqItem[];
  const scripts = t.raw("demo.scripts") as DemoScript[];
  const industryOptions = t.raw("contact.industries") as string[];
  const wa = whatsappLink(t("whatsappMessage"));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: site.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: t("hero.lead"),
        offers: {
          "@type": "Offer",
          price: pricing.monthlyCents / 100,
          priceCurrency: pricing.currency,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white"
            >
              R
            </span>
            {site.name}
          </Link>
          <nav aria-label={t("nav.label")} className="hidden items-center gap-6 text-sm font-medium text-muted lg:flex">
            {nav.map((key) => (
              <a key={key} href={`#${key}`} className="hover:text-ink">
                {t(`nav.${key}`)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/ingresar" className={cx(buttonClass("ghost", "sm"), "hidden sm:inline-flex")}>
              {t("nav.login")}
            </Link>
            <a href="#contacto" className={buttonClass("primary", "sm")}>
              {t("nav.cta")}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-brand-soft blur-3xl"
          />
          <div
            aria-hidden
            className="absolute bottom-[-30%] left-[-10%] h-[380px] w-[380px] rounded-full bg-sun-soft blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-muted">
                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
                {t("hero.eyebrow")}
              </p>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted text-pretty">{t("hero.lead")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#contacto" className={buttonClass("primary", "lg")}>
                  {t("hero.primary")}
                </a>
                <a href={wa} target="_blank" rel="noopener" className={buttonClass("secondary", "lg")}>
                  <icons.whatsapp className="h-5 w-5 text-[#1fa855]" />
                  {t("hero.secondary")}
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {(t.raw("hero.points") as string[]).map((point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <icons.check className="h-4 w-4 text-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div id="demo">
              <ChatDemo
                scripts={scripts}
                labels={{
                  tabs: t("demo.tabs"),
                  online: t("demo.online"),
                  replay: t("demo.replay"),
                  typing: t("demo.typing"),
                  note: t("demo.note"),
                }}
              />
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="how" className="scroll-mt-20 border-y border-line bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow={t("how.eyebrow")} title={t("how.title")} />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-cream p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Funciones */}
        <section id="features" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("features.eyebrow")}
              title={t("features.title")}
              lead={t("features.lead")}
            />
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const FeatureIcon = icons[feature.icon];
                return (
                  <li key={feature.title} className="rounded-2xl border border-line bg-white p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <FeatureIcon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{feature.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Industrias */}
        <section id="industries" className="scroll-mt-20 bg-ink py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-sun">
                {t("industries.eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {t("industries.title")}
              </h2>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {industries.map((industry) => (
                <li key={industry.title} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                  <h3 className="font-display text-lg font-bold">{industry.title}</h3>
                  <p className="mt-2 text-sm text-white/75">{industry.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Precios */}
        <section id="pricing" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("pricing.eyebrow")}
              title={t("pricing.title")}
              lead={t("pricing.lead")}
            />
            <div className="mx-auto mt-12 grid max-w-3xl overflow-hidden rounded-3xl border border-line bg-white md:grid-cols-[1fr_1.1fr]">
              <div className="bg-brand p-8 text-white">
                <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
                  {t("pricing.monthlyLabel")}
                </p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-tight">
                  {formatMoney(pricing.monthlyCents, pricing.currency)}
                </p>
                <p className="text-sm text-white/80">{t("pricing.perMonth")}</p>
                <div className="mt-6 border-t border-white/25 pt-6">
                  <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
                    {t("pricing.setupLabel")}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {formatMoney(pricing.setupCents, pricing.currency)}
                  </p>
                  <p className="text-sm text-white/80">{t("pricing.setupNote")}</p>
                </div>
              </div>
              <div className="p-8">
                <p className="font-display text-lg font-bold">{t("pricing.includedTitle")}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {included.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <icons.check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#contacto" className={cx(buttonClass("primary", "lg"), "mt-8 w-full")}>
                  {t("pricing.cta")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="faq" className="scroll-mt-20 border-y border-line bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
            <div className="mt-10 divide-y divide-line rounded-2xl border border-line">
              {faqs.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      aria-hidden
                      className="text-xl leading-none text-brand transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">
                {t("contact.eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {t("contact.title")}
              </h2>
              <p className="mt-3 text-lg text-muted">{t("contact.lead")}</p>
              <a href={wa} target="_blank" rel="noopener" className={cx(buttonClass("secondary", "lg"), "mt-6")}>
                <icons.whatsapp className="h-5 w-5 text-[#1fa855]" />
                {t("contact.whatsapp")}
              </a>
            </div>
            <ActionForm
              action={submitLead}
              resetOnSuccess
              className="rounded-3xl border border-line bg-white p-6 sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("contact.name")}>
                  <Input name="name" required minLength={2} maxLength={120} autoComplete="name" />
                </Field>
                <Field label={t("contact.phone")}>
                  <Input name="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" placeholder="8888 8888" />
                </Field>
                <Field label={t("contact.business")}>
                  <Input name="business_name" maxLength={120} autoComplete="organization" />
                </Field>
                <Field label={t("contact.industry")}>
                  <Select name="industry" defaultValue="">
                    <option value="">{t("contact.industryPlaceholder")}</option>
                    {industryOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("contact.email")} className="sm:col-span-2">
                  <Input name="email" type="email" maxLength={200} autoComplete="email" />
                </Field>
                <Field label={t("contact.message")} className="sm:col-span-2">
                  <Textarea name="message" maxLength={2000} />
                </Field>
              </div>
              <div className="hidden" aria-hidden>
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <SubmitButton size="lg" className="mt-5 w-full">
                {t("contact.submit")}
              </SubmitButton>
            </ActionForm>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}. {t("footer.rights")}
          </p>
          <div className="flex gap-5">
            <Link href="/ingresar" className="hover:text-ink">
              {t("nav.login")}
            </Link>
            <a href="#contacto" className="hover:text-ink">
              {t("footer.contact")}
            </a>
          </div>
        </div>
      </footer>

      <a
        href={wa}
        target="_blank"
        rel="noopener"
        aria-label={t("whatsappFab")}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105"
      >
        <icons.whatsapp className="h-7 w-7" />
      </a>
    </>
  );
}
