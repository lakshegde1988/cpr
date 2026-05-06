"use client";

import { Search, X, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ScannerTable } from "@/components/ScannerTable";
import { DetailView } from "@/components/DetailView";
import { useScanner } from "@/hooks/useScanner";
import { UNIVERSE_OPTIONS } from "@/lib/cpr/universes";

const STRATEGY_FILTERS = [
  { label: "All", icon: null },
  { label: "Inside CPR", icon: null },
  { label: "Narrow CPR", icon: null },
  { label: "Inside + Narrow", icon: null },
];

export default function App() {
  const {
    stocks,
    filteredStocks,
    filterCounts,
    selectedStock,
    setSelectedStock,
    loading,
    error,
    selectedUniverse,
    setSelectedUniverse,
    resultsUniverse,
    stockCount,
    searchQuery,
    setSearchQuery,
    strategyFilter,
    setStrategyFilter,
    handleScanSubmit,
  } = useScanner();

  const universeLabel = (value: string) => {
    if (!value) return undefined;
    return UNIVERSE_OPTIONS.find((u) => u.value === value)?.label;
  };

  const getBiasColor = (bias: string) => {
    if (bias === "Buy" || bias.includes("Bullish") || bias.includes("Strong Bullish")) return "text-primary";
    if (bias === "Sell" || bias.includes("Bearish")) return "text-danger";
    if (bias === "Breakout") return "text-blue-400";
    return "text-warning";
  };

  const getBiasBg = (bias: string) => {
    if (bias === "Buy" || bias.includes("Bullish") || bias.includes("Strong Bullish"))
      return "bg-primary/10 border-primary/20";
    if (bias === "Sell" || bias.includes("Bearish"))
      return "bg-danger/10 border-danger/20";
    if (bias === "Breakout") return "bg-blue-500/10 border-blue-500/20";
    return "bg-warning/10 border-warning/20";
  };

  const getWidthColor = (label: string) => {
    if (label.includes("Narrow")) return "text-primary";
    if (label.includes("Wide")) return "text-danger";
    return "text-muted";
  };

  const getRelationshipColor = (relationship: string) => {
    if (relationship.includes("Bullish") || relationship.includes("Higher"))
      return "text-primary";
    if (relationship.includes("Bearish") || relationship.includes("Lower"))
      return "text-danger";
    if (relationship.includes("Inside")) return "text-blue-400";
    if (relationship.includes("Outside")) return "text-warning";
    return "text-muted";
  };

  if (selectedStock) {
    return (
      <DetailView
        stock={selectedStock}
        onBack={() => setSelectedStock(null)}
        getBiasColor={getBiasColor}
        getBiasBg={getBiasBg}
        getWidthColor={getWidthColor}
        getRelationshipColor={getRelationshipColor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Sidebar
        selectedUniverse={selectedUniverse}
        setSelectedUniverse={setSelectedUniverse}
        strategyFilter={strategyFilter}
        setStrategyFilter={setStrategyFilter}
        filterCounts={filterCounts}
        loading={loading}
        handleScanSubmit={handleScanSubmit}
        resultsUniverse={resultsUniverse}
        stockCount={stockCount}
        universeLabel={universeLabel}
      />

      <main className="flex-1 lg:ml-72 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-10 max-w-7xl">
          {error && (
            <div className="mb-8 p-5 bg-danger/5 border border-danger/20 rounded-2xl text-danger flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-wider mb-0.5">Analysis Failed</div>
                <p className="text-sm opacity-90 font-medium">{error}</p>
              </div>
            </div>
          )}

          {!resultsUniverse && !loading ? (
            <div className="space-y-8">
              {/* Quick Scan Entry for Mobile (when no results) */}
              <div className="lg:hidden bg-surface border border-border rounded-[2rem] p-8 shadow-sm text-center">
                <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6">Select Universe</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {UNIVERSE_OPTIONS.map((u) => (
                    <button
                      key={`init-${u.value}`}
                      onClick={() => setSelectedUniverse(u.value)}
                      className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${selectedUniverse === u.value
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface2/50 border-border/50 text-muted"
                        }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleScanSubmit}
                  disabled={loading || !selectedUniverse}
                  className="w-full py-4 bg-primary text-background rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Start Scanning
                </button>
              </div>

              <div className="hidden lg:flex flex-col items-center justify-center py-40 bg-surface2/20 border border-dashed border-border/60 rounded-[2.5rem] transition-all hover:bg-surface2/30">
                <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-border/40">
                  <Search className="w-10 h-10 text-muted/40" />
                </div>
                <h2 className="text-2xl font-bold mb-3 tracking-tight">Market Intel Pending</h2>
                <p className="text-muted text-center max-w-sm px-8 text-sm font-medium leading-relaxed">
                  Choose an asset universe from the sidebar to begin the positional analysis scan.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
              {/* Quick Universe & Scan Bar (Mobile Only - Active State) */}
              <div className="lg:hidden space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Switch Universe</span>
                  {selectedUniverse !== resultsUniverse && (
                    <button
                      onClick={handleScanSubmit}
                      className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse"
                    >
                      Tap to Scan →
                    </button>
                  )}
                </div>
                <div className="-mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                  <div className="flex items-center gap-2 w-max">
                    {UNIVERSE_OPTIONS.map((u) => (
                      <button
                        key={`quick-uni-${u.value}`}
                        onClick={() => setSelectedUniverse(u.value)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${selectedUniverse === u.value
                          ? "bg-surface2 border-primary text-primary shadow-sm"
                          : "bg-surface border-border/40 text-muted"
                          }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Strategy Bar (Mobile Only) */}
              {resultsUniverse && (
                <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                  <div className="flex items-center gap-2 w-max">
                    {STRATEGY_FILTERS.map((filter) => (
                      <button
                        key={`pill-${filter.label}`}
                        onClick={() => setStrategyFilter(filter.label)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${strategyFilter === filter.label
                          ? "bg-primary text-background border-primary shadow-md"
                          : "bg-surface border-border/60 text-muted hover:border-muted"
                          }`}
                      >
                        <span>
                          {filter.label}{" "}
                          <span className={strategyFilter === filter.label ? "opacity-70" : "text-primary"}>
                            ({filterCounts[filter.label as keyof typeof filterCounts] || 0})
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                <div className="relative group w-full md:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted/60 group-focus-within:text-primary transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface border border-border/50 rounded-2xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted/50 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted/40 hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <RefreshCw className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-black text-lg tracking-tight">Processing Market Data</p>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Analyzing {universeLabel(selectedUniverse)}</p>
                  </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <ScannerTable
                    stocks={filteredStocks}
                    onStockClick={setSelectedStock}
                    onBadgeClick={setStrategyFilter}
                    getBiasColor={getBiasColor}
                    getBiasBg={getBiasBg}
                    getWidthColor={getWidthColor}
                    getRelationshipColor={getRelationshipColor}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
