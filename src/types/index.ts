export interface SavingsEntry {
  id: string;
  institution: string;
  date: string;
  base_currency: string;
  base_amount: number;
  gbp_amount: number;
  is_liability: boolean;
  notes: string;
}

export const SUPPORTED_CURRENCIES = [
  { code: "GBP", symbol: "£" },
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
] as const;

export type CurrencyCode = "GBP" | "EUR" | "USD";

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function signedGbp(entry: SavingsEntry): number {
  return entry.is_liability ? -entry.gbp_amount : entry.gbp_amount;
}

export interface Settings {
  base_currency: string;
  base_currency_symbol: string;
}
