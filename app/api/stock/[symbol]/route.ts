import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { StockData } from "@/lib/cpr/types";
import { analyzeStockWithMonthlyBars } from "@/lib/cpr/analyze";
import { getMonthlyBars } from "@/lib/cpr/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function loadStocksJson(): Promise<{ symbol: string; name: string }[]> {
  const file = path.join(process.cwd(), "public", "stocks.json");
  const raw = await readFile(file, "utf-8");
  if (!raw.trim()) {
    throw new Error("public/stocks.json is empty");
  }
  try {
    return JSON.parse(raw) as { symbol: string; name: string }[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse public/stocks.json: ${msg}`);
  }
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = decodeURIComponent(params.symbol);

  try {
    const stocksData = await loadStocksJson();
    let stockData: StockData | null = null;
    for (const s of stocksData) {
      if (s.symbol === symbol) {
        stockData = { symbol: s.symbol, name: s.name };
        break;
      }
    }
    if (!stockData) {
      return NextResponse.json({ detail: "Stock not found" }, { status: 404 });
    }

    const bars = await getMonthlyBars(stockData.symbol);
    const analysis = await analyzeStockWithMonthlyBars(stockData, bars);

    if (!analysis) {
      return NextResponse.json({ detail: "Could not analyze stock" }, { status: 404 });
    }
    return NextResponse.json(analysis);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
