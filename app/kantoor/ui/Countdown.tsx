"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  to: string | number | Date;      // doelmoment (ISO string, timestamp of Date)
  refreshOnDone?: boolean;          // auto router.refresh() op 0
  className?: string;
};

export default function Countdown({ to, refreshOnDone = true, className }: Props) {
  const router = useRouter();

  // parse target once
  const targetMs = useMemo(() => {
    const d = typeof to === "string" || typeof to === "number" ? new Date(to) : to;
    const ms = d instanceof Date ? d.getTime() : NaN;
    return Number.isFinite(ms) ? ms : NaN;
  }, [to]);

  const [now, setNow] = useState(() => Date.now());

  // tik elke seconde
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!Number.isFinite(targetMs)) return <span>—</span>;

  const diff = Math.max(0, targetMs - now);
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const text = d > 0 ? `${d}:${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;

  // als hij 0 bereikt, kleine delay en refresh de pagina/gegevens
  useEffect(() => {
    if (totalSec === 0 && refreshOnDone) {
      const t = setTimeout(() => router.refresh(), 500);
      return () => clearTimeout(t);
    }
  }, [totalSec, refreshOnDone, router]);

  return (
    <span
      suppressHydrationWarning
      className={`font-mono tabular-nums ${className ?? ""}`}
      title={new Date(targetMs).toLocaleString()}
      aria-label="aftellen"
    >
      {text}
    </span>
  );
}
