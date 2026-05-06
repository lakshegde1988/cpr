/**
 * OHLC from Yahoo Finance chart API (HTTPS fetch; no mock/synthetic series).
 */
const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

export interface OhlcBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function yfTickerSymbol(symbol: string): string {
  const s = symbol.trim();
  if (!s) return s;
  const u = s.toUpperCase();
  if (u.endsWith(".NS") || u.endsWith(".BO")) return s;
  return `${s}.NS`;
}

interface YahooChartJson {
  chart?: {
    error?: { description?: string } | null;
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
        }>;
      };
    }>;
  };
}

function parseChartToBars(json: YahooChartJson): OhlcBar[] {
  const err = json.chart?.error;
  if (err && typeof err === "object" && err.description) {
    throw new Error(String(err.description));
  }
  const result = json.chart?.result?.[0];
  if (!result) return [];
  const ts = result.timestamp;
  if (!ts?.length) return [];
  const quote = result.indicators?.quote?.[0];
  if (!quote) return [];
  const open = quote.open ?? [];
  const high = quote.high ?? [];
  const low = quote.low ?? [];
  const close = quote.close ?? [];
  const out: OhlcBar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = open[i];
    const h = high[i];
    const l = low[i];
    const c = close[i];
    if (o == null || h == null || l == null || c == null) continue;
    const oN = Number(o);
    const hN = Number(h);
    const lN = Number(l);
    const cN = Number(c);
    if (![oN, hN, lN, cN].every(Number.isFinite)) continue;
    out.push({
      date: new Date(ts[i]! * 1000),
      open: oN,
      high: hN,
      low: lN,
      close: cN,
    });
  }
  return out;
}

async function fetchYahooChart(
  symbol: string,
  interval: "1d" | "1mo",
  period1Sec: number,
  period2Sec: number
): Promise<OhlcBar[]> {
  const url = new URL(`${YAHOO_CHART}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("period1", String(period1Sec));
  url.searchParams.set("period2", String(period2Sec));
  url.searchParams.set("interval", interval);
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CPRScanner/1.0; +https://github.com/)",
      Accept: "application/json,text/plain,*/*",
    },
  });
  if (!res.ok) {
    throw new Error(`Yahoo HTTP ${res.status}`);
  }
  const data = (await res.json()) as YahooChartJson;
  return parseChartToBars(data);
}

function aggregateMonthly(daily: OhlcBar[]): OhlcBar[] {
  const map = new Map<string, OhlcBar[]>();
  for (const bar of daily) {
    const k = `${bar.date.getUTCFullYear()}-${bar.date.getUTCMonth()}`;
    let arr = map.get(k);
    if (!arr) {
      arr = [];
      map.set(k, arr);
    }
    arr.push(bar);
  }
  const out: OhlcBar[] = [];
  for (const [, bars] of map) {
    bars.sort((a, b) => a.date.getTime() - b.date.getTime());
    const open = bars[0]!.open;
    const high = Math.max(...bars.map((b) => b.high));
    const low = Math.min(...bars.map((b) => b.low));
    const close = bars[bars.length - 1]!.close;
    const date = bars[bars.length - 1]!.date;
    out.push({ date, open, high, low, close });
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

function period15y(): { period1Sec: number; period2Sec: number } {
  const end = new Date();
  const start = new Date();
  start.setUTCFullYear(start.getUTCFullYear() - 15);
  return {
    period1Sec: Math.floor(start.getTime() / 1000),
    period2Sec: Math.floor(end.getTime() / 1000),
  };
}

async function fetchMonthlyRaw(yfSym: string): Promise<OhlcBar[]> {
  const { period1Sec, period2Sec } = period15y();
  return fetchYahooChart(yfSym, "1mo", period1Sec, period2Sec);
}

export async function fetchDailyRaw(yfSym: string): Promise<OhlcBar[]> {
  const { period1Sec, period2Sec } = period15y();
  return fetchYahooChart(yfSym, "1d", period1Sec, period2Sec);
}

export async function getDailyBars(symbol: string, days = 30): Promise<OhlcBar[]> {
  const yfSym = yfTickerSymbol(symbol);
  try {
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - days);
    return await fetchYahooChart(
      yfSym,
      "1d",
      Math.floor(start.getTime() / 1000),
      Math.floor(end.getTime() / 1000)
    );
  } catch (e) {
    console.error(`Yahoo daily fetch failed for ${yfSym}:`, e);
    return [];
  }
}

/** Monthly OHLC for CPR: native 1mo or daily aggregated. */
export async function getMonthlyBars(symbol: string): Promise<OhlcBar[]> {
  const yfSym = yfTickerSymbol(symbol);
  try {
    let monthly = await fetchMonthlyRaw(yfSym);
    if (monthly.length >= 3) return monthly;
    const daily = await fetchDailyRaw(yfSym);
    if (daily.length > 0) {
      monthly = aggregateMonthly(daily);
      if (monthly.length >= 3) return monthly;
    }
  } catch (e) {
    console.error(`Yahoo monthly fetch failed for ${yfSym}:`, e);
  }
  return [];
}

export async function getLastSessionClose(symbol: string): Promise<number | null> {
  const yfSym = yfTickerSymbol(symbol);
  try {
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 21);
    const bars = await fetchYahooChart(
      yfSym,
      "1d",
      Math.floor(start.getTime() / 1000),
      Math.floor(end.getTime() / 1000)
    );
    if (!bars.length) return null;
    return bars[bars.length - 1]!.close;
  } catch {
    return null;
  }
}
