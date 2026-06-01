"use client";

import { useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  TrendingDown,
} from "lucide-react";
import { getCurrencySymbol, formatDate } from "@/types";
import type { SavingsEntry } from "@/types";

interface Props {
  entries: SavingsEntry[];
  onEdit: (entry: SavingsEntry) => void;
  onDelete: (id: string) => void;
}

type Tab = "latest" | "all";
type SortKey = "institution" | "date" | "base_amount" | "gbp_amount";
type SortDir = "asc" | "desc";
interface SortConfig { key: SortKey; dir: SortDir }

const PAGE_SIZE = 10;

function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function sortEntries(rows: SavingsEntry[], sort: SortConfig): SavingsEntry[] {
  return [...rows].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "institution") {
      cmp = a.institution.localeCompare(b.institution);
    } else if (sort.key === "date") {
      cmp = (a.date ?? "").localeCompare(b.date ?? "");
    } else if (sort.key === "base_amount") {
      cmp = a.base_amount - b.base_amount;
    } else if (sort.key === "gbp_amount") {
      cmp = a.gbp_amount - b.gbp_amount;
    }
    return sort.dir === "asc" ? cmp : -cmp;
  });
}

function SortIcon({ col, sort }: { col: SortKey; sort: SortConfig }) {
  if (sort.key !== col)
    return <ChevronsUpDown size={13} className="text-slate-500 opacity-50" />;
  return sort.dir === "asc"
    ? <ChevronUp size={13} className="text-green-400" />
    : <ChevronDown size={13} className="text-green-400" />;
}

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40">
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
              p === page
                ? "bg-green-600 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: SavingsEntry;
  onEdit: (e: SavingsEntry) => void;
  onDelete: (id: string) => void;
}) {
  const sym = getCurrencySymbol(entry.base_currency);
  const isDebt = entry.is_liability;
  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
            isDebt
              ? "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50"
              : "bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50"
          }`}>
            {isDebt
              ? <TrendingDown size={15} className="text-red-500 dark:text-red-400" />
              : <Building2 size={15} className="text-green-600 dark:text-green-400" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-white">{entry.institution}</span>
            {isDebt && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                DEBT
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
        {formatDate(entry.date)}
      </td>
      <td className="px-5 py-3.5 text-right tabular-nums">
        <span className={`font-mono ${isDebt ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
          {isDebt ? "−" : ""}{fmt(entry.base_amount, sym)}
        </span>
        <span className="ml-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase">
          {entry.base_currency}
        </span>
      </td>
      <td className={`px-5 py-3.5 text-right font-mono tabular-nums ${isDebt ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
        {isDebt ? "−" : ""}{fmt(entry.gbp_amount, "£")}
      </td>
      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{entry.notes}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: SavingsEntry;
  onEdit: (e: SavingsEntry) => void;
  onDelete: (id: string) => void;
}) {
  const sym = getCurrencySymbol(entry.base_currency);
  const isDebt = entry.is_liability;
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
            isDebt
              ? "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50"
              : "bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50"
          }`}>
            {isDebt
              ? <TrendingDown size={16} className="text-red-500 dark:text-red-400" />
              : <Building2 size={16} className="text-green-600 dark:text-green-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{entry.institution}</p>
              {isDebt && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex-shrink-0">
                  DEBT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {formatDate(entry.date)}
              {entry.notes ? ` · ${entry.notes}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className={`rounded-xl p-3 ${isDebt ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-50 dark:bg-slate-700/60"}`}>
          <p className={`text-xs mb-0.5 uppercase font-medium ${isDebt ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
            {entry.base_currency}
          </p>
          <p className={`font-mono font-semibold text-sm tabular-nums ${isDebt ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
            {isDebt ? "−" : ""}{fmt(entry.base_amount, sym)}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${isDebt ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/30"}`}>
          <p className={`text-xs mb-0.5 font-medium ${isDebt ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>GBP</p>
          <p className={`font-mono font-semibold text-sm tabular-nums ${isDebt ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-300"}`}>
            {isDebt ? "−" : ""}{fmt(entry.gbp_amount, "£")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EntriesTable({ entries, onEdit, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>("latest");
  const [latestPage, setLatestPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [latestSort, setLatestSort] = useState<SortConfig>({ key: "institution", dir: "asc" });
  const [allSort, setAllSort] = useState<SortConfig>({ key: "date", dir: "desc" });

  function handleSort(col: SortKey, current: SortConfig, set: (s: SortConfig) => void, resetPage: () => void) {
    set(current.key === col
      ? { key: col, dir: current.dir === "asc" ? "desc" : "asc" }
      : { key: col, dir: "asc" }
    );
    resetPage();
  }

  const latestEntries = useMemo(() => {
    const map = new Map<string, SavingsEntry>();
    for (const e of entries) {
      const existing = map.get(e.institution);
      if (!existing || (e.date ?? "") > (existing.date ?? "")) {
        map.set(e.institution, e);
      }
    }
    return sortEntries(Array.from(map.values()), latestSort);
  }, [entries, latestSort]);

  const allEntries = useMemo(
    () => sortEntries([...entries], allSort),
    [entries, allSort]
  );

  const activeEntries = tab === "latest" ? latestEntries : allEntries;
  const activePage = tab === "latest" ? latestPage : allPage;
  const setActivePage = tab === "latest" ? setLatestPage : setAllPage;
  const activeSort = tab === "latest" ? latestSort : allSort;

  function onSortCol(col: SortKey) {
    if (tab === "latest") handleSort(col, latestSort, setLatestSort, () => setLatestPage(1));
    else handleSort(col, allSort, setAllSort, () => setAllPage(1));
  }

  const pageEntries = activeEntries.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );

  const thBase = "px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 select-none";
  const thBtn = `${thBase} cursor-pointer hover:text-slate-900 dark:hover:text-white group/th transition-colors`;

  const tableHeader = (
    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40">
      <th className={thBtn} onClick={() => onSortCol("institution")}>
        <span className="flex items-center gap-1">
          Institution <SortIcon col="institution" sort={activeSort} />
        </span>
      </th>
      <th className={thBtn} onClick={() => onSortCol("date")}>
        <span className="flex items-center gap-1">
          Date <SortIcon col="date" sort={activeSort} />
        </span>
      </th>
      <th className={`${thBtn} text-right`} onClick={() => onSortCol("base_amount")}>
        <span className="flex items-center justify-end gap-1">
          Base Amount <SortIcon col="base_amount" sort={activeSort} />
        </span>
      </th>
      <th className={`${thBtn} text-right`} onClick={() => onSortCol("gbp_amount")}>
        <span className="flex items-center justify-end gap-1">
          GBP <SortIcon col="gbp_amount" sort={activeSort} />
        </span>
      </th>
      <th className={`${thBase} text-left`}>Notes</th>
      <th className="px-5 py-3.5 w-20" />
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-slate-100 dark:border-slate-700">
        {(
          [
            { id: "latest", label: "Balances", count: latestEntries.length },
            { id: "all", label: "All Entries", count: allEntries.length },
          ] as { id: Tab; label: string; count: number }[]
        ).map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === id
                ? "border-green-600 text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-900/20"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            {label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === id
                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">No entries yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Add your first bank or broker account to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>{tableHeader}</thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {pageEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {pageEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>

          <Pagination
            page={activePage}
            total={activeEntries.length}
            pageSize={PAGE_SIZE}
            onChange={setActivePage}
          />
        </>
      )}
    </div>
  );
}
