import { NextRequest, NextResponse } from "next/server";
import { readEntries, writeEntries, getCsvContent } from "@/lib/csv";
import type { SavingsEntry } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "csv") {
    const csv = getCsvContent();
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="savings.csv"',
      },
    });
  }
  const entries = readEntries();
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    action: string;
    entry?: SavingsEntry;
    id?: string;
    entries?: SavingsEntry[];
  };

  if (body.action === "add" && body.entry) {
    const entries = readEntries();
    const newEntry: SavingsEntry = {
      ...body.entry,
      id: crypto.randomUUID(),
    };
    entries.push(newEntry);
    writeEntries(entries);
    return NextResponse.json(newEntry);
  }

  if (body.action === "update" && body.entry) {
    const entries = readEntries();
    const idx = entries.findIndex((e) => e.id === body.entry!.id);
    if (idx === -1)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    entries[idx] = body.entry;
    writeEntries(entries);
    return NextResponse.json(body.entry);
  }

  if (body.action === "delete" && body.id) {
    const entries = readEntries();
    const filtered = entries.filter((e) => e.id !== body.id);
    writeEntries(filtered);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "import" && body.entries) {
    writeEntries(body.entries);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
