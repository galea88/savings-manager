import fs from "fs";
import path from "path";
import type { SavingsEntry, Settings } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CSV_PATH = path.join(DATA_DIR, "savings.csv");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");

function normalizeDate(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, m, d, y] = slash;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readSettings(): Settings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_PATH)) {
    const defaults: Settings = {
      base_currency: "USD",
      base_currency_symbol: "$",
    };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) as Settings;
}

export function writeSettings(settings: Settings): void {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export function readEntries(): SavingsEntry[] {
  ensureDataDir();
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(
      CSV_PATH,
      "id,institution,date,base_currency,base_amount,gbp_amount,is_liability,notes\n"
    );
    return [];
  }
  const content = fs.readFileSync(CSV_PATH, "utf-8").trim();
  if (!content) return [];

  const lines = content.split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const hasDate = header.includes("date");
  const hasBaseCurrency = header.includes("base_currency");
  const hasIsLiability = header.includes("is_liability");

  const today = new Date().toISOString().slice(0, 10);

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = parseCsvLine(line);
      if (hasDate && hasBaseCurrency && hasIsLiability) {
        return {
          id: cols[0] || crypto.randomUUID(),
          institution: cols[1] || "",
          date: normalizeDate(cols[2]) || today,
          base_currency: cols[3] || "USD",
          base_amount: parseFloat(cols[4]) || 0,
          gbp_amount: parseFloat(cols[5]) || 0,
          is_liability: cols[6] === "true",
          notes: cols[7] || "",
        };
      } else if (hasDate && hasBaseCurrency) {
        return {
          id: cols[0] || crypto.randomUUID(),
          institution: cols[1] || "",
          date: normalizeDate(cols[2]) || today,
          base_currency: cols[3] || "USD",
          base_amount: parseFloat(cols[4]) || 0,
          gbp_amount: parseFloat(cols[5]) || 0,
          is_liability: false,
          notes: cols[6] || "",
        };
      } else if (hasBaseCurrency) {
        return {
          id: cols[0] || crypto.randomUUID(),
          institution: cols[1] || "",
          date: today,
          base_currency: cols[2] || "USD",
          base_amount: parseFloat(cols[3]) || 0,
          gbp_amount: parseFloat(cols[4]) || 0,
          is_liability: false,
          notes: cols[5] || "",
        };
      } else {
        return {
          id: cols[0] || crypto.randomUUID(),
          institution: cols[1] || "",
          date: today,
          base_currency: "USD",
          base_amount: parseFloat(cols[2]) || 0,
          gbp_amount: parseFloat(cols[3]) || 0,
          is_liability: false,
          notes: cols[4] || "",
        };
      }
    });
}

export function writeEntries(entries: SavingsEntry[]): void {
  ensureDataDir();
  const header =
    "id,institution,date,base_currency,base_amount,gbp_amount,is_liability,notes";
  const rows = entries.map(
    (e) =>
      `${escapeCsv(e.id)},${escapeCsv(e.institution)},${escapeCsv(e.date)},${escapeCsv(e.base_currency)},${e.base_amount},${e.gbp_amount},${e.is_liability ? "true" : "false"},${escapeCsv(e.notes)}`
  );
  fs.writeFileSync(CSV_PATH, [header, ...rows].join("\n") + "\n");
}

export function getCsvContent(): string {
  ensureDataDir();
  if (!fs.existsSync(CSV_PATH))
    return "id,institution,date,base_currency,base_amount,gbp_amount,is_liability,notes\n";
  return fs.readFileSync(CSV_PATH, "utf-8");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
