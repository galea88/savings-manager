"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/types";
import type { SavingsEntry } from "@/types";

interface Props {
  entry?: SavingsEntry | null;
  onSave: (entry: Omit<SavingsEntry, "id"> & { id?: string }) => void;
  onClose: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EntryModal({ entry, onSave, onClose }: Props) {
  const [institution, setInstitution] = useState("");
  const [date, setDate] = useState(todayIso());
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [baseAmount, setBaseAmount] = useState("");
  const [gbpAmount, setGbpAmount] = useState("");
  const [isLiability, setIsLiability] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entry) {
      setInstitution(entry.institution);
      setDate(entry.date || todayIso());
      setBaseCurrency(entry.base_currency || "USD");
      setBaseAmount(entry.base_amount.toString());
      setGbpAmount(entry.gbp_amount.toString());
      setIsLiability(entry.is_liability ?? false);
      setNotes(entry.notes);
    } else {
      setInstitution("");
      setDate(todayIso());
      setBaseCurrency("USD");
      setBaseAmount("");
      setGbpAmount("");
      setIsLiability(false);
      setNotes("");
    }
  }, [entry]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...(entry?.id ? { id: entry.id } : {}),
      institution,
      date,
      base_currency: baseCurrency,
      base_amount: parseFloat(baseAmount) || 0,
      gbp_amount: parseFloat(gbpAmount) || 0,
      is_liability: isLiability,
      notes,
    });
  }

  const baseSymbol = getCurrencySymbol(baseCurrency);

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {entry ? "Edit Entry" : "Add Entry"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Institution
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Barclays, Vanguard, Fidelity"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsLiability((v) => !v)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
              isLiability
                ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500"
                : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isLiability
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {isLiability ? "Liability (debt / credit card)" : "Asset (savings / investment)"}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isLiability
                  ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                  : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
              }`}
            >
              {isLiability ? "DEBT" : "ASSET"}
            </span>
          </button>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Base Currency
            </label>
            <div className="relative">
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className={`${inputCls} appearance-none pr-10 cursor-pointer`}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Amount ({baseCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                {baseSymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                placeholder="0.00"
                required
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Amount (GBP)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                £
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={gbpAmount}
                onChange={(e) => setGbpAmount(e.target.value)}
                placeholder="0.00"
                required
                className={`${inputCls} pl-6`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Notes{" "}
              <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ISA, pension, current account"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              {entry ? "Save Changes" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
