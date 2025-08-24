// components/Countdown.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

export default function Countdown({ until }: { until: string | Date }) {
  const target = useMemo(() => new Date(until).getTime(), [until]);
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 250);
    const onVis = () => setRemaining(Math.max(0, target - Date.now()));
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(id);
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [target]);

  if (remaining <= 0) return null;

  const totalSec = Math.floor(remaining / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return <span className="font-mono">{m}:{s}</span>;
}
