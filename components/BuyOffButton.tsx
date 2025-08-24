// components/BuyOffButton.tsx
"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

const PRICE_PER_SEC = 10; // €10 per seconde

function calcBuyoutPrice(remainSeconds: unknown): number | null {
  const n = typeof remainSeconds === "number" ? Math.floor(remainSeconds) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n * PRICE_PER_SEC; // ⬅️ €10 / sec, geen minimum
}

export default function BuyOffButton({ remain }: { remain: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const price = useMemo(() => calcBuyoutPrice(remain), [remain]);
  if (price === null) return null;

  return (
    <button
      className="rounded px-3 py-2 bg-rose-600 text-white disabled:opacity-50"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await fetch("/api/game/investigation/buyoff", { method: "POST" });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(
              data?.error === "INSUFFICIENT_FUNDS"
                ? `Te weinig saldo. Nodig: €${(data?.price ?? 0).toLocaleString("nl-NL")}`
                : "Vrij kopen mislukt."
            );
            return;
          }
          // UI updaten
          router.refresh();
          window.dispatchEvent(new Event("cooldowns:update"));
        })
      }
      title={`Resterend: ${remain}s`}
    >
      Koop vrij (€{price.toLocaleString("nl-NL")})
    </button>
  );
}
