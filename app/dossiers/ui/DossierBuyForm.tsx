"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** prijs per dossier in euro's */
  price: number;
  /** vrije capaciteit t.o.v. je cap (bijv. 1600 – voorraad) */
  freeCapacity: number;
  /** maximaal te kopen NU (min van vrije capaciteit en wat je saldo toelaat) */
  maxBuyNow: number;
};

export default function DossierBuyForm({ price, freeCapacity, maxBuyNow }: Props) {
  const router = useRouter();
  const [raw, setRaw] = useState("1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const fmtInt = (n: number) => n.toLocaleString("nl-NL");
  const fmtEUR = (n: number) => "€" + n.toLocaleString("nl-NL");

  // effectieve bovengrens
  const hardMax = Math.max(0, Math.min(freeCapacity, maxBuyNow));

  // clamp op 1..hardMax (of 0 als hardMax 0 is)
  const qty = useMemo(() => {
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return 0;
    if (hardMax <= 0) return 0;
    return Math.max(1, Math.min(hardMax, n));
  }, [raw, hardMax]);

  const total = qty * price;

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMsg(null);
    if (qty < 1) return;

    try {
      setLoading(true);
      const res = await fetch("/api/game/dossiers/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsg({
          kind: "success",
          text:
            `Gekocht: ${fmtInt(qty)} dossier(s) voor ${fmtEUR(total)}` +
            (typeof data?.dossiers === "number" ? ` • Nieuwe voorraad: ${fmtInt(data.dossiers)}` : "") +
            (typeof data?.money === "number" ? ` • Nieuw saldo: ${fmtEUR(data.money)}` : ""),
        });
        setRaw("1");
        router.refresh();
      } else {
        const reason =
          data?.error === "INSUFFICIENT_FUNDS"
            ? `Te weinig saldo. Nodig: ${fmtEUR(data?.cost ?? total)}.`
            : data?.error === "CAPACITY_EXCEEDED"
            ? `Onvoldoende capaciteit. Vrij: ${fmtInt(freeCapacity)}.`
            : data?.error ?? "Aankoop mislukt.";
        setMsg({ kind: "error", text: reason });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="text-sm text-gray-600">
        Prijs: {fmtEUR(price)} • Vrij: <b>{fmtInt(freeCapacity)}</b> • Max koop nu:{" "}
        <b>{fmtInt(hardMax)}</b>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="buy-qty" className="block text-sm mb-1">
            Aantal dossiers
          </label>
          <input
            id="buy-qty"
            type="number"
            inputMode="numeric"
            min={hardMax > 0 ? 1 : 0}
            max={Math.max(1, hardMax)}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
          <p className="text-xs text-gray-600 mt-1">Prijs per dossier: {fmtEUR(price)}</p>
        </div>

        <button
          type="submit"
          disabled={loading || qty < 1}
          className="rounded-md px-4 py-2 border disabled:opacity-50"
        >
          {loading ? "Bezig..." : `Koop (${fmtInt(qty)}) voor ${fmtEUR(total)}`}
        </button>
      </div>

      {msg && (
        <p className={msg.kind === "success" ? "text-green-700 text-sm" : "text-red-700 text-sm"}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
