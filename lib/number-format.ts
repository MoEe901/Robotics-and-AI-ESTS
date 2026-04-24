/**
 * Shared numeric formatters for hero stats tiles and anywhere else a number
 * needs consistent presentation. Keep these pure and dependency-free.
 */

export function formatPlain(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.trunc(value));
}

/**
 * Zero-pad up to `digits` places. Defaults to 3 — matches the "014"/"007"
 * countdown-style tiles referenced in the admin UI. Values wider than
 * `digits` are returned unchanged (so 1200 still reads as "1200").
 */
export function formatPadded(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "0".padStart(digits, "0");
  const n = Math.max(0, Math.trunc(value));
  const str = String(n);
  if (str.length >= digits) return str;
  return str.padStart(digits, "0");
}

/**
 * Compact humanized format. 1_200 → "1.2K", 1_000_000 → "1M", 1_230_000 → "1.2M".
 * Keeps at most 1 decimal; trims trailing ".0". Negatives are preserved.
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const n = Math.trunc(value);
  const abs = Math.abs(n);
  if (abs < 1_000) return String(n);
  const sign = n < 0 ? "-" : "";
  if (abs < 1_000_000) {
    const v = abs / 1_000;
    return `${sign}${trim1(v)}K`;
  }
  if (abs < 1_000_000_000) {
    const v = abs / 1_000_000;
    return `${sign}${trim1(v)}M`;
  }
  const v = abs / 1_000_000_000;
  return `${sign}${trim1(v)}B`;
}

function trim1(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(Math.trunc(r)) : r.toFixed(1);
}

export type NumberFormatMode = "plain" | "compact" | "padded";

export function formatNumber(value: number, mode: NumberFormatMode): string {
  switch (mode) {
    case "compact":
      return formatCompact(value);
    case "padded":
      return formatPadded(value);
    case "plain":
    default:
      return formatPlain(value);
  }
}
