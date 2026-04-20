import type { RoleSummary } from "@/lib/team/types";

export function formatRoleTitles(roles?: RoleSummary[] | string[] | null): string {
  if (!roles?.length) return "Member";
  const first = roles[0];
  if (typeof first === "string") {
    return (roles as string[]).filter(Boolean).join(" · ");
  }
  return (roles as RoleSummary[])
    .map((r) => r.title)
    .filter(Boolean)
    .join(" · ");
}
