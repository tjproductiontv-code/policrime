// src/components/ProgressBar.tsx
type Props = { value: number; showLabel?: boolean };

export default function ProgressBar({ value, showLabel = true }: Props) {
  const raw = Number(value);
  const v = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;

  return (
    <div>
      <div className="w-full bg-neutral-200 rounded-full h-3">
        <div
          className="h-3 rounded-full bg-emerald-500"
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-sm text-gray-700 mt-1">
          Progressie: {v.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
