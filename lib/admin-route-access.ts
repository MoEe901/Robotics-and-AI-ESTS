import type { ProvisionedAdminRole } from "@/lib/admin-access-client";

export type { ProvisionedAdminRole } from "@/lib/admin-access-client";

/**
 * Returns true if the given pathname is accessible for the given role.
 * `admin` role has full access to all /admin/* paths except /admin/login.
 */
export function isAdminPathAllowedForRole(
  pathname: string,
  role: ProvisionedAdminRole | null,
): boolean {
  if (role === "admin") {
    return (
      pathname.startsWith("/admin/") && pathname !== "/admin/login"
    );
  }
  if (!role) return false;

  const p =
    pathname === "/admin" ? "/admin/dashboard" : pathname;

  if (role === "viewer") {
    return (
      p === "/admin/dashboard" ||
      p.startsWith("/admin/dashboard/")
    );
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
    if (p === "/admin/layout" ||
        p.startsWith("/admin/layout/")) return false;
    if (p === "/admin/access" ||
        p.startsWith("/admin/access/")) return false;
    if (p === "/admin/notifications" ||
        p.startsWith("/admin/notifications/")) return false;
    if (p === "/admin/submissions" ||
        p.startsWith("/admin/submissions/")) return false;
    return (
      p.startsWith("/admin/") && p !== "/admin/login"
    );
  }
  return false;
}
