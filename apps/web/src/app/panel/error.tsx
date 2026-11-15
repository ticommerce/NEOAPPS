"use client";

import { useTranslations } from "next-intl";
import { buttonClass } from "@/components/ui";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("panel.error");
  return (
    <div className="rounded-2xl border border-line bg-white p-8 text-center">
      <h1 className="font-display text-xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("body")}</p>
      <button type="button" onClick={reset} className={`${buttonClass("primary")} mt-5`}>
        {t("retry")}
      </button>
    </div>
  );
}
