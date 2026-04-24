import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { TeamMemberListItem } from "@/lib/team/types";
import { formatRoleTitles } from "@/lib/team/format-roles";
import { memberImageSrc } from "@/lib/team/image-url";
import { TAXONOMY_NOT_SET, taxonomyDisplay } from "@/lib/team/taxonomy";
import { cn } from "@/lib/utils";

export type MemberCardCategory =
  | "executive"
  | "professor"
  | "doctoral"
  | "design"
  | "media"
  | "other";

export function memberCardCategory(member: TeamMemberListItem): MemberCardCategory {
  const t = (member.roleType ?? "").toLowerCase();
  const school = (member.schoolStatus ?? "").toLowerCase();
  const dept = (member.department ?? "").toLowerCase();
  if (t.includes("executive") || t.includes("supervisor") || t.includes("council")) return "executive";
  if (t.includes("professor") || school.includes("professor")) return "professor";
  if (t.includes("doctoral") || school.includes("doctoral") || t.includes("phd")) return "doctoral";
  if (t.includes("design") || dept.includes("design")) return "design";
  if (t.includes("media") || dept.includes("media")) return "media";
  return "other";
}

const catArrowHover: Record<MemberCardCategory, string> = {
  executive: "group-hover:bg-sky-500 group-hover:border-transparent group-hover:text-white",
  professor: "group-hover:bg-violet-500 group-hover:border-transparent group-hover:text-white",
  doctoral: "group-hover:bg-emerald-500 group-hover:border-transparent group-hover:text-white",
  design: "group-hover:bg-fuchsia-500 group-hover:border-transparent group-hover:text-white",
  media: "group-hover:bg-amber-500 group-hover:border-transparent group-hover:text-white",
  other: "group-hover:bg-white/15 group-hover:border-transparent group-hover:text-white",
};

const catBorderHover: Record<MemberCardCategory, string> = {
  executive: "hover:border-sky-400/40",
  professor: "hover:border-violet-400/40",
  doctoral: "hover:border-emerald-400/40",
  design: "hover:border-fuchsia-400/40",
  media: "hover:border-amber-400/40",
  other: "hover:border-white/25",
};

const catBadgeClass: Record<MemberCardCategory, string> = {
  executive: "border border-sky-400/30 bg-sky-500/15 text-sky-400",
  professor: "border border-violet-400/30 bg-violet-500/15 text-violet-300",
  doctoral: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-400",
  design: "border border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-300",
  media: "border border-amber-400/30 bg-amber-500/15 text-amber-400",
  other: "border border-white/[0.13] bg-white/[0.08] text-[#6b6a80]",
};

type TeamMemberCardProps = {
  member: TeamMemberListItem;
  view?: "grid" | "list";
};

export function TeamMemberCard({ member, view = "grid" }: TeamMemberCardProps) {
  const href = member.slug?.current ? `/team/${member.slug.current}` : undefined;
  const src = memberImageSrc(member);
  const roleLine = formatRoleTitles(member.roles);
  const departmentDisplay = taxonomyDisplay(member.department ?? "");
  const schoolStatusDisplay = taxonomyDisplay(member.schoolStatus ?? "");
  const deptLabel =
    departmentDisplay !== TAXONOMY_NOT_SET
      ? departmentDisplay
      : schoolStatusDisplay !== TAXONOMY_NOT_SET
        ? schoolStatusDisplay
        : member.roleType ?? "Member";
  const cardBio = member.shortBio ?? member.bio;
  const cat = memberCardCategory(member);
  const badgeText = member.roleType?.trim() || deptLabel;

  const inner = (
    <article
      data-cat={cat}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0d0d18] text-[#f0eff5] transition duration-300",
        view === "list"
          ? "flex items-stretch gap-0 rounded-[14px]"
          : "flex h-full w-full min-w-0 flex-col hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
        catBorderHover[cat],
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-[#111120]",
          view === "grid" ? "h-[240px] w-full max-sm:h-[180px]" : "h-20 w-20 rounded-xl sm:h-20 sm:w-20",
        )}
      >
        <img
          src={src}
          alt={member.name}
          className="size-full object-cover object-top brightness-[0.85] saturate-[0.85] transition duration-500 group-hover:scale-[1.06] group-hover:brightness-[0.95] group-hover:saturate-100"
          loading="lazy"
          decoding="async"
        />
        {view === "grid" ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d0d18]/95 via-[#0d0d18]/20 to-transparent"
              aria-hidden
            />
            <span
              className={cn(
                "absolute left-3.5 top-3.5 z-[2] rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md sm:left-3.5 sm:top-3.5",
                catBadgeClass[cat],
              )}
            >
              {badgeText}
            </span>
          </>
        ) : null}
      </div>

      <div
        className={cn(
          "relative z-[1] min-w-0",
          view === "grid"
            ? "flex min-h-0 flex-1 flex-col p-5 pb-14"
            : "flex flex-1 items-center gap-5 py-4 pl-5 pr-5 sm:gap-8",
        )}
      >
        <div
          className={cn(
            "min-w-0",
            view === "list" ? "flex flex-1 flex-col justify-center gap-0" : "flex min-h-0 flex-1 flex-col",
          )}
        >
          <p className="mb-1 text-[17px] font-medium tracking-tight text-[#f0eff5]">{member.name}</p>
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs font-light text-[#6b6a80]",
              view === "grid" ? "mb-2" : "mb-0",
            )}
          >
            <span className="h-px w-3 bg-current opacity-40" aria-hidden />
            {roleLine}
          </p>
          {view === "list" ? (
            <span className="mt-1 inline-block rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
              {deptLabel}
            </span>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col pt-1">
              {cardBio ? (
                <p className="line-clamp-2 text-[12.5px] font-light leading-relaxed text-[#6b6a80]">{cardBio}</p>
              ) : null}
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.13] bg-white/[0.05] text-[#6b6a80] transition duration-200",
            view === "grid"
              ? "absolute bottom-5 right-5 opacity-0 group-hover:opacity-100"
              : "relative mr-4 opacity-100",
            catArrowHover[cat],
          )}
        >
          <ChevronRight className="size-[13px]" strokeWidth={2} />
        </div>
      </div>
    </article>
  );

  if (!href) {
    return (
      <div
        className={cn(
          "cursor-default",
          view === "grid" ? "flex h-full min-h-0 w-full min-w-0" : "block",
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "outline-none ring-offset-2 ring-offset-[#08080e] transition focus-visible:ring-2 focus-visible:ring-sky-400",
        view === "grid" ? "flex h-full min-h-0 w-full min-w-0" : "block min-w-0",
      )}
    >
      {inner}
    </Link>
  );
}
