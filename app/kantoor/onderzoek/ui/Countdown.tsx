"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  to: string | number | Date;    // doelmoment (ISO string, timestamp of Date)
  refreshOnDone?: boolean;       // auto router.refresh() op 0
  className?: string;
};

function toMs(v: Props["to"]): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  const parsed = Date.parse(String(v));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function Countdown({ to, refreshOnDone = true, className }: Props) {
  const router = useRouter();
  const targetMs = useMemo(() => toMs(to), [to]);
  const [now, setNow] = useState(() => Date.now());
  const doneRef = useRef(false);

  // Reset "done" wanneer target verandert
  useEffect(() => {
    doneRef.current = false;
  }, [targetMs]);

  const msLeft = Number.isFinite(targetMs) ? Math.max(0, targetMs - now) : NaN;
  const totalSec = Number.isFinite(msLeft) ? Math.floor(msLeft / 1000) : NaN;

  // Tick elke seconde zolang er tijd over is
  useEffect(() => {
    if (!Number.isFinite(targetMs) || !Number.isFinite(msLeft) || msLeft <= 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs, msLeft]);

  // Auto-refresh zodra hij 0 bereikt (eenmalig)
  useEffect(() => {
    if (!Number.isFinite(totalSec)) return;
    if (totalSec === 0 && !doneRef.current) {
      doneRef.current = true;
      if (refreshOnDone) {
        const t = setTimeout(() => router.refresh(), 250);
        return () => clearTimeout(t);
      }
    }
  }, [totalSec, refreshOnDone, router]);

  if (!Number.isFinite(targetMs)) return <span>—</span>;

  const d = Math.floor((totalSec as number) / 86400);
  const h = Math.floor(((totalSec as number) % 86400) / 3600);
  const m = Math.floor(((totalSec as number) % 3600) / 60);
  const s = (totalSec as number) % 60;

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const text = d > 0
    ? `${d}:${pad2(h)}:${pad2(m)}:${pad2(s)}`
    : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

  // kleuraccenten
  const accent =
    (totalSec as number) <= 60 ? "text-red-600"
    : (totalSec as number) <= 5 * 60 ? "text-amber-600"
    : "";

  return (
    <span
      suppressHydrationWarning
      aria-live="polite"
      title={new Date(targetMs).toLocaleString("nl-NL")}
      className={["font-mono tabular-nums", className, accent].filter(Boolean).join(" ")}
    >
      {text}
    </span>
  );
}
