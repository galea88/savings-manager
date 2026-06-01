"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { signedGbp } from "@/types";
import type { SavingsEntry } from "@/types";

interface Props {
  entries: SavingsEntry[];
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtGbp(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${sign}£${(abs / 1_000).toFixed(0)}k`;
  return `${sign}£${abs.toFixed(0)}`;
}

function fmtGbpFull(v: number) {
  const sign = v < 0 ? "−" : "";
  return `${sign}£${Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SavingsChart({ entries }: Props) {
  const years = useMemo(() => {
    const set = new Set<number>();
    const thisYear = new Date().getFullYear();
    set.add(thisYear);
    entries.forEach((e) => {
      if (e.date) set.add(parseInt(e.date.slice(0, 4)));
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [entries]);

  const institutions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.institution));
    return Array.from(set).sort();
  }, [entries]);

  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedView, setSelectedView] = useState<string>("Total");

  useEffect(() => {
    if (entries.length === 0) return;
    const monthsPerYear = new Map<number, Set<string>>();
    entries.filter((e) => e.date).forEach((e) => {
      const y = parseInt(e.date.slice(0, 4));
      if (isNaN(y)) return;
      if (!monthsPerYear.has(y)) monthsPerYear.set(y, new Set());
      monthsPerYear.get(y)!.add(e.date.slice(0, 7));
    });
    if (monthsPerYear.size === 0) return;
    let bestYear = selectedYear;
    let bestCount = monthsPerYear.get(selectedYear)?.size ?? 0;
    monthsPerYear.forEach((months, year) => {
      if (months.size > bestCount || (months.size === bestCount && year > bestYear)) {
        bestYear = year;
        bestCount = months.size;
      }
    });
    if (bestYear !== selectedYear) setSelectedYear(bestYear);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const chartData = useMemo(() => {
    const filtered = entries.filter(
      (e) => e.date && parseInt(e.date.slice(0, 4)) === selectedYear
    );

    const prevEntries = entries.filter(
      (e) => e.date && parseInt(e.date.slice(0, 4)) < selectedYear
    );
    let carryForward: number | null = null;
    if (prevEntries.length > 0) {
      if (selectedView === "Total") {
        const latestPerInst = new Map<string, SavingsEntry>();
        prevEntries.forEach((e) => {
          const cur = latestPerInst.get(e.institution);
          if (!cur || e.date > cur.date) latestPerInst.set(e.institution, e);
        });
        carryForward = Array.from(latestPerInst.values()).reduce(
          (s, e) => s + signedGbp(e),
          0
        );
      } else {
        const instPrev = prevEntries
          .filter((e) => e.institution === selectedView)
          .sort((a, b) => b.date.localeCompare(a.date));
        if (instPrev.length > 0) carryForward = signedGbp(instPrev[0]);
      }
    }

    const months = MONTHS.map((month, i) => {
      const monthStr = String(i + 1).padStart(2, "0");
      const inMonth = filtered.filter(
        (e) => e.date.slice(5, 7) === monthStr
      );

      let value: number | null = null;

      if (selectedView === "Total") {
        if (inMonth.length > 0) {
          value = inMonth.reduce((s, e) => s + signedGbp(e), 0);
        }
      } else {
        const inst = inMonth.filter((e) => e.institution === selectedView);
        if (inst.length > 0) {
          value = inst.reduce((s, e) => s + signedGbp(e), 0);
        }
      }

      return { month, value };
    });

    if (months[0].value === null && carryForward !== null) {
      months[0] = { month: months[0].month, value: carryForward };
    }

    return months;
  }, [entries, selectedYear, selectedView]);

  const hasData = chartData.some((d) => d.value !== null);
  const dataPointCount = chartData.filter((d) => d.value !== null).length;
  const views = ["Total", ...institutions];

  const gridColor = "#334155";
  const tickColor = "#64748b";
  const cursorColor = "#475569";
  const tooltipBg = "#1e293b";
  const tooltipBorder = "#334155";
  const tooltipTextMuted = "#94a3b8";
  const tooltipTextMain = "#f1f5f9";

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (active && payload && payload.length && payload[0].value != null) {
      return (
        <div
          style={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 12,
            padding: "10px 16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          <p style={{ fontSize: 12, color: tooltipTextMuted, marginBottom: 2 }}>
            {label} {selectedYear}
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: tooltipTextMain }}>
            {fmtGbpFull(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          GBP Balance Over Time
        </h2>

        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => setSelectedView(v)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedView === v
                ? "bg-green-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="h-52 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          No data for {selectedView} in {selectedYear}
        </div>
      ) : dataPointCount === 1 ? (
        <div className="h-52 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Only 1 snapshot in {selectedYear}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
            A trend line needs at least 2 months of data. Try switching to a
            different year, or add more entries in {selectedYear}.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gbpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtGbp}
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#gbpGradient)"
              dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#16a34a", strokeWidth: 2, stroke: "#1e293b" }}
              connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
