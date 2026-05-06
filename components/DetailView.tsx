"use client";

import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CPRAnalysis } from "@/lib/cpr/types";

interface DetailViewProps {
  stock: CPRAnalysis;
  onBack: () => void;
  getBiasColor: (b: string) => string;
  getBiasBg: (b: string) => string;
  getWidthColor: (l: string) => string;
  getRelationshipColor: (r: string) => string;
}

function formatCprWidthDisplay(stock: CPRAnalysis): string {
  return `${stock.cpr_width_label} (${stock.cpr_width_pct.toFixed(2)}%)`;
}

export function DetailView({
  stock,
  onBack,
  getBiasColor,
  getBiasBg,
  getWidthColor,
  getRelationshipColor,
}: DetailViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-lg hover:bg-border transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scanner
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Header Card */}
          <div className="lg:col-span-12">
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight text-center md:text-left">{stock.name}</h2>
                  <div className="text-muted font-mono text-xs md:text-sm tracking-widest text-center md:text-left">{stock.symbol.replace(".NS", "")}</div>
                </div>
                <div className="flex justify-center md:justify-end gap-6 md:gap-8">
                  <div className="text-center md:text-right">
                    <div className="text-[10px] text-muted uppercase font-semibold tracking-wider mb-1">Current Price</div>
                    <div className="text-2xl md:text-3xl font-bold font-mono text-primary">₹{stock.current_price.toFixed(2)}</div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-[10px] text-muted uppercase font-semibold tracking-wider mb-1">Structure</div>
                    <div className={`text-lg md:text-xl font-bold ${getBiasColor(stock.pivot_trend)}`}>
                      {stock.pivot_trend}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Left Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base md:text-lg font-bold tracking-tight text-foreground">Technical Structure</h3>
                <div className="px-3 py-1 bg-surface2 rounded-full text-xs font-semibold text-muted">
                  Monthly Intervals
                </div>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Current Month Levels</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <CPRLevel label="TC" value={stock.current_month_cpr.tc} color="text-primary" />
                    <CPRLevel label="Pivot" value={stock.current_month_cpr.pivot} color="text-blue-400" />
                    <CPRLevel label="BC" value={stock.current_month_cpr.bc} color="text-danger" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <CPRLevel label="R2" value={stock.current_month_cpr.r2} color="text-primary/70" size="sm" />
                    <CPRLevel label="R1" value={stock.current_month_cpr.r1} color="text-primary/70" size="sm" />
                    <CPRLevel label="S1" value={stock.current_month_cpr.s1} color="text-danger/70" size="sm" />
                    <CPRLevel label="S2" value={stock.current_month_cpr.s2} color="text-danger/70" size="sm" />
                  </div>
                </div>

                <div className="pt-8 border-t border-border/50">
                  <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Previous Month Levels</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <CPRLevel label="TC" value={stock.previous_month_cpr.tc} color="text-muted" />
                    <CPRLevel label="Pivot" value={stock.previous_month_cpr.pivot} color="text-muted" />
                    <CPRLevel label="BC" value={stock.previous_month_cpr.bc} color="text-muted" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6 tracking-tight">Summary of Analysis</h3>
              <div className="space-y-4">
                <AnalysisRow
                  label="CPR Width"
                  value={formatCprWidthDisplay(stock)}
                  colorClass={getWidthColor(stock.cpr_width_label)}
                />
                <AnalysisRow
                  label="CPR Relationship"
                  value={stock.cpr_relationship}
                  colorClass={getRelationshipColor(stock.cpr_relationship)}
                />
                <AnalysisRow
                  label="Pivot Trend"
                  value={stock.pivot_trend}
                  colorClass={getBiasColor(stock.pivot_trend)}
                />
              </div>
            </div>
          </div>

          {/* Interpretation Right Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm h-full">
              <h3 className="text-lg font-bold mb-6 tracking-tight">Trade Execution Plan</h3>
              <StrategyCard interpretation={stock.strategy_interpretation} />
              
              <div className="mt-10 pt-10 border-t border-border/50">
                <h3 className="text-lg font-bold mb-6 tracking-tight text-foreground">Trend Intelligence</h3>
                <TrendCard insight={stock.trend_insight} pivotTrend={stock.pivot_trend} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CPRLevel({ label, value, color, size = "md" }: { label: string; value: number; color: string; size?: "sm" | "md" }) {
  return (
    <div className="text-center p-3 rounded-xl bg-surface2/30 border border-border/50">
      <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className={`${size === "sm" ? "text-sm" : "text-lg"} font-mono font-bold ${color}`}>₹{value.toFixed(2)}</div>
    </div>
  );
}

function StrategyCard({ interpretation }: { interpretation: Record<string, string> }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mb-1">Strategic Bias</div>
        <div className="font-bold text-lg text-primary">{interpretation.bias}</div>
      </div>
      <div>
        <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Expected Behavior</div>
        <div className="text-sm leading-relaxed text-foreground/90">{interpretation.expected_behavior}</div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="p-3 rounded-xl bg-surface2/50 border border-border/50">
          <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Entry Zone</div>
          <div className="text-sm font-mono font-semibold">{interpretation.entry_zone}</div>
        </div>
        <div className="p-3 rounded-xl bg-danger/5 border border-danger/20">
          <div className="text-[10px] text-danger/70 font-bold uppercase tracking-widest mb-1">Stop Loss</div>
          <div className="text-sm font-mono font-bold text-danger">{interpretation.stop_loss}</div>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mb-1">Targets</div>
          <div className="text-sm font-mono font-bold text-primary">{interpretation.targets}</div>
        </div>
      </div>
    </div>
  );
}

function TrendCard({
  insight,
  pivotTrend,
}: {
  insight: Record<string, string>;
  pivotTrend: string;
}) {
  const getTrendIcon = () => {
    if (pivotTrend.includes("Bullish"))
      return <div className="p-2 rounded-full bg-primary/10 text-primary"><TrendingUp className="w-5 h-5" /></div>;
    if (pivotTrend.includes("Bearish"))
      return <div className="p-2 rounded-full bg-danger/10 text-danger"><TrendingDown className="w-5 h-5" /></div>;
    return <div className="p-2 rounded-full bg-warning/10 text-warning"><Minus className="w-5 h-5" /></div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {getTrendIcon()}
        <div>
          <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Current Structure</div>
          <div className="font-bold">{insight.current_structure}</div>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-surface2/50 border border-border/50">
        <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Key Level to Watch</div>
        <div className="text-sm font-mono font-semibold">{insight.key_level_to_watch}</div>
      </div>
    </div>
  );
}

function AnalysisRow({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted font-medium">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}
