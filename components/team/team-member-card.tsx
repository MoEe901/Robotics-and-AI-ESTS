import Link from "next/link";

import type { TeamMemberListItem } from "@/lib/team/types";
import { formatRoleTitles } from "@/lib/team/format-roles";
import { memberImageSrc } from "@/lib/team/image-url";
import { TAXONOMY_NOT_SET, taxonomyDisplay } from "@/lib/team/taxonomy";

type TeamMemberCardProps = {
  member: TeamMemberListItem;
};

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const href = member.slug?.current ? `/team/${member.slug.current}` : undefined;
  const src = memberImageSrc(member);
  const roleLine = formatRoleTitles(member.roles);
  const departmentDisplay = taxonomyDisplay(member.department ?? "");
  const schoolStatusDisplay = taxonomyDisplay(member.schoolStatus ?? "");
  const showDepartmentBadge = departmentDisplay !== TAXONOMY_NOT_SET;
  const showSchoolStatusLine = schoolStatusDisplay !== TAXONOMY_NOT_SET;
  const cardBio = member.shortBio ?? member.bio;

  const inner = (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.05] transition duration-[400ms] ease-in-out hover:scale-[1.02] hover:border-white/25 hover:shadow-[0_28px_80px_-20px_rgba(27,110,200,0.35)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img
          src={src}
          alt={member.name}
          className="h-full w-full object-cover transition duration-[400ms] ease-in-out group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          {member.roleType ? (
            <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
              {member.roleType}
            </span>
          ) : null}
          {showDepartmentBadge ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-md">
              {departmentDisplay}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            {member.name}
          </h3>
          <p className="mt-1 text-sm text-blue-200/90">{roleLine}</p>
          {showSchoolStatusLine ? (
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/55">
              {schoolStatusDisplay}
            </p>
          ) : null}
          {cardBio ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/75">{cardBio}</p>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (!href) {
    return <div className="block cursor-default opacity-90">{inner}</div>;
  }

  return (
    <Link
      href={href}
      className="block outline-none ring-offset-2 ring-offset-[#0c0a09] transition duration-[400ms] ease-in-out focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      {inner}
    </Link>
  );
}
