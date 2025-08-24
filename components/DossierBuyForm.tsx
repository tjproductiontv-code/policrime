"use client";
import { useState, useTransition } from "react";

export default function DossierBuyForm() {
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const res = await fetch("/api/game/dossiers/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: qty }), // ← JSON, sluit aan op route
          });
          const data = await res.json();
          if (!res.ok) {
            setMsg(data?.error ?? "Mislukt");
            return;
          }
          setMsg(`Gekocht: ${data.quantity} dossiers (totaal ${data.totalCost}). Nieuw saldo: ${data.money}.`);
        });
      }}
      className="space-y-3"
    >
      <div className="text-sm text-gray-500">Dossiers kopen — prijs 10/stuk</div>
      <div className="flex items-center gap-2">
        <label className="w-28">Aantal</label>
        <input
          type="number"
          min={1}
          max={999}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
          className="border rounded px-2 py-1 w-28"
        />
        <button
          disabled={pending}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Kopen"}
        </button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
