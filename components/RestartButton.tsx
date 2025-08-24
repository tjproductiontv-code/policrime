"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestartButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setErr(null);
    if (!confirm("Weet je zeker dat je opnieuw wilt beginnen?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/game/restart", {
        method: "POST",
        credentials: "include", // ⭐ stuur cookies mee
        cache: "no-store",      // ⭐ geen cache
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok !== true) {
        console.error("Restart failed:", { status: res.status, data });
        setErr(data?.error ?? "Reset mislukt");
        return;
      }

      // Extra check: log de nieuwe status
      console.log("Restart OK:", { after: data.after });

      // Harde nav + cache-buster om alles te verversen
      window.location.assign(`/dashboard?reset=1&ts=${Date.now()}`);
    } catch (e: any) {
      setErr(e?.message ?? "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={[
          "inline-flex items-center gap-2 rounded-xl px-4 py-2",
          "bg-red-600 text-white shadow hover:bg-red-700 disabled:opacity-60",
          "focus:outline-none focus:ring-2 focus:ring-red-500"
        ].join(" ")}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8v4" stroke="currentColor" strokeWidth="4" />
            </svg>
            Reset bezig…
          </>
        ) : (
          <>Opnieuw beginnen</>
        )}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
