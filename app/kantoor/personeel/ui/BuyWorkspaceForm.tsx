"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyWorkspaceForm({ unitPrice, money }: { unitPrice: number; money: number }) {
  const [qtyStr, setQtyStr] = useState("1");
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const qty = useMemo(() => {
    const n = Math.floor(Number(qtyStr));
    return Number.isFinite(n) ? Math.max(1, Math.min(9999, n)) : 1;
  }, [qtyStr]);

  const cost = qty * unitPrice;
  const affordable = Math.floor((money ?? 0) / unitPrice);

  const onBuy = async () => {
    setMsg(null);
    try {
      setLoading(true);
      const res = await fetch("/api/game/workspace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({
          kind: "success",
          text: `Gekocht: ${qty} unit(s) (2 m²). Nieuw saldo: €${(data.money ?? 0).toLocaleString(
            "nl-NL"
          )}.`,
        });
        router.refresh();
      } else {
        if (data?.error === "INSUFFICIENT_FUNDS") {
          setMsg({
            kind: "error",
            text: `Te weinig geld. Nodig: €${(data.cost ?? 0).toLocaleString(
              "nl-NL"
            )}, je hebt: €${(data.have ?? 0).toLocaleString("nl-NL")}.`,
          });
        } else {
          setMsg({ kind: "error", text: "Kopen mislukt." });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end flex-wrap gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ws-qty">
            Aantal units (2 m²)
          </label>
          <input
            id="ws-qty"
            type="number"
            min={1}
            max={9999}
            value={qtyStr}
            onChange={(e) => setQtyStr(e.target.value)}
            className="w-36 rounded-xl border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          <p className="text-xs text-gray-500 mt-1">
            Prijs: €{unitPrice} / unit · Max betaalbaar: <b>{affordable}</b>
          </p>
        </div>

        <button
          onClick={onBuy}
          disabled={loading || qty < 1 || cost > (money ?? 0)}
          className="rounded-xl bg-gray-900 text-white px-4 py-2 shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Bezig…" : `Kopen (${qty}) voor €${cost.toLocaleString("nl-NL")}`}
        </button>
      </div>

      {msg && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            msg.kind === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
