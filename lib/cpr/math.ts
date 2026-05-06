import type { CprLevelsMap } from "./types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function roundCprLevels(p: CprLevelsMap): CprLevelsMap {
  return {
    tc: round2(p.tc),
    pivot: round2(p.pivot),
    bc: round2(p.bc),
    r1: round2(p.r1),
    r2: round2(p.r2),
    s1: round2(p.s1),
    s2: round2(p.s2),
  };
}

/** Full-precision CPR; use for classifiers so they match geometry implied by OHLC. */
export function calculateCprPrecise(high: number, low: number, close: number): CprLevelsMap {
  const pivot = (high + low + close) / 3;
  const bc = (high + low) / 2;
  const tc = pivot - bc + pivot;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  return { tc, pivot, bc, r1, r2, s1, s2 };
}

/** CPR levels rounded to 2 dp for API / display. */
export function calculateCpr(high: number, low: number, close: number): CprLevelsMap {
  return roundCprLevels(calculateCprPrecise(high, low, close));
}

/** True CPR value-area bounds (TC may be numerically below BC on bearish months). */
function cprBandBounds(c: CprLevelsMap): { lo: number; hi: number } {
  return { lo: Math.min(c.tc, c.bc), hi: Math.max(c.tc, c.bc) };
}

export function classifyCprRelationship(
  currentCpr: CprLevelsMap,
  previousCpr: CprLevelsMap
): string {
  const c = cprBandBounds(currentCpr);
  const p = cprBandBounds(previousCpr);

  /** Inside Value: current band strictly inside previous (narrower, contained). */
  if (c.lo > p.lo && c.hi < p.hi) return "Inside Value";
  if (c.lo < p.lo && c.hi > p.hi) return "Outside Value (Range)";
  if (c.lo > p.hi) return "Higher Value (Bullish)";
  if (c.hi < p.lo) return "Lower Value (Bearish)";
  if (c.lo > p.lo && c.lo <= p.hi && c.hi > p.hi) {
    return "Overlapping Higher Value (Moderately Bullish)";
  }
  if (c.hi < p.hi && c.hi >= p.lo && c.lo < p.lo) {
    return "Overlapping Lower Value (Moderately Bearish)";
  }
  const eps = 0.01;
  if (Math.abs(c.lo - p.lo) < eps && Math.abs(c.hi - p.hi) < eps) {
    return "Unchanged Value (Neutral)";
  }
  return "Overlapping (Neutral)";
}

/** Compact label for scanner table; strips trailing “ (…)”. Detail view uses full `cpr_relationship`. */
export function cprRelationshipShort(full: string): string {
  return full.replace(/ \([^)]+\)$/, "");
}

/** Monthly CPR width as % of pivot: (TC − BC) / Pivot × 100. */
export function cprWidthPercentOfPivot(pivot: number, tcMinusBc: number): number {
  if (!Number.isFinite(pivot) || pivot === 0) return 0;
  return (Math.abs(tcMinusBc) / pivot) * 100;
}

/**
 * Positional (monthly) CPR width vs pivot: below 0.5% narrow, 0.5%–1.2% medium, above 1.2% wide.
 */
export function classifyCprWidth(pivot: number, tcMinusBc: number): string {
  const pct = cprWidthPercentOfPivot(pivot, tcMinusBc);
  if (pct < 0.5) return "Narrow CPR";
  if (pct <= 1.2) return "Medium";
  return "Wide CPR";
}

export function classifyPivotTrend(currentPrice: number, cpr: CprLevelsMap): string {
  const { lo, hi } = cprBandBounds(cpr);
  if (currentPrice > hi) return "Strong Bullish";
  if (currentPrice < lo) return "Bearish";
  return "Neutral / Transition";
}

export function determineTradeBias(cprRelationship: string, pivotTrend: string): string {
  const bullishKeywords = ["Bullish", "Higher", "Overlapping Higher"];
  const bearishKeywords = ["Bearish", "Lower", "Overlapping Lower"];
  const isBullish = bullishKeywords.some((k) => cprRelationship.includes(k));
  const isBearish = bearishKeywords.some((k) => cprRelationship.includes(k));

  if (cprRelationship.includes("Inside Value")) return "Breakout";
  if (cprRelationship.includes("Outside Value")) return "Range";
  if (isBullish && pivotTrend.includes("Bullish")) return "Buy";
  if (isBearish && pivotTrend.includes("Bearish")) return "Sell";
  if (isBullish) return "Buy";
  if (isBearish) return "Sell";
  return "Neutral";
}

