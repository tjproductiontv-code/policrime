// components/HealthBar.tsx
"use client";

type Props = {
  hpBP: number;         // huidige HP in basispunten (0–10000)
  maxBP?: number;       // standaard 10000 = 100.00 HP
  showLabel?: boolean;  // labeltekst tonen
};

export default function HealthBar({ hpBP, maxBP = 10000, showLabel = true }: Props) {
  const clamped = Math.max(0, Math.min(maxBP, hpBP));
  const pct = Math.round((clamped / maxBP) * 100); // 0–100
  const hpText = (clamped / 100).toFixed(2);       // 10000 → 100.00

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 text-sm text-gray-700">
          ❤️ <b>{hpText}</b> / {(maxBP / 100).toFixed(2)} HP
        </div>
      )}
      <div className="h-3 w-full rounded-full bg-gray-200">
        <div
          className="h-3 rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
