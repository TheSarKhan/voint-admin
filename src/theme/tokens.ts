/**
 * Voint dizayn tokenlari — monoxrom, dark-first (voint-panel ile eyni).
 * CSS terefi `src/index.css` daxilindeki @theme blokudur;
 * bu fayl TS terefinden (inline stil, SVG chart vs.) istifade ucundur.
 */
export const colors = {
  bg: "#131313",
  surface: "#1a1a1a",
  surface2: "#202020",
  border: "#2a2a2a",
  borderStrong: "#3a3a3a",
  fg: "#f2f2f2",
  fgMuted: "#9a9a9a",
  fgFaint: "#6b6b6b",
  accent: "#e8e8e8",
  accentFg: "#131313",
  ok: "#6fbf8f",
  warn: "#d9b96a",
  err: "#d97a6a",
} as const;

export type ColorToken = keyof typeof colors;
