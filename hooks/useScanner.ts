"use client";

import { useState, useMemo, useCallback } from "react";
import type { CPRAnalysis } from "@/lib/cpr/types";

const UNIVERSE_PLACEHOLDER_VALUE = "";

export function useScanner() {
  const [stocks, setStocks] = useState<CPRAnalysis[]>([]);
  const [selectedStock, setSelectedStock] = useState<CPRAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUniverse, setSelectedUniverse] = useState(UNIVERSE_PLACEHOLDER_VALUE);
  const [resultsUniverse, setResultsUniverse] = useState<string | null>(null);
  const [stockCount, setStockCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("All");

  const parseJsonBody = (text: string, context: string) => {
    const t = (text ?? "").trim();
    if (!t) throw new Error(`${context}: empty response body`);
    try {
      return JSON.parse(t);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`${context}: invalid JSON (${msg})`);
    }
  };

  const readJsonResponse = useCallback(async (response: Response, context: string) => {
    const text = (await response.text()).trim();
    if (!response.ok) {
      let detail = text;
      if (text) {
        try {
          const j = JSON.parse(text) as { detail?: unknown };
          if (typeof j.detail === "string") detail = j.detail;
          else if (j.detail != null) detail = JSON.stringify(j.detail);
        } catch { /* use raw text */ }
      }
      throw new Error(`${context} failed (${response.status}): ${detail || response.statusText || "unknown error"}`);
    }
    return parseJsonBody(text, context);
  }, []);

  const fetchStocks = useCallback(async (universe: string) => {
    if (!universe) return;
    setLoading(true);
    setError(null);
    setSearchQuery("");
    try {
      const response = await fetch(`/api/scan?universe=${encodeURIComponent(universe)}`);
      const data = (await readJsonResponse(response, "Scan")) as CPRAnalysis[];
      setStocks(data);
      setStockCount(data.length);
      setResultsUniverse(universe);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [readJsonResponse]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (strategyFilter === "Inside CPR") {
        return stock.cpr_relationship_short === "Inside Value";
      }
      if (strategyFilter === "Narrow CPR") {
        return stock.cpr_width_label.includes("Narrow");
      }
      if (strategyFilter === "Inside + Narrow") {
        return (
          stock.cpr_relationship_short === "Inside Value" &&
          stock.cpr_width_label.includes("Narrow")
        );
      }

      return true;
    });
  }, [stocks, searchQuery, strategyFilter]);

  const filterCounts = useMemo(() => {
    return {
      All: stocks.length,
      "Inside CPR": stocks.filter((s) => s.cpr_relationship_short === "Inside Value").length,
      "Narrow CPR": stocks.filter((s) => s.cpr_width_label.includes("Narrow")).length,
      "Inside + Narrow": stocks.filter(
        (s) =>
          s.cpr_relationship_short === "Inside Value" && s.cpr_width_label.includes("Narrow")
      ).length,
    };
  }, [stocks]);

  const handleScanSubmit = () => {
    void fetchStocks(selectedUniverse);
  };

  return {
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
  };
}
