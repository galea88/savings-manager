import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/csv";
import type { Settings } from "@/types";

export async function GET() {
  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Settings;
  writeSettings(body);
  return NextResponse.json(body);
}
