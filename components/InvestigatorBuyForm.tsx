"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function InvestigatorBuyForm({
  price,
  maxAffordable,
}: {
  price: number;         // € per onderzoeker
  maxAffordable: number; // hoeveel je je kan veroorloven
}) {
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    try {
      setBusy(true);
      const res = await fetch("/api/game/investigators/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Er ging iets mis.");
      } else {
        alert(`Gekocht: ${count} onderzoeker(s) voor €${count * price}.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        max={Math.max(1, maxAffordable)}
        value={count}
        onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
        className="w-24 border rounded px-2 py-1"
      />
      <button
        type="submit"
        disabled={busy || count <= 0}
        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {busy ? "Bezig…" : "Kopen"}
      </button>
      <span className="text-sm text-gray-600">
        Max betaalbaar: {maxAffordable}
      </span>
    </form>
  );
}
