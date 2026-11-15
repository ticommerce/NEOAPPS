"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui";

export type DemoScript = {
  id: string;
  label: string;
  business: string;
  messages: Array<{ from: "customer" | "agent"; text: string }>;
};

// Conversación de ejemplo que se va mostrando mensaje por mensaje.
export function ChatDemo({
  scripts,
  labels,
}: {
  scripts: DemoScript[];
  labels: { tabs: string; online: string; replay: string; typing: string; note: string };
}) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(1);
  const script = scripts[active];
  const done = shown >= script.messages.length;

  useEffect(() => {
    if (done) return;
    const next = script.messages[shown];
    const timer = setTimeout(() => setShown((n) => n + 1), next.from === "agent" ? 1500 : 1100);
    return () => clearTimeout(timer);
  }, [shown, done, script]);

  const select = (index: number) => {
    setActive(index);
    setShown(1);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div role="tablist" aria-label={labels.tabs} className="mb-3 flex justify-center gap-2">
        {scripts.map((s, index) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={index === active}
            onClick={() => select(index)}
            className={cx(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              index === active ? "bg-ink text-white" : "bg-white text-muted hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_-30px_rgba(17,35,29,0.45)]">
        <div className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-display text-sm font-bold"
          >
            {script.business.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{script.business}</p>
            <p className="text-xs text-white/80">{labels.online}</p>
          </div>
        </div>

        <div
          className="flex h-[470px] flex-col justify-end gap-2 overflow-hidden bg-sand/60 p-4"
          aria-live="polite"
        >
          {script.messages.slice(0, shown).map((message, index) => (
            <p
              key={`${script.id}-${index}`}
              className={cx(
                "bubble-in max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-snug",
                message.from === "customer"
                  ? "self-end rounded-br-md bg-brand-soft text-ink"
                  : "self-start rounded-bl-md bg-white text-ink shadow-sm",
              )}
            >
              {message.text}
            </p>
          ))}
          {!done && script.messages[shown].from === "agent" ? (
            <p
              aria-label={labels.typing}
              className="flex gap-1 self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm"
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-muted"
                  style={{ animationDelay: `${dot * 0.2}s` }}
                />
              ))}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="text-xs text-muted">{labels.note}</p>
          <button
            type="button"
            onClick={() => setShown(1)}
            className="shrink-0 text-xs font-semibold text-brand hover:underline"
          >
            {labels.replay}
          </button>
        </div>
      </div>
    </div>
  );
}
