// components/dashboardhealthcard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** Titel bovenaan, default: "Reputatie" */
  title?: string;
  /** Huidige reputatie in %, 0..100 (alias: value) */
  percent?: number;
  value?: number;
  /** Subtiele uitleg onder de balk */
  hint?: string;
  /** Drempels voor kleur (rood/oranje/groen). Default: 33/66 */
  warnAt?: number;
  okAt?: number;
  /** Extra CSS classes voor outer card */
  className?: string;
  /** Als reputatie 0 is, kun je een reset-actie meegeven (bijv. opnieuw beginnen) */
  onReset?: () => Promise<void> | void;
  resetLabel?: string; // default: "Opnieuw beginnen"
  /** Hoogte van de balk: sm | md | lg (default: md) */
  size?: "sm" | "md" | "lg";
  /** Toon %-label ín de balk (default: true) */
  showLabelInBar?: boolean;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export default function DashboardHealthCard({
  title = "Reputatie",
  percent,
  value,
  hint,
  warnAt = 33,
  okAt = 66,
  className,
  onReset,
  resetLabel = "Opnieuw beginnen",
  size = "md",
  showLabelInBar = true,
}: Props) {
  // Ondersteun zowel percent als value
  const raw = typeof percent === "number" ? percent : (value ?? 0);
  const targetPct = clamp(Math.round(raw));

  // Animatie van vorige naar nieuwe waarde
  const [pct, setPct] = useState<number>(targetPct);
  const prev = useRef<number>(targetPct);

  useEffect(() => {
    const from = prev.current;
    const to = targetPct;
    prev.current = to;
    if (from === to) {
      setPct(to);
      return;
    }
    const steps = 12; // ~190ms
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      const v = Math.round(from + (i / steps) * (to - from));
      setPct(v);
      if (i >= steps) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [targetPct]);

  // Kleur op basis van drempels
  const tone = useMemo(() => {
    if (pct <= warnAt) return "red";
    if (pct < okAt) return "amber";
    return "green";
  }, [pct, warnAt, okAt]);

  const barHeight =
    size === "lg" ? "h-3.5" : size === "sm" ? "h-1.5" : "h-2.5";

  const fillClass =
    tone === "red"
      ? "bg-red-600"
      : tone === "amber"
      ? "bg-amber-500"
      : "bg-emerald-600";

  const badgeClass =
    tone === "red"
      ? "text-red-700"
      : tone === "amber"
      ? "text-amber-700"
      : "text-emerald-700";

  const statusText =
    tone === "red" ? "Kritiek" : tone === "amber" ? "Kwetsbaar" : "Sterk";

  return (
    <div
      className={[
        "rounded-2xl border bg-white/85 backdrop-blur-sm shadow-sm p-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-gray-900">{pct}%</div>
            <span className={`text-xs font-medium ${badgeClass}`}>{statusText}</span>
          </div>
        </div>

        {pct === 0 && onReset && (
          <button
            onClick={() => void onReset()}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {resetLabel}
          </button>
        )}
      </div>

      {/* Balk */}
      <div
        className={`mt-3 w-full rounded-full bg-gray-200/70 overflow-hidden ${barHeight}`}
        aria-label={`${title} ${pct}%`}
        title={`${title}: ${pct}%`}
      >
        <div
          className={`relative h-full ${fillClass} transition-[width]`}
          style={{ width: `${pct}%` }}
        >
          {showLabelInBar && (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white/95 select-none">
              {pct}%
            </span>
          )}
        </div>
      </div>

      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
