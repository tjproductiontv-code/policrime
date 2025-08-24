"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DossierBuyForm() {
  const [amount, setAmount] = useState(10);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onBuy = () => {
    startTransition(async () => {
      const res = await fetch("/api/game/dossiers/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = "Aankoop mislukt";
        try { const d = JSON.parse(raw); if (d?.error) msg = d.error; } catch {}
        alert(msg);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        className="border rounded px-3 py-2 w-28"
        value={amount}
        onChange={(e) => setAmount(Math.max(1, Math.floor(Number(e.target.value))))}
      />
      <button
        className="rounded px-3 py-2 bg-emerald-600 text-white disabled:opacity-50"
        disabled={isPending}
        onClick={onBuy}
      >
        {isPending ? "Kopen..." : "Kopen"}
      </button>
    </div>
  );
}
