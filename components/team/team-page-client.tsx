"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { TeamDirectory } from "@/components/team/team-directory";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { subscribeToTeamByYear } from "@/lib/firebase/realtime";
import {
  getCurrentAcademicYearLabel,
  isValidAcademicYearLabel,
  normalizeAcademicYearLabel,
} from "@/lib/team/academic-year";
import { useTeamStore } from "@/store/teamStore";

function normalizeRoleFilter(role: string | null | undefined): string {
  if (role == null || role.trim() === "" || role === "All") return "All";
  return decodeURIComponent(role.trim());
}

function resolveAcademicYear(yearParam: string | null): string {
  const current = getCurrentAcademicYearLabel();
  if (!yearParam) return current;
  const decoded = decodeURIComponent(yearParam.trim());
  const normalized = normalizeAcademicYearLabel(decoded);
  return isValidAcademicYearLabel(normalized) ? normalized : current;
}

export function TeamPageClient() {
  const params = useSearchParams();
  const year = useMemo(() => resolveAcademicYear(params.get("year")), [params]);
  const role = useMemo(() => normalizeRoleFilter(params.get("role")), [params]);
  /** One cache entry per academic year — filter by roleType in the directory UI. */
  const cacheKey = year;

  const clientMounted = useClientMounted();

  const membersByKey = useTeamStore((s) => s.membersByKey);
  const loadedByKey = useTeamStore((s) => s.loadedByKey);
  const setMembers = useTeamStore((s) => s.setMembers);
  const markLoaded = useTeamStore((s) => s.markLoaded);

  const members = membersByKey[cacheKey] ?? [];
  const loaded = loadedByKey[cacheKey] ?? false;
  const awaitingLive = !loaded && members.length === 0;

  useEffect(() => {
    let cancelled = false;
    const unsub = subscribeToTeamByYear(
      year,
      (rows) => {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.log("TEAM ROWS:", rows.length, { year });
        }
        setMembers(cacheKey, rows);
      },
      {
        onError: () => {
          if (!cancelled) markLoaded(cacheKey);
        },
      },
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [cacheKey, markLoaded, setMembers, year]);

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
