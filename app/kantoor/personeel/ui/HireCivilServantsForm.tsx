"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function HireCivilServantsForm({
  hourlyCost,
  currentCivilServants,
  passivePerHour,                 // NETTO per uur
  workspaceUnits,
  workspaceUnitsPerEmployee,
}: {
  hourlyCost: number;
  currentCivilServants: number;
  passivePerHour: number;
  workspaceUnits: number;
  workspaceUnitsPerEmployee: number;
}) {
  const [qtyStr, setQtyStr] = useState("1");
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const qty = useMemo(() => {
    const n = Math.floor(Number(qtyStr));
    return Number.isFinite(n) ? Math.max(1, Math.min(999, n)) : 1;
  }, [qtyStr]);

  // Bruto = netto + huidige salariskosten
  const grossPerHour = (passivePerHour ?? 0) + (currentCivilServants ?? 0) * hourlyCost;

  // Max # employees dat je bruto kunt dragen
  const maxEmployeesByIncome = Math.floor(grossPerHour / hourlyCost);
  const maxByIncomeForNew = maxEmployeesByIncome - currentCivilServants;

  // Max o.b.v. werkplekken
  const maxEmployeesByWs = Math.floor((workspaceUnits ?? 0) / workspaceUnitsPerEmployee);
  const maxByWsForNew = maxEmployeesByWs - currentCivilServants;

  const canHireMax = Math.max(0, Math.min(maxByIncomeForNew, maxByWsForNew));

  const onHire = async () => {
    setMsg(null);
    try {
      setLoading(true);
      const res = await fetch("/api/game/personnel/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({
          kind: "success",
          text: `Aangenomen: ${qty} ambtenaar/ambtenaren. Netto −€${(qty * hourlyCost).toLocaleString("nl-NL")}/uur.`,
        });
        router.refresh();
      } else {
        if (data?.error === "INSUFFICIENT_INCOME") {
          setMsg({
            kind: "error",
            text: `Te laag bruto inkomen/uur. Nodig: €${(data.need ?? 0).toLocaleString("nl-NL")}, je hebt: €${(data.have ?? 0).toLocaleString("nl-NL")}.`,
          });
        } else if (data?.error === "INSUFFICIENT_WORKSPACE") {
          setMsg({
            kind: "error",
            text: `Te weinig werkplekken. Nodig: ${data.needUnitsForTarget} units.`,
          });
        } else {
          setMsg({ kind: "error", text: "Aannemen mislukt." });
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
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="hire-qty">
            Aantal
          </label>
          <input
            id="hire-qty"
            type="number"
            min={1}
            max={999}
            value={qtyStr}
            onChange={(e) => setQtyStr(e.target.value)}
            className="w-32 rounded-xl border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max (inkomen/werkplekken): <b>{canHireMax}</b>
          </p>
        </div>

        <button
          onClick={onHire}
          disabled={loading || qty < 1 || qty > canHireMax}
          className="rounded-xl bg-gray-900 text-white px-4 py-2 shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Bezig…" : `Aannemen (${qty})`}
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
