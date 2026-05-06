import type { CPRAnalysis, CPRLevels, CprLevelsMap, StockData } from "./types";
import {
  calculateCprPrecise,
  classifyCprRelationship,
  classifyCprWidth,
  classifyPivotTrend,
  cprRelationshipShort,
  cprWidthPercentOfPivot,
  determineTradeBias,
  generateStrategyInterpretation,
  generateTrendInsight,
  roundCprLevels,
} from "./math";
import { getActiveAndPriorCprIndices } from "./monthly-cpr";
import { getLastSessionClose, getMonthlyBars, type OhlcBar } from "./yahoo";

function toLevels(m: CprLevelsMap): CPRLevels {
  return {
    tc: m.tc,
    pivot: m.pivot,
    bc: m.bc,
    r1: m.r1,
    r2: m.r2,
    s1: m.s1,
    s2: m.s2,
  };
}

function buildAnalysis(
  stock: StockData,
  bars: OhlcBar[],
  currentPriceOverride: number | null
): CPRAnalysis {
  const idx = getActiveAndPriorCprIndices(bars);
  if (!idx) {
    throw new Error("Insufficient monthly bars for CPR");
  }
  const hlcBase = bars[idx.base]!;
  const hlcPrior = bars[idx.prior]!;

  const currentPrecise = calculateCprPrecise(hlcBase.high, hlcBase.low, hlcBase.close);
  const previousPrecise = calculateCprPrecise(hlcPrior.high, hlcPrior.low, hlcPrior.close);
  const currentCpr = roundCprLevels(currentPrecise);
  const previousCpr = roundCprLevels(previousPrecise);

  const latestBar = bars[bars.length - 1]!;
  let currentPrice = latestBar.close;
  if (currentPriceOverride != null) currentPrice = currentPriceOverride;

  const cprWidth = Math.abs(currentPrecise.tc - currentPrecise.bc);
  const cprWidthPct = cprWidthPercentOfPivot(currentPrecise.pivot, cprWidth);
  const cprWidthLabel = classifyCprWidth(currentPrecise.pivot, cprWidth);
  const cprRelationship = classifyCprRelationship(currentPrecise, previousPrecise);
  const pivotTrend = classifyPivotTrend(currentPrice, currentPrecise);
  const tradeBias = determineTradeBias(cprRelationship, pivotTrend);
  const strategyInterpretation = generateStrategyInterpretation(
    cprRelationship,
    pivotTrend,
    currentCpr,
    currentPrice
  );
  const trendInsight = generateTrendInsight(pivotTrend, currentPrice, currentCpr);

  return {
    symbol: stock.symbol,
    name: stock.name,
    current_price: Math.round(currentPrice * 100) / 100,
    current_month_cpr: toLevels(currentCpr),
    previous_month_cpr: toLevels(previousCpr),
    cpr_width: Math.round(cprWidth * 100) / 100,
    cpr_width_pct: Math.round(cprWidthPct * 100) / 100,
    cpr_width_label: cprWidthLabel,
    cpr_relationship: cprRelationship,
    cpr_relationship_short: cprRelationshipShort(cprRelationship),
    pivot_trend: pivotTrend,
    trade_bias: tradeBias,
    strategy_interpretation: strategyInterpretation,
    trend_insight: trendInsight,
  };
}

export async function analyzeStock(stock: StockData): Promise<CPRAnalysis | null> {
  const bars = await getMonthlyBars(stock.symbol);
  if (!getActiveAndPriorCprIndices(bars)) return null;
  const last = await getLastSessionClose(stock.symbol);
  return buildAnalysis(stock, bars, last);
}

/** Reuse already-fetched monthly bars and still fetch last close. */
export async function analyzeStockWithMonthlyBars(
  stock: StockData,
  bars: OhlcBar[]
): Promise<CPRAnalysis | null> {
  if (!getActiveAndPriorCprIndices(bars)) return null;
  const last = await getLastSessionClose(stock.symbol);
  return buildAnalysis(stock, bars, last);
}
