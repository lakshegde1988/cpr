/**
 * Universe → JSON filename under /public (single source of truth).
 * Safe to import from Client Components (no Node APIs).
 */
export const UNIVERSE_STOCK_FILES: Record<string, string> = {
  fno: "fno.json",
  largecap: "largecaps.json",
  midcap: "midcaps.json",
  smallcap: "smallcaps.json",
  microcap: "microcaps.json",
};

export const UNIVERSE_OPTIONS: { value: string; label: string }[] = [
  { value: "fno", label: "F&O" },
  { value: "largecap", label: "Largecap 100" },
  { value: "midcap", label: "Midcap 150" },
  { value: "smallcap", label: "Smallcap 250" },
  { value: "microcap", label: "Microcap 250" },
];
