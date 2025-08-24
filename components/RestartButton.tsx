// components/RestartButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestartButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setErr(null);
    const proceed = confirm("Weet je zeker dat je opnieuw wilt beginnen?");
    if (!proceed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/game/restart", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok || data?.ok !== true) {
        setErr(data?.error ?? "Reset mislukt");
        setLoading(false);
        return;
      }

      // Terug naar dashboard met verse data
      router.replace("/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Onbekende fout");
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
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
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
