/**
 * Format an event date for public display.
 *
 * Admin can store either a real ISO date (calendar mode) or arbitrary text
 * like "Coming Soon" / "Spring 2026" / "TBD" (custom mode). Naive parsing
 * (`new Date(value).toLocaleDateString(...)`) returns "Invalid Date" for the
 * second case — this helper guards against that:
 *   - empty / dateTba       → fallback (caller decides, e.g. "Date TBA")
 *   - parseable date string → localised label using the supplied options
 *   - any other string      → returned verbatim, trimmed
 *
 * Centralised so every public surface (carousels, hero rail, documentary
 * page) renders custom date text identically.
 */
export type FormatEventDateOptions = {
  fallback?: string;
  dateTba?: boolean;
  formatOptions?: Intl.DateTimeFormatOptions;
  locale?: string | string[];
};

export function formatEventDate(
  raw: string | null | undefined,
  {
    fallback = "Date TBA",
    dateTba = false,
    formatOptions = { month: "short", day: "numeric", year: "numeric" },
    locale,
  }: FormatEventDateOptions = {},
): string {
  if (dateTba) return fallback;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return fallback;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return trimmed;
  return new Date(parsed).toLocaleDateString(locale, formatOptions);
}

/** Google Maps search for a place name (opens exact search results). */
export function googleMapsSearchUrl(placeName: string): string {
  const q = placeName.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Prefer stored Maps URL; otherwise search by venue label. */
export function eventLocationHref(location?: string, mapsUrl?: string): string | null {
  const u = mapsUrl?.trim();
  if (u) {
    try {
      new URL(u);
      return u;
    } catch {
      /* fall through */
    }
  }
  const label = location?.trim();
  if (!label) return null;
  return googleMapsSearchUrl(label);
}

export function youtubeEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([^/]+)/);
      if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`;
      const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}
