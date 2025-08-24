"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UseDossiersForm() {
  const [targetName, setTargetName] = useState("");
  const [count, setCount] = useState(100); // bijv. 100 dossiers = 1.00 HP
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onUse = () => {
    startTransition(async () => {
      const res = await fetch("/api/game/dossiers/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetName, count }),
      });
      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = "Actie mislukt";
        try { const d = JSON.parse(raw); if (d?.error) msg = d.error; } catch {}
        alert(msg);
        return;
      }
      alert("Dossiers ingezet");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 max-w-sm">
      <div>
        <label className="block text-sm mb-1">Naam doelspeler</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          placeholder="Exacte gebruikersnaam"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Aantal dossiers</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded px-3 py-2"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value))))}
        />
        <p className="text-xs text-gray-500 mt-1">
          1 dossier = 0,01 levenspunt (1 BP)
        </p>
      </div>
      <button
        className="rounded px-3 py-2 bg-rose-600 text-white disabled:opacity-50"
        disabled={isPending || !targetName}
        onClick={onUse}
      >
        {isPending ? "Gebruiken..." : "Gebruiken"}
      </button>
    </div>
  );
}
