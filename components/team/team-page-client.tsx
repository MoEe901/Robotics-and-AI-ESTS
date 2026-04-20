"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { TeamDirectory } from "@/components/team/team-directory";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { subscribeToTeamByYear, subscribeToTeamMembers } from "@/lib/firebase/realtime";
import {
  getCurrentAcademicYearLabel,
  isValidAcademicYearLabel,
  normalizeAcademicYearLabel,
} from "@/lib/team/academic-year";
import type { TeamMemberProfile } from "@/lib/team/types";
import { useTeamStore } from "@/store/teamStore";

function normalizeRoleFilter(role: string | null): "All" {
  void role;
  return "All";
}

function resolveAcademicYear(yearParam: string | null): string {
  const current = getCurrentAcademicYearLabel();
  if (!yearParam) return current;
  const decoded = decodeURIComponent(yearParam.trim());
  const normalized = normalizeAcademicYearLabel(decoded);
  return isValidAcademicYearLabel(normalized) ? normalized : current;
}

function filterMembersForYear(
  members: TeamMemberProfile[],
  year: string,
): TeamMemberProfile[] {
  return members.filter((m) => m.academicYear === year && typeof m.order === "number");
}

export function TeamPageClient() {
  const params = useSearchParams();
  const year = useMemo(() => resolveAcademicYear(params.get("year")), [params]);
  const role = useMemo(() => normalizeRoleFilter(params.get("role")), [params]);
  const cacheKey = `${year}::${role}`;

  const clientMounted = useClientMounted();

  const membersByKey = useTeamStore((s) => s.membersByKey);
  const loadedByKey = useTeamStore((s) => s.loadedByKey);
  const setMembers = useTeamStore((s) => s.setMembers);
  const markLoaded = useTeamStore((s) => s.markLoaded);

  const members = membersByKey[cacheKey] ?? [];
  const loaded = loadedByKey[cacheKey] ?? false;
  const awaitingLive = !loaded && members.length === 0;

  useEffect(() => {
    let unsubscribeFiltered: (() => void) | null = null;
    let startedFiltered = false;

    const unsubscribeDebug = subscribeToTeamMembers(
      (rawRows) => {
        if (process.env.NODE_ENV === "development") {
          const validRaw = filterMembersForYear(rawRows, year);
          console.log("RAW MEMBERS:", rawRows.length);
          console.log("VALID MEMBERS (year match):", validRaw.length, "year=", year);
          const anyDocForYear = rawRows.some((m) => m.academicYear === year);
          if (anyDocForYear && validRaw.length === 0) {
            console.warn("FILTER MISMATCH — doc(s) claim this academicYear but client filter dropped them", {
              year,
              sample: rawRows.find((m) => m.academicYear === year),
            });
          }
        }

        if (startedFiltered) return;
        startedFiltered = true;
        unsubscribeFiltered = subscribeToTeamByYear(
          year,
          (rows) => {
            const filtered =
              role === "All" ? rows : rows.filter((m) => m.roleType === role);

            if (process.env.NODE_ENV === "development") {
              console.log("FILTERED ROWS:", filtered.length, { year, role });
            }

            setMembers(cacheKey, filtered);
          },
          {
            roleType: role,
            onError: () => {
              markLoaded(cacheKey);
            },
          },
        );
        unsubscribeDebug();
      },
      () => {
        markLoaded(cacheKey);
      },
    );

    return () => {
      unsubscribeDebug();
      unsubscribeFiltered?.();
    };
  }, [cacheKey, markLoaded, role, setMembers, year]);

  if (!clientMounted) {
    return <div className="min-h-[50vh]" suppressHydrationWarning aria-hidden />;
  }

  return (
    <TeamDirectory
      members={members}
      academicYear={year}
      initialRoleFilter={role}
      loading={awaitingLive}
    />
  );
}
