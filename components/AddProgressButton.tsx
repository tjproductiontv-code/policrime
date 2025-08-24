"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddProgressButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const add = async () => {
    setLoading(true);
    await fetch("/api/game/level/add-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 5 }), // test +5%
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={add}
      disabled={loading}
      className="mt-3 rounded px-3 py-2 border"
    >
      {loading ? "..." : "+5% progress (test)"}
    </button>
  );
}
