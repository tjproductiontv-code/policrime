"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function InvestigatorBuyForm() {
  const [count, setCount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2 items-center">
      <input
        type="number" min={1}
        className="border rounded px-2 py-1 w-24"
        value={count}
        onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value))))}
      />
      <button
        className="rounded px-3 py-2 bg-emerald-600 text-white disabled:opacity-50"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          const res = await fetch("/api/game/investigators/buy", {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ count }),
          });
          if (!res.ok) {
            const t = await res.text().catch(()=>"");
            alert(t || "Aankoop mislukt");
            return;
          }
          router.refresh();
        })}
      >
        {isPending ? "Kopen..." : "Kopen"}
      </button>
    </div>
  );
}
