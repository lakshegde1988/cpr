"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { CPRAnalysis } from "@/lib/cpr/types";

interface ScannerTableProps {
  stocks: CPRAnalysis[];
  onStockClick: (s: CPRAnalysis) => void;
  onBadgeClick?: (strategy: string) => void;
  getBiasColor: (b: string) => string;
  getBiasBg: (b: string) => string;
  getWidthColor: (l: string) => string;
  getRelationshipColor: (r: string) => string;
}

function formatCprWidthDisplay(stock: CPRAnalysis): string {
  return `${stock.cpr_width_label} (${stock.cpr_width_pct.toFixed(2)}%)`;
}

export function ScannerTable({
  stocks,
  onStockClick,
  onBadgeClick,
  getBiasColor,
  getBiasBg,
  getWidthColor,
  getRelationshipColor,
}: ScannerTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CPRAnalysis | null;
    direction: "asc" | "desc";
  }>({ key: "symbol", direction: "asc" });

  const handleSort = (key: keyof CPRAnalysis) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedStocks = useMemo(() => {
    const sorted = [...stocks];
    if (!sortConfig.key) return sorted;

    return sorted.sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [stocks, sortConfig]);

  const total = sortedStocks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [stocks, pageSize, sortConfig]);

  const effectivePage = Math.min(Math.max(1, page), totalPages);
  const start = (effectivePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = sortedStocks.slice(start, end);

  const SortIcon = ({ columnKey }: { columnKey: keyof CPRAnalysis }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-1 w-3 h-3 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="ml-1 w-3 h-3 text-primary" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface2/50">
              <th
                className="text-left py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Stock
                  <SortIcon columnKey="name" />
                </div>
              </th>
              <th
                className="text-left py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("symbol")}
              >
                <div className="flex items-center">
                  Symbol
                  <SortIcon columnKey="symbol" />
                </div>
              </th>
              <th
                className="text-right py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("current_price")}
              >
                <div className="flex items-center justify-end">
                  Price
                  <SortIcon columnKey="current_price" />
                </div>
              </th>
              <th
                className="text-right py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("cpr_width_pct")}
              >
                <div className="flex items-center justify-end">
                  CPR Width
                  <SortIcon columnKey="cpr_width_pct" />
                </div>
              </th>
              <th
                className="text-left py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("cpr_relationship_short")}
              >
                <div className="flex items-center">
                  Relationship
                  <SortIcon columnKey="cpr_relationship_short" />
                </div>
              </th>
              <th
                className="text-left py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("pivot_trend")}
              >
                <div className="flex items-center">
                  Pivot Trend
                  <SortIcon columnKey="pivot_trend" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {pageRows.map((stock, i) => (
              <tr
                key={`${stock.symbol}-${start + i}`}
                onClick={() => onStockClick(stock)}
                className="hover:bg-surface2/50 cursor-pointer transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{stock.name}</span>
                    <SetupBadges stock={stock} onBadgeClick={onBadgeClick} />
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-muted">{stock.symbol.replace(".NS", "")}</td>
                <td className="py-4 px-4 text-right font-mono text-sm">₹{stock.current_price.toFixed(2)}</td>
                <td
                  className={`py-4 px-4 text-right text-xs font-mono font-medium ${getWidthColor(stock.cpr_width_label)}`}
                >
                  {formatCprWidthDisplay(stock)}
                </td>
                <td
                  className={`py-4 px-4 text-sm font-medium ${getRelationshipColor(stock.cpr_relationship_short)}`}
                >
                  {stock.cpr_relationship_short}
                </td>
                <td className={`py-4 px-4 text-sm font-medium ${getBiasColor(stock.pivot_trend)}`}>
                  {stock.pivot_trend}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {pageRows.map((stock, i) => (
          <div
            key={`${stock.symbol}-card-${start + i}`}
            onClick={() => onStockClick(stock)}
            className="bg-surface border border-border rounded-2xl p-5 active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-base leading-tight">{stock.name}</h4>
                  <SetupBadges stock={stock} onBadgeClick={onBadgeClick} />
                </div>
                <p className="text-[10px] text-muted font-mono uppercase tracking-widest">{stock.symbol.replace(".NS", "")}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-black font-mono text-primary">₹{stock.current_price.toFixed(2)}</div>
                <div className={`text-[10px] font-bold uppercase ${getBiasColor(stock.pivot_trend)}`}>
                  {stock.pivot_trend}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/40">
              <div>
                <div className="text-[9px] text-muted uppercase font-bold tracking-tighter mb-1">Relationship</div>
                <div className={`text-xs font-bold ${getRelationshipColor(stock.cpr_relationship_short)}`}>
                  {stock.cpr_relationship_short}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-muted uppercase font-bold tracking-tighter mb-1">CPR Width</div>
                <div className={`text-xs font-bold ${getWidthColor(stock.cpr_width_label)}`}>
                  {formatCprWidthDisplay(stock)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1 py-2">
        <p className="text-xs text-muted">
          {total === 0 ? (
            "No stocks match the current filters"
          ) : (
            <>
              Showing <span className="text-foreground font-semibold">{start + 1}</span> to{" "}
              <span className="text-foreground font-semibold">{end}</span> of{" "}
              <span className="text-foreground font-semibold">{total}</span> stocks
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-black border border-border rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size} className="bg-black text-white">
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={effectivePage <= 1}
              onClick={() => setPage(effectivePage - 1)}
              className="p-1.5 rounded-md hover:bg-surface2 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-2">
              {effectivePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={effectivePage >= totalPages}
              onClick={() => setPage(effectivePage + 1)}
              className="p-1.5 rounded-md hover:bg-surface2 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupBadges({ 
  stock, 
  onBadgeClick 
}: { 
  stock: CPRAnalysis; 
  onBadgeClick?: (s: string) => void;
}) {
  const handleClick = (e: React.MouseEvent, strategy: string) => {
    if (onBadgeClick) {
      e.stopPropagation();
      onBadgeClick(strategy);
    }
  };

  if (stock.cpr_relationship_short === "Inside Value" && stock.cpr_width_label === "Narrow CPR") {
    return (
      <span 
        title="High Conviction Setup" 
        className="text-lg cursor-pointer hover:scale-125 transition-transform"
        onClick={(e) => handleClick(e, "Inside + Narrow")}
      >
        💣
      </span>
    );
  }
  if (stock.cpr_relationship_short === "Inside Value") {
    return (
      <span 
        title="Inside CPR" 
        className="text-lg cursor-pointer hover:scale-125 transition-transform"
        onClick={(e) => handleClick(e, "Inside CPR")}
      >
        ⚡
      </span>
    );
  }
  if (stock.cpr_width_label === "Narrow CPR") {
    return (
      <span 
        title="Narrow CPR" 
        className="text-lg cursor-pointer hover:scale-125 transition-transform"
        onClick={(e) => handleClick(e, "Narrow CPR")}
      >
        🔻
      </span>
    );
  }
  return null;
}
