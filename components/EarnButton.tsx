"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EarnButton({ amount = 5 }: { amount?: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/game/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        router.refresh(); // saldo op pagina updaten
        return;
      }

      console.error("Earn failed", await res.json().catch(() => ({})));
      alert("Er ging iets mis bij geld verdienen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-md px-3 py-2 border"
    >
      {loading ? "Bezig..." : `Verdien +${amount}`}
    </button>
  );
}
