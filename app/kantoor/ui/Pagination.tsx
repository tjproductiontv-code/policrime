// app/kantoor/ui/Pagination.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pages = useMemo(() => {
    const arr: number[] = [];
    for (let p = 1; p <= totalPages; p++) arr.push(p);
    return arr;
  }, [totalPages]);

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/kantoor?page=${prev}`}
        className="px-3 py-1 border rounded hover:bg-gray-50"
        aria-disabled={page === 1}
      >
        ← Vorige
      </Link>

      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <Link
            key={p}
            href={`/kantoor?page=${p}`}
            className={`px-3 py-1 border rounded hover:bg-gray-50 ${p === page ? "bg-gray-100 font-semibold" : ""}`}
          >
            {p}
          </Link>
        ))}
      </div>

      <Link
        href={`/kantoor?page=${next}`}
        className="px-3 py-1 border rounded hover:bg-gray-50"
        aria-disabled={page === totalPages}
      >
        Volgende →
      </Link>
    </div>
  );
}
