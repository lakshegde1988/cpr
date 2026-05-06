import { readFile } from "fs/promises";
import path from "path";
import type { CPRAnalysis, StockData } from "./types";
import { analyzeStockWithMonthlyBars } from "./analyze";
import { sortAnalyses } from "./math";
import { getMonthlyBars } from "./yahoo";
import { UNIVERSE_STOCK_FILES } from "./universes";

export { UNIVERSE_STOCK_FILES } from "./universes";

/** Bump when scan outputs change so cached payloads are not reused. */
const SCAN_CACHE_VERSION = 8;

const scanCache = new Map<string, CPRAnalysis[]>();

function scanCacheKey(rawKey: string): string {
  return `${rawKey}:v${SCAN_CACHE_VERSION}`;
}

export function normalizeStockItem(row: Record<string, unknown>): StockData {
  const sym = row.symbol ?? row.Symbol;
  const name = row.name ?? row.Name ?? sym ?? "";
  if (sym == null || sym === "") {
    throw new Error(
      `Each stock must include symbol or Symbol; keys=${Object.keys(row).join(",")}`
    );
  }
  return { symbol: String(sym).trim(), name: String(name).trim() };
}

const CONCURRENCY = 8;

async function runPool<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]!);
    }
  }
  const n = Math.min(CONCURRENCY, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
}

export async function runScanForStocks(stocks: StockData[]): Promise<CPRAnalysis[]> {
  const symbolToBars = new Map<string, Awaited<ReturnType<typeof getMonthlyBars>>>();
  await runPool(stocks, async (stock) => {
    const bars = await getMonthlyBars(stock.symbol);
    symbolToBars.set(stock.symbol, bars);
  });

  const analyses: CPRAnalysis[] = [];
  await runPool(stocks, async (stock) => {
    const bars = symbolToBars.get(stock.symbol)!;
    const a = await analyzeStockWithMonthlyBars(stock, bars);
    if (a) analyses.push(a);
  });

  sortAnalyses(analyses);
  return analyses;
}

export async function scanPost(body: {
  stocks: Record<string, unknown>[];
}): Promise<CPRAnalysis[]> {
  const normalized = body.stocks.map(normalizeStockItem);
  const key = `custom_${normalized
    .map((s) => s.symbol)
    .sort()
    .join("|")}`;
  const ck = scanCacheKey(key);
  const hit = scanCache.get(ck);
  if (hit) return hit;

  const result = await runScanForStocks(normalized);
  if (result.length > 0) scanCache.set(ck, result);
  return result;
}

export async function scanUniverse(universe: string): Promise<CPRAnalysis[]> {
  if (!UNIVERSE_STOCK_FILES[universe]) {
    throw new Error(`Invalid universe: ${universe}`);
  }
  const ck = scanCacheKey(universe);
  const hit = scanCache.get(ck);
  if (hit) return hit;

  const file = path.join(process.cwd(), "public", UNIVERSE_STOCK_FILES[universe]!);
  const content = await readFile(file, "utf-8");
  if (!content.trim()) {
    throw new Error(`Universe file is empty: ${file}`);
  }
  let raw;
  try {
    raw = JSON.parse(content) as Record<string, unknown>[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse universe file ${file}: ${msg}`);
  }
  const stocks = raw.map(normalizeStockItem);
  const result = await runScanForStocks(stocks);
  if (result.length > 0) scanCache.set(ck, result);
  return result;
}
