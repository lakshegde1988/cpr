export interface StockData {
  symbol: string;
  name: string;
}

export interface CPRLevels {
  tc: number;
  pivot: number;
  bc: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

export interface CPRAnalysis {
  symbol: string;
  name: string;
  current_price: number;
  current_month_cpr: CPRLevels;
  previous_month_cpr: CPRLevels;
  cpr_width: number;
  /** (TC − BC) / Pivot × 100 — used for narrow / medium / wide classification. */
  cpr_width_pct: number;
  cpr_width_label: string;
  cpr_relationship: string;
  /** Same relationship without trailing qualifier, e.g. "Lower Value" vs "Lower Value (Bearish)". */
  cpr_relationship_short: string;
  pivot_trend: string;
  trade_bias: string;
  strategy_interpretation: Record<string, string>;
  trend_insight: Record<string, string>;
}

export interface DailyTradePlan {
  bias: string;
  entry_plan: string;
  stop_loss: string;
  targets: string;
}

export interface DailyCPRAnalysis {
  symbol: string;
  name: string;
  current_price: number;
  tomorrow_cpr: CPRLevels;
  today_cpr: CPRLevels;
  cpr_width: number;
  cpr_width_pct: number;
  cpr_width_label: string;
  cpr_relationship: string;
  cpr_relationship_short: string;
  day_type: "Trend Day" | "Range Day";
  trade_bias: "Bullish" | "Bearish" | "Breakout" | "Range" | "Neutral";
  trade_plan: DailyTradePlan;
}

export type CprLevelsMap = Record<
  "tc" | "pivot" | "bc" | "r1" | "r2" | "s1" | "s2",
  number
>;
