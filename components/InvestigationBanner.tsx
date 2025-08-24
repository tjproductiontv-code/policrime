"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Countdown from "@/components/Countdown";
import BuyOffButton from "@/components/BuyOffButton"; // ← deze gebruiken

export default function InvestigationBanner({ untilISO }: { untilISO: string | null }) {
  const router = useRouter();

  const target = useMemo(() => (untilISO ? Date.parse(untilISO) : NaN), [untilISO]);
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0
  );

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const tick = () => setRemainingMs(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    const onVis = () => tick();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(id);
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [target]);

  const remainingSec = Math.ceil(remainingMs / 1000);
  if (!untilISO || remainingSec <= 0) return null;

  return (
    <div className="border rounded-lg p-4 bg-yellow-50 flex items-center justify-between">
      <div className="pr-4">
        <p className="font-medium">Onderzoek actief</p>
        <p className="text-sm">
          Je kunt geen acties doen gedurende <Countdown until={untilISO} />.
        </p>
      </div>

      {/* ✅ deze knop toont automatisch “€(remainingSec * 10)” */}
      <BuyOffButton remain={remainingSec} />
    </div>
  );
}
