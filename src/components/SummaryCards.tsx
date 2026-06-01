"use client";

import { useMemo } from "react";
import type { SavingsEntry } from "@/types";

interface Props {
  entries: SavingsEntry[];
}

function fmtAbs(amount: number): string {
  return `£${Math.abs(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SummaryCards({ entries }: Props) {
  const { totalGbp, assetsGbp, liabilitiesGbp, institutionCount } = useMemo(() => {
    const latest = new Map<string, SavingsEntry>();
    for (const e of entries) {
      const existing = latest.get(e.institution);
      if (!existing || (e.date ?? "") > (existing.date ?? "")) {
        latest.set(e.institution, e);
      }
    }
    const recent = Array.from(latest.values());
    const assetsGbp = recent
      .filter((e) => !e.is_liability)
      .reduce((s, e) => s + e.gbp_amount, 0);
    const liabilitiesGbp = recent
      .filter((e) => e.is_liability)
      .reduce((s, e) => s + e.gbp_amount, 0);
    return {
      totalGbp: assetsGbp - liabilitiesGbp,
      assetsGbp,
      liabilitiesGbp,
      institutionCount: recent.length,
    };
  }, [entries]);

  const hasLiabilities = liabilitiesGbp > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-green-600 rounded-2xl shadow-sm p-5">
        <p className="text-sm font-medium text-green-100 mb-1">Net Worth · GBP</p>
        <p className="text-2xl font-bold text-white tracking-tight tabular-nums">
          {totalGbp < 0 ? "−" : ""}
          {fmtAbs(totalGbp)}
        </p>
        {hasLiabilities && (
          <p className="text-xs text-green-200 mt-1 tabular-nums">
            {fmtAbs(assetsGbp)} assets − {fmtAbs(liabilitiesGbp)} liabilities
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Institutions</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {institutionCount}
        </p>
      </div>
    </div>
  );
}
