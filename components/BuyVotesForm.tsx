"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function BuyVotesForm({ price }: { price: number }) {
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const cost = useMemo(() => Math.max(0, (count || 0) * price), [count, price]);

  const buy = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/game/votes/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: Number(count) }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(`Gekocht: ${count} stem(men) voor €${cost}.`);
        router.refresh();
        return;
      }

      if (data?.error === "INSUFFICIENT_FUNDS") {
        alert(`Te weinig geld. Nodig: €${data.cost}.`);
      } else if (data?.error === "INVALID_COUNT") {
        alert("Aantal is ongeldig.");
      } else {
        alert("Kopen mislukt.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-end gap-3">
      <div>
        <label className="block text-sm mb-1">Aantal stemmen</label>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value || "1", 10))}
          className="border rounded px-3 py-2 w-32"
        />
        <p className="text-sm text-gray-500 mt-1">Prijs per stem: €{price}</p>
      </div>

      <button
        onClick={buy}
        disabled={loading || !count || count <= 0}
        className="rounded-md px-4 py-2 border"
      >
        {loading ? "Bezig..." : `Koop (${count}) voor €${cost}`}
      </button>
    </div>
  );
}
