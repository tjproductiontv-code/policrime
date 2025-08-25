// components/ConnectButton.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Key = "anika";

const FALLBACK_COOLDOWN_MS = 5 * 60 * 1000; // 5 min fallback
const LS_KEY = (key: Key) => `network:${key}:cooldownUntil`;

export default function ConnectButton({ connectionKey }: { connectionKey: Key }) {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // ── Cooldown state ───────────────────────────────────────────────────────────
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  // init from localStorage
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY(connectionKey)) : null;
    const t = raw ? Number(raw) : NaN;
    if (Number.isFinite(t) && t > Date.now()) {
      setCooldownUntil(t);
      setRemainingMs(t - Date.now());
    }
  }, [connectionKey]);

  // tick elke 250ms
  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => setRemainingMs(Math.max(0, cooldownUntil - Date.now()));
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
  }, [cooldownUntil]);

  // opruimen als klaar
  useEffect(() => {
    if (cooldownUntil && remainingMs <= 0) {
      localStorage.removeItem(LS_KEY(connectionKey));
      setCooldownUntil(null);
      setRemainingMs(0);
    }
  }, [remainingMs, cooldownUntil, connectionKey]);

  const onCooldown = (cooldownUntil ?? 0) > Date.now();
  const remainingSec = useMemo(
    () => Math.ceil(Math.max(0, remainingMs) / 1000),
    [remainingMs]
  );

  const onClick = async () => {
    if (busy || onCooldown) return;

    try {
      setBusy(true);
      setFlash(null);

      const res = await fetch("/api/game/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: connectionKey }),
      });
      const data = await res.json().catch(() => ({}));

      // Helper: start lokale cooldown met server ms of fallback
      const startCooldown = (ms?: number) => {
        const dur = typeof ms === "number" && ms > 0 ? ms : FALLBACK_COOLDOWN_MS;
        const until = Date.now() + dur;
        localStorage.setItem(LS_KEY(connectionKey), String(until));
        setCooldownUntil(until);
        setRemainingMs(dur);
      };

      if (res.ok && data?.ok) {
        // server mag cooldownMs meesturen — gebruik die, anders fallback
        startCooldown(data.cooldownMs);

        if (data.success) {
          setFlash(`Gelukt! +${((data.addedBps ?? 0) / 100).toFixed(2)}%`);
        } else {
          setFlash("Mislukt — probeer opnieuw");
        }

        if (typeof data.level === "number" && data.level >= 1) {
          window.dispatchEvent(new Event("network:statusChanged"));
        }

        // optioneel: lichte refresh om level/progress te syncen
        setTimeout(() => (window.location.href = "/netwerk"), 400);
        return;
      }

      // COOLDOWN error → gebruik remainingMs/remaining van server
      if (data?.error === "COOLDOWN") {
        const ms =
          typeof data.remainingMs === "number"
            ? data.remainingMs
            : typeof data.remaining === "number"
            ? data.remaining * 1000
            : FALLBACK_COOLDOWN_MS;
        startCooldown(ms);
        // geen extra tekst: countdown zelf is duidelijk
        return;
      }

      setFlash(data?.error ?? "Er ging iets mis");
    } finally {
      setBusy(false);
      if (flash) setTimeout(() => setFlash(null), 3000);
    }
  };

  return (
    <div className="mt-1">
      <button
        onClick={onClick}
        disabled={busy || onCooldown}
        className="rounded-md px-3 py-2 bg-emerald-600 text-white disabled:opacity-50"
        title={onCooldown ? `Nog ${fmt(remainingSec)} cooldown` : undefined}
        aria-disabled={busy || onCooldown}
      >
        {busy
          ? "Bezig..."
          : onCooldown
          ? `Nog cooldown (${fmt(remainingSec)})`
          : "Connectie bouwen"}
      </button>

      {onCooldown ? (
        <p className="text-sm text-gray-600 mt-2">
          Nog {fmt(remainingSec)} cooldown
        </p>
      ) : flash ? (
        <p className="text-sm mt-2 text-emerald-700">{flash}</p>
      ) : null}
    </div>
  );
}

function fmt(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
