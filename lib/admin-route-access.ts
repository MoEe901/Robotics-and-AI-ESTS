import type { ProvisionedAdminRole } from "@/lib/admin-access-client";

export type { ProvisionedAdminRole } from "@/lib/admin-access-client";

/** True if this path may be opened in the admin panel for the given role (legacy / admin role = full). */
export function isAdminPathAllowedForRole(
  pathname: string,
  role: ProvisionedAdminRole | null,
  isLegacyOrFullAdmin: boolean,
): boolean {
  if (isLegacyOrFullAdmin || role === "admin") return pathname.startsWith("/admin/") && pathname !== "/admin/login";
  if (!role) return false;

  const p = pathname === "/admin" ? "/admin/dashboard" : pathname;

  if (role === "viewer") {
    return p === "/admin/dashboard" || p.startsWith("/admin/dashboard/");
  }
  if (role === "moderator") {
    return (
      p === "/admin/dashboard" ||
      p.startsWith("/admin/dashboard/") ||
      p === "/admin/submissions" ||
      p.startsWith("/admin/submissions/")
    );
  }
  if (role === "editor") {
    if (p === "/admin/layout" || p.startsWith("/admin/layout/")) return false;
    if (p === "/admin/access" || p.startsWith("/admin/access/")) return false;
    if (p === "/admin/notifications" || p.startsWith("/admin/notifications/")) return false;
    if (p === "/admin/submissions" || p.startsWith("/admin/submissions/")) return false;
    return p.startsWith("/admin/") && p !== "/admin/login";
  }
  return false;
}
