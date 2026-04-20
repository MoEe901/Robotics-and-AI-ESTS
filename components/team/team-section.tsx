import Link from "next/link";

import type { TeamMemberListItem } from "@/lib/team/types";

import { TeamMemberCard } from "./team-member-card";

type TeamSectionProps = {
  title: string;
  members: TeamMemberListItem[];
};

export function TeamSection({ title, members }: TeamSectionProps) {
  return (
    <section id="team" className="mx-auto w-[min(94%,1100px)] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-[400ms] ease-in-out md:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-lg text-sm text-white/70">
            Leadership for this academic year — open a profile for more.
          </p>
        </div>
        <Link
          href="/team"
          className="inline-flex w-fit items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition duration-[400ms] ease-in-out hover:border-white/35 hover:bg-white/15"
        >
          View all members
        </Link>
      </div>
      {members.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-black/25 px-6 py-14 text-center md:px-10">
          <p className="text-sm font-medium text-white/80">No members to show here yet</p>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-white/45">
            Published team profiles for this year will appear in this section with the same card layout as
            on the full Team directory.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard key={member._id} member={member} />
          ))}
        </div>
      )}
    </section>
  );
}
