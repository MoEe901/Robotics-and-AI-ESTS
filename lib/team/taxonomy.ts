export const TAXONOMY_NOT_SET = "Not set";

export function taxonomyTitle(value: string | null | undefined): string | undefined {
  if (value == null || String(value).trim() === "") return undefined;
  return String(value).trim();
}

export function taxonomyDisplay(
  value: string | null | undefined,
  fallback: string = TAXONOMY_NOT_SET,
): string {
  return taxonomyTitle(value) ?? fallback;
}
