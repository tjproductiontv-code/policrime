// components/EarnActionButton.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Countdown from "./Countdown";

type Props = {
  endpoint: string;
  label: string;
  /** Absolute eindtijd (ISO) wanneer de cooldown ophoudt (server truth) */
  readyAt?: string | null;
  /** Fallback in seconden (alleen gebruiken als je geen readyAt kunt doorgeven) */
  initialCooldown?: number;
  /** Hoofdknop blokkeren (bijv. tijdens onderzoek) */
  locked?: boolean;
};

export function EarnActionButton({
  endpoint,
  label,
  readyAt = null,
  initialCooldown = 0,
  locked = false,
}: Props) {
  const router = useRouter();

  // Als we geen readyAt hebben, gebruik lokale target-tijd op basis van initialCooldown (in seconden)
  const [fallbackTargetMs, setFallbackTargetMs] = useState<number | null>(() =>
    initialCooldown > 0 ? Date.now() + initialCooldown * 1000 : null
  );

  // Kies het target voor de countdown (server-ISO of lokale fallback)
  const targetMs = useMemo(() => {
    if (readyAt) {
      const t = Date.parse(readyAt);
      return Number.isFinite(t) ? t : null;
    }
    return fallbackTargetMs;
  }, [readyAt, fallbackTargetMs]);

  // Live resterende tijd in ms
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    targetMs ? Math.max(0, targetMs - Date.now()) : 0
  );

  // Tick elke 250ms + resync bij focus/visibility change
  useEffect(() => {
    if (!targetMs) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(Math.max(0, targetMs - Date.now()));
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
  }, [targetMs]);

  const remainingSec = Math.ceil(remainingMs / 1000);
  const onCooldown = remainingSec > 0;

  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null); // 👈 nieuw

  const onClick = async () => {
    if (onCooldown || loading || locked) return;

    try {
      setLoading(true);
      const res = await fetch(endpoint, { method: "POST" });

      // Probeer response JSON te lezen (ook bij 200)
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok) {
        // 🎉 Succes: toon reward/caught feedback als meegegeven
        if (data && typeof data.rewardVotes === "number" && data.rewardVotes > 0) {
          setFlash(`+${data.rewardVotes} stemmen ontvangen`);
          setTimeout(() => setFlash(null), 4000);
        } else if (data && data.caught) {
          setFlash("Gepakt!");
          setTimeout(() => setFlash(null), 4000);
        }

        router.refresh();
        window.dispatchEvent(new Event("cooldowns:update"));
        return;
      }

      // Server kan COOLDOWN teruggeven
      if (data?.error === "COOLDOWN") {
        // ✅ accepteer zowel remainingMs (ms) als remaining (sec)
        const ms =
          typeof data.remainingMs === "number"
            ? data.remainingMs
            : typeof data.remaining === "number"
            ? data.remaining * 1000
            : 0;

        if (!readyAt && ms > 0) {
          setFallbackTargetMs(Date.now() + ms);
        }
      }

      // UI sync
      router.refresh();
      window.dispatchEvent(new Event("cooldowns:update"));
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || locked || onCooldown;

  return (
    <div className="rounded-md border p-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className="rounded-md px-3 py-2 bg-emerald-600 text-white disabled:opacity-50"
        title={onCooldown ? `Nog ${fmt(remainingSec)} cooldown` : ""}
      >
        {loading ? "Bezig..." : onCooldown ? "Nog cooldown" : label}
      </button>

      {/* Cooldown info tonen zolang hij echt loopt */}
      {readyAt ? (
        <p className="text-sm text-gray-600 mt-2">
          Nog <Countdown until={readyAt} /> cooldown
        </p>
      ) : remainingSec > 0 ? (
        <p className="text-sm text-gray-600 mt-2">
          Nog <Countdown until={new Date(Date.now() + remainingSec * 1000)} /> cooldown
        </p>
      ) : null}

      {/* 🎉 Flash-bericht */}
      {flash && <p className="text-sm text-emerald-700 mt-2">{flash}</p>}
    </div>
  );
}

/** Format als mm:ss voor tooltip/aria */
function fmt(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default EarnActionButton;
