// app/kantoor/ui/InvestigationStartForm.tsx
"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type UserLite = { id: number; name: string; level: number };

const PER_INVESTIGATOR_FACTOR = 0.95; // zelfde als server
const BASE_PREVIEW_HOURS = 3.5;       // stabiele indicatie (midden 3–4u)
const MIN_PREVIEW_MIN = 30;           // ⬅️ minimale duur in preview

function levelPenaltyFactor(level: number) {
  const L = Math.max(1, Math.floor(level || 1));
  return 1 + 0.20 * (L - 1); // +20% per level
}

function estimateDurationMs(assigned: number, targetLevel: number) {
  const n = Math.max(1, Math.floor(assigned));
  const penalty = levelPenaltyFactor(targetLevel);
  const effective = Math.max(1, Math.floor(n / penalty));
  const baseMs = BASE_PREVIEW_HOURS * 60 * 60 * 1000;
  const speedFactor = Math.pow(PER_INVESTIGATOR_FACTOR, Math.max(0, effective - 1));
  const ms = baseMs * speedFactor;
  // ⬇️ respecteer minimum van 30 min voor de preview
  return Math.max(ms, MIN_PREVIEW_MIN * 60 * 1000);
}

function fmtDuration(ms: number) {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m} min`;
  return `${h}u ${m}m`;
}

export default function InvestigationStartForm({ maxAssignable }: { maxAssignable: number }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [count, setCount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // zoeken
  const debounced = useMemo(() => term, [term]);
  useEffect(() => {
    const id = setTimeout(async () => {
      const q = debounced.trim();
      if (!q) { setResults([]); return; }
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Array<{ id: number; name: string; level: number }>;
      setResults(data);
    }, 250);
    return () => clearTimeout(id);
  }, [debounced]);

  const targetLevel = selected?.level ?? 1;
  const penalty = levelPenaltyFactor(targetLevel);
  const recommendedMin = Math.ceil(1 * penalty);
  const previewMs = estimateDurationMs(count, targetLevel);

  const onStart = () => {
    if (!selected) { alert("Kies eerst een doelwit."); return; }
    if (count < 1) { alert("Minimaal 1 onderzoeker."); return; }
    if (count > maxAssignable) { alert("Zoveel onderzoekers heb je niet vrij."); return; }

    startTransition(async () => {
      const res = await fetch("/api/game/investigations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetName: selected.name, count }),
      });
      const txt = await res.text().catch(()=>"");
      if (!res.ok) { alert(txt || "Starten mislukt"); return; }
      alert("Onderzoek gestart.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {/* zoeken */}
      <div>
        <label className="block text-sm mb-1">Zoek doelwit</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="type naam…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {term.trim() && results.length > 0 && (
          <ul className="mt-2 border rounded max-h-48 overflow-y-auto divide-y">
            {results.map(u => (
              <li
                key={u.id}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selected?.id === u.id ? "bg-gray-200" : ""}`}
                onClick={() => setSelected(u)}
              >
                {u.name} <span className="text-xs text-gray-500">• level {u.level}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* gekozen + hints */}
      <div className="text-sm space-y-1">
        <div>
          Gekozen: <b>{selected ? selected.name : "— nog geen speler —"}</b>
          {selected && <> <span className="text-gray-500"> (level {targetLevel})</span></>}
        </div>
        {selected && (
          <>
            <div>Penalty: <b>{Math.round((penalty - 1) * 100)}%</b> zwaarder dan level 1</div>
            <div>Aanbevolen (minimaal): <b>{recommendedMin}</b> onderzoekers</div>
          </>
        )}
      </div>

      {/* aantal + preview */}
      <div>
        <label className="block text-sm mb-1">Aantal onderzoekers</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, maxAssignable)}
          className="border rounded px-3 py-2 w-32"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value))))}
        />
        <p className="text-xs text-gray-500">
          Vrij beschikbaar: {maxAssignable}
          {selected && <> • Verwachte duur: <b>{fmtDuration(previewMs)}</b> (min. 30 min)</>}
        </p>
      </div>

      <button
        className="rounded px-3 py-2 bg-blue-600 text-white disabled:opacity-50"
        disabled={isPending}
        onClick={onStart}
      >
        {isPending ? "Starten…" : "Start onderzoek"}
      </button>
    </div>
  );
}
