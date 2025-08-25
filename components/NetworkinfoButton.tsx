"use client";

import { useState } from "react";
import { DISCOUNT_RANGE } from "../lib/network";

function pctFromBps(bps: number) {
  return (bps / 100).toFixed(2) + "%";
}
function avgDiscountText(minBps: number, maxBps: number) {
  const avgPricePct = (minBps + maxBps) / 2 / 100;
  const avgDiscount = 100 - avgPricePct;
  return `${avgDiscount.toFixed(1)}%`;
}

export default function NetworkInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
        title="Uitleg: Levels & bonussen"
        aria-label="Uitleg: Levels & bonussen"
      >
        i
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-[90%] p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold font-serif text-slate-900">
                  Levels &amp; bonussen
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  modern classic
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LevelCard
                levelNum={0}
                headline="Kennismaking"
                subtitle="Nog geen korting"
                detail="Speel vrij door de balk tot 100% te vullen."
              />
              <LevelCard
                levelNum={1}
                headline="Vertrouwde relatie"
                subtitle={`Prijs: ${pctFromBps(DISCOUNT_RANGE[1].minBps)} – ${pctFromBps(DISCOUNT_RANGE[1].maxBps)} van basis`}
                detail={`Gem. korting ≈ ${avgDiscountText(DISCOUNT_RANGE[1].minBps, DISCOUNT_RANGE[1].maxBps)}`}
              />
              <LevelCard
                levelNum={2}
                headline="Binnenste cirkel"
                subtitle={`Prijs: ${pctFromBps(DISCOUNT_RANGE[2].minBps)} – ${pctFromBps(DISCOUNT_RANGE[2].maxBps)} van basis`}
                detail={`Gem. korting ≈ ${avgDiscountText(DISCOUNT_RANGE[2].minBps, DISCOUNT_RANGE[2].maxBps)}`}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Tip: na level-up blijft “Connectie bouwen” werken om naar het volgende level te groeien — progressie per klik wordt iets kleiner op hogere levels.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function LevelCard({
  levelNum,
  headline,
  subtitle,
  detail,
}: {
  levelNum: number;
  headline: string;
  subtitle: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="text-slate-900">
        <p className="text-sm font-serif">Level {levelNum}</p>
        <h4 className="text-base font-semibold font-serif">{headline}</h4>
      </div>
      <p className="mt-2 text-sm text-slate-700">{subtitle}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}
