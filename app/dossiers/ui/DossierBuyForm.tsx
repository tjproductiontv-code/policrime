"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { price?: number };

export default function DossierBuyForm({ price = 10 }: Props) {
  const [count, setCount] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  // €-formatter: geen decimalen bij hele getallen
  const fmtEUR = (n: number) => {
    const isInt = Number.isInteger(n);
    return `€${new Intl.NumberFormat("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: isInt ? 0 : 2,
    }).format(n)}`;
  };

  // Parse & clamp 1..999
  const qty = useMemo(() => {
    const n = parseInt(count, 10);
    return Number.isFinite(n) ? Math.max(1, Math.min(999, n)) : 0;
  }, [count]);

  const cost = useMemo(() => qty * price, [qty, price]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMsg(null);
    if (qty < 1) return;

    try {
      setLoading(true);
      const res = await fetch("/api/game/dossiers/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // stuur alle gangbare keys mee voor compatibiliteit
        body: JSON.stringify({ quantity: qty, count: qty, aantal: qty }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsg({
          kind: "success",
          text:
            `Gekocht: ${qty} dossier(s) voor ${fmtEUR(cost)}` +
            (typeof data?.money === "number" ? ` • Nieuw saldo: ${fmtEUR(data.money)}` : ""),
        });
        router.refresh();
      } else {
        const reason =
          data?.error === "INSUFFICIENT_FUNDS"
            ? `Te weinig geld. Nodig: ${fmtEUR(data?.needed ?? cost)}.`
            : data?.error ?? "Kopen mislukt.";
        setMsg({ kind: "error", text: reason });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="dossier-qty">Aantal dossiers</label>
          <input
            id="dossier-qty"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
          <p className="text-sm text-gray-500 mt-1">Prijs per dossier: {fmtEUR(price)}</p>
        </div>

        <button
          type="submit"
          disabled={loading || qty < 1}
          className="rounded-md px-4 py-2 border disabled:opacity-50"
        >
          {loading ? "Bezig..." : `Koop (${qty}) voor ${fmtEUR(cost)}`}
        </button>
      </div>

      {msg && (
        <p className={msg.kind === "success" ? "text-sm text-green-700" : "text-sm text-red-700"}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
