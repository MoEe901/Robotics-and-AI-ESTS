/** Format Sanity `date` (YYYY-MM-DD) for display on profile. */
export function formatBirthdayDisplay(isoDate: string): string {
  const normalized = isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
