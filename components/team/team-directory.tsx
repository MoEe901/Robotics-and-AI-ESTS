"use client";

import { Bebas_Neue, DM_Sans } from "next/font/google";
import { Frown, LayoutGrid, List, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { TeamMemberListItem } from "@/lib/team/types";
import {
  getCurrentAcademicYearLabel,
  shiftAcademicYear,
  teamListingHref,
} from "@/lib/team/academic-year";
import { formatRoleTitles } from "@/lib/team/format-roles";
import { cn } from "@/lib/utils";

import { TeamMemberCard } from "./team-member-card";

const fontDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const fontSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const PAGE_SIZE = 24;

type TeamDirectoryProps = {
  members: TeamMemberListItem[];
  academicYear: string;
  requestedAcademicYear?: string;
  initialRoleFilter?: string;
  loading?: boolean;
};

function matchesSearch(member: TeamMemberListItem, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.toLowerCase().trim();
  const pool = [
    member.name,
    formatRoleTitles(member.roles),
    member.roleType,
    member.shortBio,
    member.bio,
    member.department ?? "",
    member.schoolStatus ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return pool.includes(n) || pool.split(/\s+/).some((w) => w.startsWith(n));
}

/** Active pill styling per role label (aligned with reference design). */
function activeRolePillClass(role: string): string {
  if (role === "All") return "border-transparent bg-gradient-to-br from-sky-500 to-violet-500 text-white";
  const t = role.toLowerCase();
  if (t.includes("executive") || t.includes("supervisor") || t.includes("council")) {
    return "border-sky-400/30 bg-sky-500/25 text-sky-400";
  }
  if (t.includes("professor")) return "border-violet-400/30 bg-violet-500/25 text-violet-300";
  if (t.includes("doctoral") || t.includes("phd")) return "border-emerald-400/30 bg-emerald-500/25 text-emerald-400";
  if (t.includes("design")) return "border-fuchsia-400/30 bg-fuchsia-500/25 text-fuchsia-300";
  if (t.includes("media")) return "border-amber-400/30 bg-amber-500/25 text-amber-400";
  return "border-white/[0.15] bg-white/10 text-[#f0eff5]";
}

export function TeamDirectory({
  members,
  academicYear,
  requestedAcademicYear,
  initialRoleFilter = "All",
  loading = false,
}: TeamDirectoryProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const roleFilters = useMemo(() => {
    const s = new Set<string>();
    for (const m of members) {
      const r = m.roleType?.trim();
      if (r) s.add(r);
    }
    return ["All", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [members]);

  const filter =
    initialRoleFilter === "All" || roleFilters.includes(initialRoleFilter)
      ? initialRoleFilter
      : "All";

  const filteredByRole = useMemo(() => {
    if (filter === "All") return members;
    return members.filter((m) => (m.roleType ?? "") === filter);
  }, [members, filter]);

  const searched = useMemo(() => {
    return filteredByRole.filter((m) => matchesSearch(m, search));
  }, [filteredByRole, search]);

  const visible = searched.slice(0, visibleCount);
  const canLoadMore = visibleCount < searched.length;

  const cellulesCount = useMemo(() => {
    const s = new Set<string>();
    for (const m of members) {
      const r = m.roleType?.trim();
      if (r) s.add(r);
    }
    return s.size;
  }, [members]);

  const prevYear = shiftAcademicYear(academicYear, -1);
  const nextYear = shiftAcademicYear(academicYear, 1);
  const currentYear = getCurrentAcademicYearLabel();
  const isCurrentYear = academicYear === currentYear;

  const showYearMismatch =
    requestedAcademicYear &&
    requestedAcademicYear !== academicYear &&
    members.length > 0;

  const countFor = (role: string) =>
    role === "All" ? members.length : members.filter((m) => (m.roleType ?? "") === role).length;

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden bg-[#08080e] text-[#f0eff5]",
        fontSans.className,
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{ backgroundImage: NOISE_SVG }}
        aria-hidden
      />

      <div className="relative z-[1] mx-auto max-w-[1200px] px-6 pb-24 pt-10 animation-delay-100 sm:px-8 md:px-12 lg:px-16">
        {/* Hero */}
        <header
          className="pb-10 pt-2 max-[900px]:px-0 max-[900px]:pt-12"
          style={{ animation: "teamDirFadeUp 0.6s ease both 0.08s" }}
        >
          <style>{`
            @keyframes teamDirFadeUp {
              from { opacity: 0; transform: translateY(18px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes teamDirBlink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}</style>

          <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6a80]">
            <span
              className="size-1.5 rounded-full bg-sky-400"
              style={{ animation: "teamDirBlink 2s ease-in-out infinite" }}
            />
            Directory
          </p>

          <h1
            className={cn(
              "mb-5 text-[clamp(3.5rem,9vw,6.75rem)] leading-[0.9] tracking-[0.02em]",
              fontDisplay.className,
            )}
          >
            Meet the{" "}
            <span className="bg-gradient-to-br from-sky-400 to-violet-400 bg-clip-text text-transparent">
              Team
            </span>
          </h1>

          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-6">
            <div className="flex flex-wrap items-center gap-4 text-[13px] font-light text-[#6b6a80]">
              <span>
                <strong className="font-medium text-[#f0eff5]">{loading ? "—" : members.length}</strong>
                &nbsp; members
              </span>
              <span className="hidden h-4 w-px bg-white/[0.13] sm:block" />
              <span>
                Academic year{" "}
                <strong className="font-medium text-[#f0eff5]">{academicYear}</strong>
              </span>
              {!isCurrentYear ? (
                <>
                  <span className="hidden h-4 w-px bg-white/[0.13] sm:block" />
                  <span className="text-[#6b6a80]/80">(not current year)</span>
                </>
              ) : null}
              <span className="hidden h-4 w-px bg-white/[0.13] md:block" />
              <span>
                <strong className="font-medium text-[#f0eff5]">{cellulesCount}</strong>
                &nbsp; cellules
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0d0d18] p-1.5">
                {prevYear ? (
                  <Link
                    href={teamListingHref({ year: prevYear, role: filter })}
                    aria-disabled={loading}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition",
                      loading
                        ? "pointer-events-none opacity-40"
                        : "text-[#6b6a80] hover:bg-white/[0.05] hover:text-[#f0eff5]",
                    )}
                  >
                    ← {prevYear}
                  </Link>
                ) : null}
                <span
                  className={cn(
                    "rounded-lg px-4 py-2 text-xs font-medium",
                    loading ? "opacity-50" : "bg-sky-500 text-white",
                  )}
                >
                  {academicYear}
                </span>
                {nextYear ? (
                  <Link
                    href={teamListingHref({ year: nextYear, role: filter })}
                    aria-disabled={loading}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition",
                      loading
                        ? "pointer-events-none opacity-40"
                        : "text-[#6b6a80] hover:bg-white/[0.05] hover:text-[#f0eff5]",
                    )}
                  >
                    {nextYear} →
                  </Link>
                ) : null}
              </div>

              {!isCurrentYear ? (
                <Link
                  href={teamListingHref({ year: currentYear, role: filter })}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300"
                >
                  Jump to current ({currentYear})
                </Link>
              ) : null}

              <Link
                href="/"
                className="text-xs font-medium text-[#6b6a80] underline-offset-4 hover:text-[#f0eff5] hover:underline"
              >
                ← Back to home
              </Link>
            </div>
          </div>

          {showYearMismatch ? (
            <p className="mb-6 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
              No team members are published for{" "}
              <span className="font-mono text-amber-50">{requestedAcademicYear}</span>. Showing the
              latest year that has data:{" "}
              <span className="font-mono text-amber-50">{academicYear}</span>.
            </p>
          ) : null}

          <p className="text-[11px] text-[#6b6a80]/70">
            Tip: open{" "}
            <span className="font-mono text-[#f0eff5]/60">/team?year=2024-2025</span> for any year.
          </p>
        </header>

        {/* Controls */}
        <section
          className="mb-10 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center"
          style={{ animation: "teamDirFadeUp 0.6s ease both 0.15s" }}
        >
          <div className="relative min-w-[220px] max-w-[320px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-[#6b6a80]"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search members…"
              className="w-full rounded-[10px] border border-white/[0.07] bg-[#0d0d18] py-2.5 pl-9 pr-3 text-[13px] text-[#f0eff5] outline-none transition placeholder:text-[#6b6a80] focus:border-sky-400/40 focus:bg-sky-500/[0.04]"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {roleFilters.map((role) => {
              const active = filter === role;
              const href =
                role === "All"
                  ? teamListingHref({ year: academicYear })
                  : teamListingHref({ year: academicYear, role });
              return (
                <Link
                  key={role}
                  href={href}
                  scroll={false}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] transition",
                    loading && "pointer-events-none opacity-45",
                    active
                      ? activeRolePillClass(role)
                      : "border-white/[0.07] bg-white/[0.03] text-[#6b6a80] hover:border-white/[0.13] hover:bg-white/[0.05] hover:text-[#f0eff5]",
                  )}
                >
                  {role}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-white/15" : "bg-white/10",
                    )}
                  >
                    {countFor(role)}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex rounded-lg border border-white/[0.07] bg-[#0d0d18] p-0.5 max-[560px]:hidden">
            <button
              type="button"
              title="Grid view"
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-2 transition",
                view === "grid" ? "bg-white/[0.08] text-[#f0eff5]" : "text-[#6b6a80] hover:text-[#f0eff5]",
              )}
            >
              <LayoutGrid className="size-[15px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              title="List view"
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-2 transition",
                view === "list" ? "bg-white/[0.08] text-[#f0eff5]" : "text-[#6b6a80] hover:text-[#f0eff5]",
              )}
            >
              <List className="size-[15px]" strokeWidth={2} />
            </button>
          </div>
        </section>

        {/* Grid */}
        <section className="pb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-xs text-[#6b6a80]">
              Showing{" "}
              <strong className="font-medium text-[#f0eff5]">
                {loading ? "—" : searched.length}
              </strong>{" "}
              members
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 max-[560px]:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="h-[360px] animate-pulse rounded-[20px] border border-white/[0.07] bg-[#0d0d18]"
                />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-white/[0.07] px-6 py-20 text-center">
              <Frown className="size-10 text-[#6b6a80]" strokeWidth={1.5} />
              <p className="text-base font-medium text-[#f0eff5]">No members for this view yet</p>
              <p className="max-w-md text-sm font-light text-[#6b6a80]">
                When members are published for{" "}
                <span className="font-mono text-[#f0eff5]/70">{academicYear}</span>, they will appear
                here.
              </p>
            </div>
          ) : searched.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-white/[0.07] px-6 py-20 text-center">
              <Frown className="size-10 text-[#6b6a80]" strokeWidth={1.5} />
              <p className="text-base font-medium text-[#f0eff5]">No members found</p>
              <p className="text-sm font-light text-[#6b6a80]">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid items-stretch gap-4 [&>*]:min-w-0",
                view === "list"
                  ? "grid-cols-1 gap-2"
                  : "grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] max-[560px]:grid-cols-2 max-[560px]:gap-2.5",
              )}
            >
              {visible.map((member) => (
                <TeamMemberCard key={member._id} member={member} view={view} />
              ))}
            </div>
          )}

          {!loading && filter !== "All" && members.length > 0 && filteredByRole.length === 0 ? (
            <p className="mt-10 text-center text-sm text-[#6b6a80]">No members in this category.</p>
          ) : null}

          {canLoadMore ? (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full border border-white/[0.13] bg-white/[0.06] px-8 py-3 text-sm font-medium text-[#f0eff5] transition hover:border-white/25 hover:bg-white/10"
              >
                Load more
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
