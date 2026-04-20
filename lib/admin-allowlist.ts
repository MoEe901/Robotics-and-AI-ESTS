/**
 * Client-visible allowlist for who may use /admin UI.
 * Firestore Security Rules must still enforce writes server-side (see dashboard hint).
 */
export function parseAdminEmails(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowlistedAdmin(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const allow = parseAdminEmails();
  if (allow.size === 0) return false;
  return allow.has(email.trim().toLowerCase());
}
