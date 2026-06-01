"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Download, Upload, TrendingUp } from "lucide-react";
import SummaryCards from "@/components/SummaryCards";
import SavingsChart from "@/components/SavingsChart";
import EntriesTable from "@/components/EntriesTable";
import EntryModal from "@/components/EntryModal";
import type { SavingsEntry, Settings } from "@/types";

const DEFAULT_SETTINGS: Settings = {
  base_currency: "USD",
  base_currency_symbol: "$",
};

export default function Home() {
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/savings/data").then((r) => r.json()),
      fetch("/savings/settings").then((r) => r.json()),
    ]).then(([entriesData, settingsData]) => {
      setEntries(entriesData as SavingsEntry[]);
      setSettings(settingsData as Settings);
      setLoading(false);
    });
  }, []);

  async function handleSaveEntry(
    entry: Omit<SavingsEntry, "id"> & { id?: string }
  ) {
    const action = entry.id ? "update" : "add";
    const res = await fetch("/savings/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entry }),
    });
    const saved = (await res.json()) as SavingsEntry;

    if (action === "add") {
      setEntries((prev) => [...prev, saved]);
    } else {
      setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
    }
    setShowEntryModal(false);
    setEditingEntry(null);
  }

  async function handleDeleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch("/savings/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleDownloadCsv() {
    const a = document.createElement("a");
    a.href = "/savings/data?format=csv";
    a.download = "savings.csv";
    a.click();
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return;

    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const col = (name: string) => headers.indexOf(name);
    const today = new Date().toISOString().slice(0, 10);
    const normalizeDate = (raw: string) => {
      if (!raw) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slash) {
        const [, m, d, y] = slash;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      return raw;
    };

    const parsed: SavingsEntry[] = lines
      .slice(1)
      .filter((l) => l.trim())
      .map((line) => {
        const cols = parseCsvLine(line);
        const get = (name: string, fallback = "") => {
          const i = col(name);
          return i !== -1 ? cols[i] ?? fallback : fallback;
        };
        return {
          id: get("id") || crypto.randomUUID(),
          institution: get("institution"),
          date: normalizeDate(get("date")) || today,
          base_currency: get("base_currency") || "USD",
          base_amount: parseFloat(get("base_amount")) || 0,
          gbp_amount: parseFloat(get("gbp_amount")) || 0,
          is_liability: get("is_liability") === "true",
          notes: get("notes"),
        };
      });

    if (
      confirm(
        `Import ${parsed.length} entr${parsed.length === 1 ? "y" : "ies"}? This will replace current data.`
      )
    ) {
      await fetch("/savings/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", entries: parsed }),
      });
      setEntries(parsed);
    }
    e.target.value = "";
  }

  void settings;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">
              Savings Manager
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImportClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Upload size={15} />
              Import CSV
            </button>
            <button
              onClick={handleDownloadCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Download size={15} />
              Export CSV
            </button>
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowEntryModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Entry</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 h-24 animate-pulse"
                >
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-3" />
                  <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 h-48 animate-pulse" />
          </div>
        ) : (
          <>
            <SummaryCards entries={entries} />
            <SavingsChart entries={entries} />
            <EntriesTable
              entries={entries}
              onEdit={(entry) => {
                setEditingEntry(entry);
                setShowEntryModal(true);
              }}
              onDelete={handleDeleteEntry}
            />
          </>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {showEntryModal && (
        <EntryModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowEntryModal(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
