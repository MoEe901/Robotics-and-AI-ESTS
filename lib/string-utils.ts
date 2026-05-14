/** Safe trim: returns trimmed string or empty string for non-string inputs. */
export function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Case-insensitive dedup with internal whitespace normalization. */
export function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim().replace(/\s+/g, " ");
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}
