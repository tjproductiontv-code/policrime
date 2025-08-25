"use client";

import { useEffect, useState } from "react";

export default function StemmenHandelClient() {
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState<number | null>(null);
  const [discountBps, setDiscountBps] = useState<number | null>(null);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState<string | null>(null);

  const loadPrice = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/game/network/stemmen-handel/price");
      const data = await res.json();
      if (data?.ok && data.unlocked) {
        setPrice(data.price);
        setDiscountBps(data.discountBps);
        setValidUntil(data.validUntil);
      } else if (!data.unlocked) {
        setFlash("Nog niet vrijgespeeld.");
      } else {
        setFlash("Kon prijs niet laden.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setFlash(null), 3000);
    }
  };

  useEffect(() => {
    loadPrice();
  }, []);

  const buy = async () => {
    if (!price) return;
    const res = await fetch("/api/game/network/stemmen-handel/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty }),
    });
    const data = await res.json();
    if (data?.ok) {
      setFlash(`Gekocht: ${data.qty} stemmen voor €${data.total}`);
    } else if (data?.error === "PRICE_EXPIRED") {
      setFlash("Prijs verlopen, vernieuwen...");
      await loadPrice();
    } else if (data?.error === "INSUFFICIENT_FUNDS") {
      setFlash("Onvoldoende saldo.");
    } else {
      setFlash(data?.error || "Fout bij kopen");
    }
    setTimeout(() => setFlash(null), 4000);
  };

  return (
    <div className="border rounded-xl p-4 space-y-3">
      {loading ? (
        <p>Prijs laden…</p>
      ) : price ? (
        <>
          <p>
            Actuele prijs per stem: <b>€{price}</b>{" "}
            {discountBps != null && <> (korting {(discountBps / 100).toFixed(2)}%)</>}
          </p>
          {validUntil && (
            <p className="text-xs text-gray-500">
              Geldig tot: {new Date(validUntil).toLocaleTimeString()}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={1000}
              value={qty}
              onChange={(e) =>
                setQty(Math.min(1000, Math.max(1, Number(e.target.value))))
              }
              className="border rounded px-2 py-1 w-24"
            />
            <button
              onClick={buy}
              className="rounded-md px-3 py-2 bg-emerald-600 text-white"
            >
              Kopen
            </button>
            <button
              onClick={loadPrice}
              className="rounded-md px-3 py-2 border"
            >
              Vernieuw prijs
            </button>
          </div>
        </>
      ) : (
        <p>Geen prijs beschikbaar.</p>
      )}
      {flash && <p className="text-sm text-emerald-700">{flash}</p>}
    </div>
  );
}
