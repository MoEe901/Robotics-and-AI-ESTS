import type { ProvisionedAdminRole } from "@/lib/admin-access-client";

const ALL_HREFS = [
  "/admin/dashboard",
  "/admin/hero",
  "/admin/team",
  "/admin/team/taxonomy",
  "/admin/events",
  "/admin/basic",
  "/admin/navbar",
  "/admin/faq",
  "/admin/apply",
  "/admin/submissions",
  "/admin/activity",
  "/admin/footer-config",
  "/admin/notifications",
  "/admin/layout",
] as const;

/**
 * Minimum URLs each role may see in the admin sidebar (locked routes still apply).
 * `admin` and legacy allowlisted users receive the full list from shell config.
 */
const ROLE_MIN_HREFS: Record<ProvisionedAdminRole, ReadonlySet<string>> = {
  admin: new Set(ALL_HREFS),
  editor: new Set(
    ALL_HREFS.filter(
      (h) =>
        h !== "/admin/layout" &&
        h !== "/admin/access" &&
        h !== "/admin/notifications" &&
        h !== "/admin/submissions",
    ),
  ),
  moderator: new Set(["/admin/dashboard", "/admin/submissions"]),
  viewer: new Set(["/admin/dashboard"]),
};

export function filterAdminNavForRole<T extends { href: string }>(
  role: ProvisionedAdminRole | null,
  isLegacyFullAdmin: boolean,
  items: readonly T[],
): T[] {
  if (isLegacyFullAdmin || role === "admin" || role == null) return [...items];
  const allowed = ROLE_MIN_HREFS[role];
  return items.filter((i) => allowed.has(i.href));
}
