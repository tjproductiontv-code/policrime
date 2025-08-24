// components/PrivilegeCard.tsx
"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Privilege } from "../lib/privileges";

export default function PrivilegeCard({ item, owned }: { item: Privilege; owned: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onBuy = () => {
    if (owned || isPending) return;

    startTransition(async () => {
      setErrorMsg(null);
      try {
        const res = await fetch("/api/game/privileges/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: item.key }),
        });

        // Log altijd status + ruwe body zodat je in DevTools kunt zien wat er terugkomt
        const raw = await res.text().catch(() => "");
        console.log("[buy privilege] status:", res.status, "raw:", raw);

        if (!res.ok) {
          // probeer JSON te parsen, val anders terug op raw text
          let data: any = null;
          try { data = raw ? JSON.parse(raw) : null; } catch {}
          let msg = "Aankoop mislukt.";

          if (data?.error === "INSUFFICIENT_VOTES") msg = "Te weinig stemmen.";
          else if (data?.error === "ALREADY_OWNED") msg = "Je hebt dit al.";
          else if (data?.error === "UNKNOWN_PRIVILEGE") msg = "Onbekend privilege.";
          else if (data?.error === "UNAUTHENTICATED") msg = "Niet ingelogd.";
          else if (data?.error === "SERVER_ERROR") msg = `Serverfout: ${data?.detail ?? raw ?? ""}`;
          else if (data?.error) msg = String(data.error);
          else if (raw) msg = `Fout (${res.status}): ${raw}`;
          else msg = `Fout (${res.status}).`;

          setErrorMsg(msg);
          // fallback alert (als browser alerts toelaat)
          try { alert(msg); } catch {}
          return;
        }

        // success
        router.refresh();
      } catch (e: any) {
        const msg = `Netwerkfout: ${e?.message ?? e}`;
        console.error("[buy privilege] fetch error:", e);
        setErrorMsg(msg);
        try { alert(msg); } catch {}
      }
    });
  };

  return (
    <div className="border rounded-lg p-4 h-full flex flex-col justify-between">
      <div>
        <div className="font-semibold">{item.name}</div>
        <p className="text-sm text-gray-600">{item.desc}</p>
        <p className="text-sm mt-2">
          Geeft: <b>€{item.incomePerHour.toLocaleString("nl-NL")}/uur</b>
        </p>
        <p className="text-sm">
          Prijs: <b>{(item.costVotes ?? 0).toLocaleString("nl-NL")} stemmen</b>
        </p>
        {errorMsg && (
          <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
        )}
      </div>

      <button
        className="mt-4 rounded px-3 py-2 bg-emerald-600 text-white disabled:opacity-50"
        disabled={owned || isPending}
        onClick={onBuy}
        title={owned ? "Reeds in bezit" : undefined}
      >
        {owned ? "In bezit" : isPending ? "Kopen..." : "Kopen"}
      </button>
    </div>
  );
}
