"use client";

import Link from "next/link";

import type { TeamMemberListItem } from "@/lib/team/types";
import { useLanguage } from "@/lib/i18n/context";

import { TeamMemberCard } from "./team-member-card";

type TeamSectionProps = {
  title: string;
  members: TeamMemberListItem[];
};

/* ── Corner SVG — decorative circuit-board bracket ─────────────────────── */
function CornerSVG({ className }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute opacity-[0.14] ${className ?? ""}`}
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden
    >
      <path d="M0 0 L40 0 L40 1 L1 1 L1 40 L0 40 Z" fill="rgba(6,182,212,0.9)" />
      <path d="M0 12 L12 12 L12 13 L0 13 Z" fill="rgba(6,182,212,0.5)" />
      <path d="M12 0 L13 0 L13 12 L12 12 Z" fill="rgba(6,182,212,0.5)" />
      <circle cx="40" cy="1" r="1.5" fill="rgba(124,58,237,0.7)" />
      <circle cx="1" cy="40" r="1.5" fill="rgba(124,58,237,0.7)" />
    </svg>
  );
}

export function TeamSection({ title, members }: TeamSectionProps) {
  const { t, locale } = useLanguage();
  return (
    <section
      id="team"
      className="relative mx-auto w-[min(94%,1100px)] scroll-mt-28 overflow-hidden rounded-3xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-8 backdrop-blur-xl md:p-10"
    >
      {/* ── Corner SVGs ── */}
      <CornerSVG className="left-3 top-3" />
      <CornerSVG className="right-3 top-3 -scale-x-100" />
      <CornerSVG className="bottom-3 left-3 -scale-y-100" />
      <CornerSVG className="bottom-3 right-3 -scale-x-100 -scale-y-100" />

      {/* ── Ambient glow blobs ── */}
      <div
        className="pointer-events-none absolute -left-24 -top-16 size-64 rounded-full bg-violet-600/[0.06] blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -right-20 size-52 rounded-full bg-cyan-500/[0.05] blur-[70px]"
        aria-hidden
      />

      {/* ── Gradient separator at top ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute inset-0 translate-x-1/4 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow-pill mb-3">{locale === "fr" ? "// Notre Équipe" : "// Our People"}</span>
          <h2 className="font-heading typo-section-heading font-extrabold tracking-tight text-white">
            {(() => {
              const parts = title.trim().split(/\s+/);
              if (parts.length === 1) {
                return <span className="hero-title-grad">{parts[0]}</span>;
              }
              return (
                <>
                  <span className="text-white">{parts.slice(0, -1).join(" ")} </span>
                  <span className="hero-title-grad">{parts[parts.length - 1]}</span>
                </>
              );
            })()}
          </h2>
          <p className="mt-3 max-w-lg text-[0.95rem] font-light leading-relaxed text-slate-400/70">
            {t.sections.teamSubtitle}
          </p>
        </div>
        <Link
          href="/team"
          className="btn-shine font-jetbrains inline-flex w-fit items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_0_24px_rgba(124,58,237,0.35)] transition-[transform,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(124,58,237,0.55)] active:scale-[0.975]"
        >
          {t.sections.teamViewAll}
        </Link>
      </div>

      {/* ── Gradient divider ── */}
      <div className="relative z-10 my-6 h-px bg-gradient-to-r from-transparent via-[var(--ds-border-hover)] to-transparent" />

      {members.length === 0 ? (
        <div className="relative z-10 rounded-2xl border border-dashed border-white/[0.08] bg-black/20 px-8 py-16 text-center md:px-12">
          <p className="text-base font-medium text-white/80">{t.sections.teamEmptyTitle}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">
            {t.sections.teamEmptyDesc}
          </p>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 items-stretch gap-7 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
          {members.map((member) => (
            <TeamMemberCard key={member._id} member={member} />
          ))}
        </div>
      )}
    </section>
  );
}
