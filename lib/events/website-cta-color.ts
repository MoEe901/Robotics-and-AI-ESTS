/** Default fill when no custom color is stored (Tailwind sky-600). */
export const WEBSITE_CTA_DEFAULT_HEX = "#0284c7";

/** Accepts `#rrggbb` (6 hex digits). */
export function parseWebsiteCtaHex(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(s) ? s : undefined;
}
