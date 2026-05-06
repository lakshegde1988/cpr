import type { OhlcBar } from "./yahoo";

/** NSE calendar month in YYYY-MM (IST). */
export function yearMonthIST(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(d);
}

/** Year-month in UTC format YYYY-MM for consistent comparison with Yahoo Finance data. */
export function yearMonthUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** First calendar day of current month in IST as YYYY-MM-DD. */
export function startOfCurrentMonthISTDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-01`;
}

/**
 * Index of the monthly bar whose HLC defines the **active** monthly CPR
 * (always the last **completed** month before the trading month; e.g. May CPR → April HLC).
 */
export function activeCprHlcBarIndex(bars: OhlcBar[]): number | null {
  if (bars.length < 2) return null;
  const currentMonth = yearMonthIST(new Date());
  for (let i = bars.length - 1; i >= 0; i--) {
    if (yearMonthIST(bars[i]!.date) < currentMonth) {
      return i;
    }
  }
  return null;
}

export function priorCprHlcBarIndex(bars: OhlcBar[], baseIdx: number): number | null {
  if (baseIdx <= 0) return null;
  const baseMonth = yearMonthIST(bars[baseIdx]!.date);
  for (let i = baseIdx - 1; i >= 0; i--) {
    if (yearMonthIST(bars[i]!.date) < baseMonth) {
      return i;
    }
  }
  return null;
}

export function getActiveAndPriorCprIndices(
  bars: OhlcBar[]
): { base: number; prior: number } | null {
  const base = activeCprHlcBarIndex(bars);
  if (base == null) return null;
  const prior = priorCprHlcBarIndex(bars, base);
  if (prior == null) return null;
  return { base, prior };
}
