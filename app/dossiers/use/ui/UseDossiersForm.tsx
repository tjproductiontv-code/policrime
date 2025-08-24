"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type UserLite = { id: number; name: string | null; email: string | null; level?: number | null };

export default function UseDossiersForm({ initialDossiers = 0 }: { initialDossiers?: number }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserLite[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [count, setCount] = useState<string>("1");
  const [available, setAvailable] = useState<number>(initialDossiers);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce zoeken
  const debouncedQ = useDebounce(q, 250);

  useEffect(() => {
    let alive = true;
    setMsg(null);
    setOpen(false);
    setResults([]);

    const run = async () => {
      const s = debouncedQ.trim();
      if (s.length < 2) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(s)}`);
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        setResults(Array.isArray(data?.results) ? data.results : []);
        setOpen(true);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [debouncedQ]);

  const selectUser = (u: UserLite) => {
    setSelected(u);
    setQ(u.name || u.email || String(u.id));
    setOpen(false);
  };

  // clamp 1..min(999, available)
  const qty = useMemo(() => {
    const n = Math.floor(Number(count));
    if (!Number.isFinite(n)) return 0;
    return Math.max(1, Math.min(available > 0 ? available : 999, Math.min(999, n)));
  }, [count, available]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMsg(null);
    if (!selected?.id) {
      setMsg({ kind: "error", text: "Kies eerst een speler." });
      inputRef.current?.focus();
      return;
    }
    if (qty < 1) {
      setMsg({ kind: "error", text: "Voer een geldig aantal in (minimaal 1)." });
      return;
    }
    if (qty > available) {
      setMsg({ kind: "error", text: `Je hebt maar ${available} dossier(s) beschikbaar.` });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/game/dossiers/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: selected.id, quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const left = typeof data?.dossiersLeft === "number" ? data.dossiersLeft : Math.max(0, available - qty);
        setAvailable(left);        // ⬅️ direct in de UI verwerken
        setCount("1");             // reset input
        setMsg({
          kind: "success",
          text: `Gebruikt: ${qty} dossier(s) op ${selected.name ?? selected.email ?? "#" + selected.id}. • Over: ${left}`,
        });
        router.refresh();          // SSR-sectie (overzichten) bijwerken
      } else {
        const reason =
          data?.error === "INSUFFICIENT_DOSSIERS"
            ? `Te weinig dossiers. Nodig: ${data?.needed}, je hebt: ${data?.have}.`
            : data?.error === "NO_ELIGIBLE_INVESTIGATION"
            ? `Niet genoeg afgeronde onderzoeken op deze speler. Nodig: ${qty}, beschikbaar: ${data?.haveEligible ?? 0}.`
            : data?.error === "CONFLICT_RETRY"
            ? "Bezig met verwerken. Probeer zo opnieuw."
            : data?.error ?? "Gebruik mislukt.";
        setMsg({ kind: "error", text: reason });
      }
    } finally {
      setLoading(false);
    }
  };

  // keyboard support dropdown
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < results.length) {
        e.preventDefault();
        selectUser(results[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-sm" htmlFor="zoek-speler">Zoek speler (naam)</label>
        <div className="relative">
          <input
            id="zoek-speler"
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(null);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder="Typ minimaal 2 letters…"
            className="border rounded px-3 py-2 w-72"
            autoComplete="off"
          />

          {/* dropdown */}
          {open && (loading || results.length > 0 || debouncedQ.trim().length >= 2) && (
            <div className="absolute z-10 mt-1 w-72 bg-white border rounded shadow">
              {loading && <div className="px-3 py-2 text-sm text-gray-500">Zoeken…</div>}
              {!loading && results.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">Geen resultaten</div>
              )}
              {!loading &&
                results.map((u, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onMouseLeave={() => setActiveIdx(-1)}
                      onClick={() => selectUser(u)}
                      className={`block w-full text-left px-3 py-2 text-sm ${
                        isActive ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="font-medium">{u.name ?? u.email ?? `#${u.id}`}</div>
                      <div className="text-gray-500">
                        {u.email ?? ""} {typeof u.level === "number" ? `• lvl ${u.level}` : ""}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="dossier-count">Aantal dossiers</label>
          <input
            id="dossier-count"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
          <p className="text-xs text-gray-600 mt-1">
            Beschikbaar: <b>{available}</b> • max: <b>{Math.max(1, Math.min(available || 1, 999))}</b>
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !selected || qty < 1 || qty > available}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          {loading ? "Bezig…" : `Dossier gebruiken (${qty})`}
        </button>
      </div>

      {selected && (
        <span className="text-sm text-gray-600">
          Gekozen: <b>{selected.name ?? selected.email ?? `#${selected.id}`}</b>
        </span>
      )}

      {msg && (
        <p className={msg.kind === "success" ? "text-green-700 text-sm" : "text-red-700 text-sm"}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

/** Kleine debounce hook */
function useDebounce<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
