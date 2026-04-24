export const YEAR_LABEL_RE = /^(\d{4})-(\d{4})$/;

/** True when the field is empty — member is shown for every year view. */
export function isAcademicYearOrphan(raw: string | undefined | null): boolean {
  return raw == null || String(raw).trim() === "";
}

/**
 * Canonical `YYYY-YYYY` with ASCII hyphen. Accepts en/em dash and slashes as typed in CMS or URLs.
 */
export function normalizeAcademicYearLabel(input: string): string {
  const compact = input
    .trim()
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\//g, "-")
    .replace(/\s+/g, "");
  const m = compact.match(/^(\d{4})-(\d{4})$/);
  if (m) return `${m[1]}-${m[2]}`;
  return input.trim();
}

/**
 * Compare stored CMS `academicYear` to a canonical target (e.g. 2025-2026).
 * Orphans match any year. If the stored value is not `YYYY-YYYY`, the row still matches so bad CMS
 * values never hide the whole directory.
 */
export function academicYearMatchesFilter(
  stored: string | undefined | null,
  canonicalTarget: string,
): boolean {
  if (isAcademicYearOrphan(stored)) return true;
  const a = normalizeAcademicYearLabel(String(stored));
  const b = normalizeAcademicYearLabel(canonicalTarget);
  const ma = a.match(YEAR_LABEL_RE);
  const mb = b.match(YEAR_LABEL_RE);
  if (ma && mb) {
    return ma[1] === mb[1] && ma[2] === mb[2];
  }
  if (!ma) return true;
  if (!mb) return a === b || String(stored).trim() === String(canonicalTarget).trim();
  return false;
}

/** Non-orphan rows whose year equals the canonical label (for "does this year have members?"). */
export function academicYearMatchesStrict(
  stored: string | undefined | null,
  canonicalTarget: string,
): boolean {
  if (isAcademicYearOrphan(stored)) return false;
  const a = normalizeAcademicYearLabel(String(stored));
  const b = normalizeAcademicYearLabel(canonicalTarget);
  const ma = a.match(YEAR_LABEL_RE);
  const mb = b.match(YEAR_LABEL_RE);
  if (!ma || !mb) return false;
  return ma[1] === mb[1] && ma[2] === mb[2];
}

/**
 * Values that may appear in Sanity for the same academic year (dash variants).
 */
export function academicYearQueryAliases(canonicalHyphen: string): string[] {
  const m = canonicalHyphen.trim().match(/^(\d{4})-(\d{4})$/);
  if (!m) return [canonicalHyphen.trim()];
  const y1 = m[1];
  const y2 = m[2];
  return Array.from(
    new Set([
      `${y1}-${y2}`,
      `${y1}\u2013${y2}`,
      `${y1}\u2014${y2}`,
      `${y1}/${y2}`,
    ]),
  );
}

/** Academic year label e.g. 2025-2026 (Sep–Aug). */
export function getCurrentAcademicYearLabel(date = new Date()): string {
  const y = date.getFullYear();
  const month = date.getMonth();
  if (month >= 8) {
    return `${y}-${y + 1}`;
  }
  return `${y - 1}-${y}`;
}

export function isValidAcademicYearLabel(label: string): boolean {
  const m = normalizeAcademicYearLabel(label).match(YEAR_LABEL_RE);
  if (!m) return false;
  const y1 = Number(m[1]);
  const y2 = Number(m[2]);
  return y2 === y1 + 1;
}

/** Previous or next academic year label, e.g. shift one year: 2025-2026 → 2024-2025 or 2026-2027 */
export function shiftAcademicYear(label: string, delta: number): string | null {
  if (!isValidAcademicYearLabel(label)) return null;
  const m = normalizeAcademicYearLabel(label).match(YEAR_LABEL_RE)!;
  const start = Number(m[1]) + delta;
  return `${start}-${start + 1}`;
}

export function teamListingHref(options: { year: string; role?: string }): string {
  const params = new URLSearchParams();
  params.set("year", options.year);
  if (options.role && options.role !== "All") {
    params.set("role", options.role);
  }
  const q = params.toString();
  return q ? `/team?${q}` : "/team";
}
