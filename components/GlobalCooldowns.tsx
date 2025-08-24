// components/GlobalCooldowns.tsx
"use client";
import { useEffect, useState } from "react";
import Countdown from "./Countdown";

type Status = {
  investigationUntil: string | null;
  readyAt: { nepfactuur: string | null; vriendje: string | null };
};

export default function GlobalCooldowns() {
  const [status, setStatus] = useState<Status | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/game/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Status;
      setStatus(data);
    } catch {}
  }

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 15000);

    const onUpdate = () => fetchStatus();
    window.addEventListener("cooldowns:update", onUpdate);

    return () => {
      clearInterval(t);
      window.removeEventListener("cooldowns:update", onUpdate);
    };
  }, []);

  if (!status) return null;

  const { investigationUntil, readyAt } = status;
  const hasAnything = investigationUntil || readyAt.nepfactuur || readyAt.vriendje;
  if (!hasAnything) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-black/80 text-white px-4 py-3 shadow-lg space-y-1">
      {investigationUntil ? (
        <div className="text-sm">
          🔒 Onderzoek: <Countdown until={investigationUntil} />
        </div>
      ) : (
        <>
          <div className="text-sm">
            🧾 Nepfactuur:{" "}
            {readyAt.nepfactuur ? <Countdown until={readyAt.nepfactuur} /> : "klaar"}
          </div>
          <div className="text-sm">
            👶 Vriendje:{" "}
            {readyAt.vriendje ? <Countdown until={readyAt.vriendje} /> : "klaar"}
          </div>
        </>
      )}
    </div>
  );
}
