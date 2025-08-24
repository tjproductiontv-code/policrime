"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { estimateInvestigationMs, formatDuration, minInvestigatorsForRank } from "../lib/investigations";

type UserResult = { id: number; name: string | null; level: number | null };

export default function InvestigatorStartCard({
  available,
  minRequired,
  pricePerInvestigator,
}: {
  available: number;
  minRequired: number;
  pricePerInvestigator: number;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [target, setTarget] = useState<UserResult | null>(null);
  const [count, setCount] = useState(minRequired);
  const abortRef = useRef<AbortController | null>(null);

  // Live zoeken met debounce (300ms) – alleen op naam
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`, {
          signal: ac.signal,
        });
        const data = await res.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Als je een target kiest, stel minimum aantal in op basis van zijn rank
  useEffect(() => {
    if (!target) return;
    const lvl = target.level ?? 1;
    const req = minInvestigatorsForRank(lvl);
    setCount((c) => Math.max(req, Math.min(available, c)));
  }, [target, available]);

  // Schatting voor UI
  const estimateText = useMemo(() => {
    if (!target || count < 1) return "";
    const lvl = target.level ?? 1;
    const ms = estimateInvestigationMs(count, lvl);
    return `Geschatte duur: ± ${formatDuration(ms)}`;
  }, [target, count]);

  async function startInvestigation() {
    if (!target) return;
    const res = await fetch("/api/game/investigations/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: target.id, count }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error ?? "Er ging iets mis.");
      return;
    }
    alert(`Onderzoek gestart tegen ${target.name ?? `#${target.id}`}.`);
    // window.location.reload(); // of router.refresh() als je de router hier wilt gebruiken
  }

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold">Onderzoek starten</h2>

      {/* live zoeken (geen knop) */}
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="Zoek speler op naam (min. 2 letters)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <div className="text-sm text-gray-500">Zoeken…</div>}

      {results.length > 0 && (
        <ul className="border rounded divide-y">
          {results.map((u) => (
            <li
              key={u.id}
              className={`p-2 cursor-pointer hover:bg-gray-50 ${target?.id === u.id ? "bg-gray-50" : ""}`}
              onClick={() => setTarget(u)}
            >
              <div className="font-medium">{u.name ?? `Speler #${u.id}`}</div>
              <div className="text-sm text-gray-500">Rank {u.level ?? 1}</div>
            </li>
          ))}
        </ul>
      )}

      {target && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Doelwit: <b>{target.name ?? `Speler #${target.id}`}</b> (rank {target.level ?? 1}) • Beschikbaar: <b>{available}</b>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm">Aantal in te zetten</label>
            <input
              type="number"
              className="w-24 border rounded px-2 py-1"
              min={1}
              max={available}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(available, Math.floor(Number(e.target.value) || 1))))
              }
            />
            <span className="text-sm text-gray-600">
              Kost: €{(count * pricePerInvestigator).toLocaleString("nl-NL")}
            </span>
          </div>

          {/* duur-indicatie */}
          {estimateText && <div className="text-sm text-gray-700">{estimateText}</div>}

          <button
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={startInvestigation}
            disabled={!target || count < 1 || count > available}
          >
            Start onderzoek
          </button>
        </div>
      )}
    </section>
  );
}
