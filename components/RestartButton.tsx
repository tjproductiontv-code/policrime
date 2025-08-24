// components/RestartButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RestartButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onRestart = () => {
    if (!confirm("Weet je zeker dat je opnieuw wilt beginnen? Je houdt privileges, je passief inkomen daalt 10%, en je stemmen worden -1000 (minimaal 0).")) {
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/game/restart", { method: "POST" });
      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = "Opnieuw beginnen mislukt.";
        try {
          const d = JSON.parse(raw);
          if (d?.error === "UNAUTHENTICATED") msg = "Niet ingelogd.";
          else if (d?.error === "USER_NOT_FOUND") msg = "Gebruiker niet gevonden.";
          else if (d?.error === "SERVER_ERROR") msg = `Serverfout: ${d?.detail ?? ""}`;
        } catch {}
        alert(msg);
        return;
      }
      alert("Je bent opnieuw begonnen. Succes!");
      router.push("/"); // terug naar dashboard
      router.refresh();
    });
  };

  return (
    <button
      onClick={onRestart}
      disabled={isPending}
      className="rounded px-4 py-2 bg-emerald-600 text-white disabled:opacity-50"
    >
      {isPending ? "Bezig..." : "Opnieuw beginnen"}
    </button>
  );
}