export function generateStrategyInterpretation(
  cprRelationship: string,
  _pivotTrend: string,
  cpr: CprLevelsMap,
  _currentPrice: number
): Record<string, string> {
  const interpretation: Record<string, string> = {
    bias: "",
    expected_behavior: "",
    entry_zone: "",
    stop_loss: "",
    targets: "",
  };

  if (cprRelationship.includes("Bullish") || cprRelationship.includes("Higher")) {
    interpretation.bias = "Bullish";
    interpretation.expected_behavior = "Buy on pullbacks to CPR";
    interpretation.entry_zone = `Near TC (${cpr.tc}) / Pivot (${cpr.pivot})`;
    interpretation.stop_loss = `Below BC (${cpr.bc})`;
    interpretation.targets = `R1 (${cpr.r1}) → R2 (${cpr.r2})`;
  } else if (cprRelationship.includes("Bearish") || cprRelationship.includes("Lower")) {
    interpretation.bias = "Bearish";
    interpretation.expected_behavior = "Sell on rallies to CPR";
    interpretation.entry_zone = `Near BC (${cpr.bc}) / Pivot (${cpr.pivot})`;
    interpretation.stop_loss = `Above TC (${cpr.tc})`;
    interpretation.targets = `S1 (${cpr.s1}) → S2 (${cpr.s2})`;
  } else if (cprRelationship.includes("Inside Value")) {
    interpretation.bias = "Breakout (High Conviction)";
    interpretation.expected_behavior = "Wait for breakout from CPR range";
    interpretation.entry_zone = `Breakout above TC (${cpr.tc}) for Buy, below BC (${cpr.bc}) for Sell`;
    interpretation.stop_loss = "Opposite side of CPR";
    interpretation.targets = "R1/S1 based on breakout direction";
  } else if (cprRelationship.includes("Outside Value")) {
    interpretation.bias = "Range Bound";
    interpretation.expected_behavior = "Expect consolidation, trade range extremes";
    interpretation.entry_zone = `Near R1 (${cpr.r1}) for Sell, S1 (${cpr.s1}) for Buy`;
    interpretation.stop_loss = "Beyond R2/S2";
    interpretation.targets = "Opposite side of range";
  } else {
    interpretation.bias = "Neutral";
    interpretation.expected_behavior = "Wait for clear direction";
    interpretation.entry_zone = `Near Pivot (${cpr.pivot})`;
    interpretation.stop_loss = `Beyond TC (${cpr.tc}) or BC (${cpr.bc})`;
    interpretation.targets = "R1 or S1 based on price action";
  }
  return interpretation;
}

export function generateTrendInsight(
  pivotTrend: string,
  _currentPrice: number,
  cpr: CprLevelsMap
): Record<string, string> {
  if (pivotTrend.includes("Bullish")) {
    return {
      current_structure: "Uptrend",
      key_level_to_watch: `BC (${cpr.bc}) - Hold above for uptrend continuation`,
    };
  }
  if (pivotTrend.includes("Bearish")) {
    return {
      current_structure: "Downtrend",
      key_level_to_watch: `TC (${cpr.tc}) - Hold below for downtrend continuation`,
    };
  }
  return {
    current_structure: "Sideways / Transition",
    key_level_to_watch: `TC (${cpr.tc}) for bullish, BC (${cpr.bc}) for bearish`,
  };
}

const PRIORITY: Record<string, number> = {
  "Inside Value": 1,
  "Higher Value (Bullish)": 2,
  "Overlapping Higher Value (Moderately Bullish)": 3,
  "Overlapping Lower Value (Moderately Bearish)": 4,
  "Lower Value (Bearish)": 5,
  "Outside Value (Range)": 6,
  "Unchanged Value (Neutral)": 7,
  "Overlapping (Neutral)": 8,
};

export function sortAnalyses(list: import("./types").CPRAnalysis[]): void {
  const widthRank = (l: string) => {
    if (l.includes("Narrow")) return 1;
    if (l.includes("Medium")) return 2;
    if (l.includes("Wide")) return 3;
    return 2;
  };
  list.sort((a, b) => {
    const pa = PRIORITY[a.cpr_relationship] ?? 99;
    const pb = PRIORITY[b.cpr_relationship] ?? 99;
    if (pa !== pb) return pa - pb;
    return widthRank(a.cpr_width_label) - widthRank(b.cpr_width_label);
  });
}
