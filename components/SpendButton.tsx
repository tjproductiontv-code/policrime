"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SpendButton({ amount = 5 }: { amount?: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/game/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        router.refresh(); // saldo vernieuwen
        return;
      }

      if (res.status === 402 || res.status === 409) {
        router.push("/out-of-funds");
        return;
      }

      // optioneel: toon foutmelding
      console.error("Spend failed", await res.json().catch(() => ({})));
      alert("Er ging iets mis bij het besteden.");
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
      {loading ? "Bezig..." : `Besteed ${amount} geld`}
    </button>
  );
}
