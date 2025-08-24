// components/UseDossiersForm.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type UserLite = { id: number; name: string; email: string };

export default function UseDossiersForm() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [count, setCount] = useState(100);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null); // ⬅️ nette melding boven het formulier
  const router = useRouter();

  // Debounced zoeken
  const debounced = useMemo(() => term, [term]);
  useEffect(() => {
    const id = setTimeout(async () => {
      const q = debounced.trim();
      if (!q) { setResults([]); return; }
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as UserLite[];
        setResults(data);
      } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [debounced]);

  async function onUse() {
    setNotice(null);
    if (!selected) {
      setNotice("Selecteer eerst een speler.");
      return;
    }
    const body = { targetName: selected.name, count: Math.max(1, Math.floor(count)) };

    startTransition(async () => {
      const res = await fetch("/api/game/dossiers/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        // probeer nette foutmelding
        try {
          const d = JSON.parse(raw);
          if (d?.error === "INVESTIGATION_REQUIRED") {
            setNotice(
              "Helaas, je hebt nog geen succesvol onderzoek naar deze speler afgerond. Doe dit eerst via ‘Kantoor’ en probeer daarna opnieuw."
            );
          } else if (d?.error === "INSUFFICIENT_DOSSIERS") {
            setNotice("Je hebt onvoldoende dossiers.");
          } else if (d?.error === "TARGET_ALREADY_ELIMINATED") {
            setNotice("Deze speler is al geëlimineerd.");
          } else if (d?.error === "CANT_TARGET_SELF") {
            setNotice("Je kunt jezelf niet aanvallen.");
          } else if (d?.error) {
            setNotice(String(d.error));
          } else {
            setNotice("Actie mislukt.");
          }
        } catch {
          setNotice(raw || "Actie mislukt.");
        }
        return;
      }

      setNotice(`✅ ${body.count} dossiers ingezet op ${selected.name}.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 max-w-sm">
      {/* nette melding */}
      {notice && (
        <div className="rounded border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
          {notice}
        </div>
      )}

      {/* zoekveld */}
      <div>
        <label className="block text-sm mb-1">Zoek speler (naam)</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="typ… (min. 1 teken)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {term.trim().length > 0 && (
          results.length > 0 ? (
            <ul className="mt-2 border rounded divide-y max-h-48 overflow-y-auto">
              {results.map((u) => (
                <li
                  key={u.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    selected?.id === u.id ? "bg-gray-200" : ""
                  }`}
                  onClick={() => setSelected(u)}
                >
                  {u.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Geen spelers gevonden.</p>
          )
        )}
      </div>

      <p className="text-sm">
        Gekozen: <b>{selected ? selected.name : "— nog geen speler —"}</b>
      </p>

      {/* aantal dossiers */}
      <div>
        <label className="block text-sm mb-1">Aantal dossiers</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded px-3 py-2"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value))))}
        />
        <p className="text-xs text-gray-500 mt-1">1 dossier = 0,01 levenspunt</p>
      </div>

      <button
        className="rounded px-3 py-2 bg-rose-600 text-white disabled:opacity-50"
        disabled={isPending}
        onClick={onUse}
      >
        {isPending ? "Gebruiken..." : "Dossiers gebruiken"}
      </button>
    </div>
  );
}
