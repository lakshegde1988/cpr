"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Menu, X as CloseIcon } from "lucide-react";
import { UNIVERSE_OPTIONS } from "@/lib/cpr/universes";

interface SidebarProps {
  selectedUniverse: string;
  setSelectedUniverse: (u: string) => void;
  strategyFilter: string;
  setStrategyFilter: (f: string) => void;
  filterCounts: Record<string, number>;
  loading: boolean;
  handleScanSubmit: () => void;
  resultsUniverse: string | null;
  stockCount: number;
  universeLabel: (v: string) => string | undefined;
}

const STRATEGY_FILTERS = [
  { label: "All", icon: null },
  { label: "Inside CPR", icon: null },
  { label: "Narrow CPR", icon: null },
  { label: "Inside + Narrow", icon: null },
];

export function Sidebar({
  selectedUniverse,
  setSelectedUniverse,
  strategyFilter,
  setStrategyFilter,
  filterCounts,
  loading,
  handleScanSubmit,
  resultsUniverse,
  stockCount,
  universeLabel,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-[#0f1115] border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-lg">C</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">CPR Alpha</h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-surface2 border border-border/50 text-foreground"
        >
          {isOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={`w-full lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 bg-[#0f1115] border-r border-border/40 overflow-y-auto z-20 shadow-xl transition-all duration-300 ease-in-out ${isOpen ? "block" : "hidden lg:block"
          }`}
      >
        <div className="p-8 space-y-10">
          {/* Branding/Title (Hidden on mobile as it's in the header) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-background font-bold text-lg">C</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">CPR Alpha</h2>
          </div>

          {/* Universe Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Universe
              </h3>
            </div>
            <div className="space-y-3">
              <select
                id="universe-select-sidebar"
                value={selectedUniverse}
                onChange={(e) => setSelectedUniverse(e.target.value)}
                disabled={loading}
                className="w-full bg-black text-white border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              >
                <option value="" className="bg-black text-white">Select Universe</option>
                {UNIVERSE_OPTIONS.map((universe) => (
                  <option key={universe.value} value={universe.value} className="bg-black text-white">
                    {universe.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleScanSubmit}
                disabled={loading || !selectedUniverse}
                className="w-full px-4 py-3 text-sm font-bold bg-primary text-background rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {loading ? "Analyzing..." : "Scan Market"}
              </button>
            </div>
          </div>

          {/* Filters Section - Only show when results are active */}
          {resultsUniverse && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Setup Filter
                </h3>
                {strategyFilter !== "All" && (
                  <button
                    onClick={() => setStrategyFilter("All")}
                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {STRATEGY_FILTERS.map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => setStrategyFilter(filter.label)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border group ${strategyFilter === filter.label
                        ? "bg-primary text-background border-primary shadow-lg shadow-primary/20"
                        : "bg-surface2/30 border-border/40 text-muted hover:border-muted/50 hover:bg-surface2/50"
                      }`}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="tracking-tight">{filter.label}</span>
                      <span className={`text-[10px] font-medium ${strategyFilter === filter.label ? "opacity-70" : "text-primary"}`}>
                        {filterCounts[filter.label] || 0} stocks
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicator */}
          {resultsUniverse && (
            <div className="pt-8 border-t border-border/20">
              <div className="p-5 bg-surface2/20 rounded-2xl border border-border/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Active Status</span>
                </div>
                <div className="text-xs font-bold truncate mb-1 text-foreground">
                  {universeLabel(resultsUniverse) ?? resultsUniverse}
                </div>
                <div className="text-[10px] text-muted font-medium italic">
                  {stockCount} assets analyzed
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
