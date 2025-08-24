"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Props = { price: number };

export default function BuyVotesForm({ price }: Props) {
  const [count, setCount] = useState<string>("1"); // als string zodat de user even leeg kan laten
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Parse & clamp
  const qty = useMemo(() => {
    const n = parseInt(count, 10);
    if (Number.isNaN(n)) return 0;
    return Math.max(1, Math.min(999, n));
  }, [count]);

  const cost = useMemo(() => qty * price, [qty, price]);
  const fmtEUR = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (qty < 1) {
      alert("Voer een geldig aantal in (minimaal 1).");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/game/votes/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Stuur beide keys mee: werkt met routes die 'quantity' of 'count' verwachten
        body: JSON.stringify({ quantity: qty, count: qty }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(`Gekocht: ${qty} stem(men) voor ${fmtEUR(cost)}.`);
        router.refresh();
        return;
      }

      if (data?.error === "INSUFFICIENT_FUNDS") {
        const needed = typeof data?.cost === "number" ? fmtEUR(data.cost) : "onbekend bedrag";
        alert(`Te weinig geld. Nodig: ${needed}.`);
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
    <form onSubmit={onSubmit} className="flex items-end gap-3">
      <div>
        <label className="block text-sm mb-1" htmlFor="votes-qty">Aantal stemmen</label>
        <input
          id="votes-qty"
          name="quantity"               // handig als je ooit FormData gebruikt
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="border rounded px-3 py-2 w-32"
        />
        <p className="text-sm text-gray-500 mt-1">Prijs per stem: {fmtEUR(price)}</p>
      </div>

      <button
        type="submit"
        disabled={loading || qty < 1}
        aria-disabled={loading || qty < 1}
        className="rounded-md px-4 py-2 border disabled:opacity-50"
      >
        {loading ? "Bezig..." : `Koop (${qty}) voor ${fmtEUR(cost)}`}
      </button>
    </form>
  );
}
