"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { TeamMemberListItem } from "@/lib/team/types";
import { ROLE_TYPE_FILTERS } from "@/lib/team/types";
import {
  getCurrentAcademicYearLabel,
  shiftAcademicYear,
  teamListingHref,
} from "@/lib/team/academic-year";

import { TeamMemberCard } from "./team-member-card";

const PAGE_SIZE = 9;

const ROLE_FILTER_SET = new Set<string>(ROLE_TYPE_FILTERS);

type TeamDirectoryProps = {
  members: TeamMemberListItem[];
  academicYear: string;
  /** When set, the user asked for a different year than `academicYear` (dataset fallback). */
  requestedAcademicYear?: string;
  initialRoleFilter?: string;
  /** Waiting for first Firestore snapshot — keep shell + skeleton grid. */
  loading?: boolean;
};

export function TeamDirectory({
  members,
  academicYear,
  requestedAcademicYear,
  initialRoleFilter = "All",
  loading = false,
}: TeamDirectoryProps) {
  const filter =
    initialRoleFilter && ROLE_FILTER_SET.has(initialRoleFilter) ? initialRoleFilter : "All";
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (filter === "All") return members;
    return members.filter((m) => (m.roleType ?? "Member") === filter);
  }, [members, filter]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  const prevYear = shiftAcademicYear(academicYear, -1);
  const nextYear = shiftAcademicYear(academicYear, 1);
  const currentYear = getCurrentAcademicYearLabel();
  const isCurrentYear = academicYear === currentYear;
  const showYearMismatch =
    requestedAcademicYear &&
    requestedAcademicYear !== academicYear &&
    members.length > 0;

  return (
    <main className="mx-auto w-[min(94%,1100px)] px-4 pb-24 pt-28 md:px-6 md:pt-32">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Directory</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">Team</h1>
          <p className="mt-3 max-w-xl text-sm text-white/70">
            {loading ? (
              <>
                <span className="text-white/55">Loading directory…</span>
                {" · academic year "}
                <span className="font-mono text-white/90">{academicYear}</span>
              </>
            ) : (
              <>
                <span className="text-white/90">{members.length}</span> member
                {members.length === 1 ? "" : "s"} · academic year{" "}
                <span className="font-mono text-white/90">{academicYear}</span>
                {!isCurrentYear ? (
                  <span className="ml-2 text-white/45">(not current year)</span>
                ) : null}
              </>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {prevYear ? (
              <Link
                aria-disabled={loading}
                aria-busy={loading}
                href={teamListingHref({ year: prevYear, role: filter })}
                className={`rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/85 transition duration-[400ms] ease-in-out hover:border-white/30 hover:bg-white/10 ${loading ? "pointer-events-none opacity-45" : "bg-white/5"}`}
              >
                ← {prevYear}
              </Link>
            ) : null}
            {!isCurrentYear ? (
              <Link
                aria-disabled={loading}
                href={teamListingHref({ year: currentYear, role: filter })}
                className={`rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold text-blue-200 transition duration-[400ms] ease-in-out hover:bg-blue-500/25 ${loading ? "pointer-events-none opacity-45" : "bg-blue-500/15"}`}
              >
                Current ({currentYear})
              </Link>
            ) : null}
            {nextYear ? (
              <Link
                aria-disabled={loading}
                href={teamListingHref({ year: nextYear, role: filter })}
                className={`rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/85 transition duration-[400ms] ease-in-out hover:border-white/30 hover:bg-white/10 ${loading ? "pointer-events-none opacity-45" : "bg-white/5"}`}
              >
                {nextYear} →
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-white/40">
            Tip: open <span className="font-mono text-white/55">/team?year=2024-2025</span> for any year.
          </p>
          {showYearMismatch ? (
            <p className="mt-4 max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
              No team members are published for{" "}
              <span className="font-mono text-amber-50">{requestedAcademicYear}</span>. Showing the
              latest year that has data:{" "}
              <span className="font-mono text-amber-50">{academicYear}</span>.
            </p>
          ) : null}
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-blue-300 transition duration-[400ms] ease-in-out hover:text-blue-200"
        >
          ← Back to home
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {ROLE_TYPE_FILTERS.map((role) => (
          <Link
            key={role}
            aria-disabled={loading}
            href={
              role === "All"
                ? teamListingHref({ year: academicYear })
                : teamListingHref({ year: academicYear, role })
            }
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition duration-[400ms] ease-in-out ${
              loading ? "pointer-events-none" : ""
            } ${
              filter === role
                ? `bg-blue-500 text-white shadow-[0_0_24px_rgba(27,110,200,0.45)] ${loading ? "opacity-85" : ""}`
                : `border border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10 ${loading ? "opacity-40" : ""}`
            }`}
          >
            {role}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="aspect-[4/5] animate-pulse rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02]"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center md:px-12">
          <p className="text-lg font-medium text-white/90">No members for this view yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50">
            When members are published for{" "}
            <span className="font-mono text-white/70">{academicYear}</span>, they will appear here in
            a full-width grid — the same layout you see when the team is populated.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((member) => (
            <TeamMemberCard key={member._id} member={member} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && members.length > 0 ? (
        <p className="mt-12 text-center text-sm text-white/60">No members in this category yet.</p>
      ) : null}

      {canLoadMore ? (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-[400ms] ease-in-out hover:border-white/35 hover:bg-white/15"
          >
            Load more
          </button>
        </div>
      ) : null}
    </main>
  );
}
