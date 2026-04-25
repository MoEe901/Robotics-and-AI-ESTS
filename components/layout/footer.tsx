"use client";

import Image from "next/image";
import Link from "next/link";

import {
  DEFAULT_FOOTER_CONFIG,
  type FooterColumn,
  type FooterSocialPlatform,
} from "@/lib/firebase/types";
import { useHomeContentStore } from "@/store/homeContentStore";

const SOCIAL_ICONS: Record<FooterSocialPlatform, React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-4">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-4">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
    </svg>
  ),
};

const SOCIAL_LABEL: Record<FooterSocialPlatform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
};

function visibleColumns(columns: FooterColumn[] | undefined): FooterColumn[] {
  if (!columns) return [];
  return columns.filter((c) => c.isVisible !== false && c.heading && c.links?.length);
}

export function Footer() {
  const live = useHomeContentStore((s) => s.footerConfig);
  const config = live ?? DEFAULT_FOOTER_CONFIG;
  const y = new Date().getFullYear();

  if (config.isVisible === false) return null;

  const cols = visibleColumns(
    config.footerColumns?.length ? config.footerColumns : DEFAULT_FOOTER_CONFIG.footerColumns,
  );
  const showBrand = config.showBrandColumn !== false;
  const showSocial =
    config.showSocialColumn !== false && (config.socialLinks?.length ?? 0) > 0;
  const showBottom = config.showBottomBar !== false;
  const socialHeading = config.socialHeading?.trim() || "Social";

  // Build a CSS grid that adapts to the count of visible blocks.
  const blockCount = (showBrand ? 1 : 0) + cols.length + (showSocial ? 1 : 0);
  const gridTemplate =
    blockCount <= 1
      ? "grid-cols-1"
      : blockCount === 2
        ? "sm:grid-cols-2"
        : blockCount === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : blockCount === 4
            ? "sm:grid-cols-2 lg:grid-cols-4"
            : blockCount === 5
              ? "sm:grid-cols-2 lg:grid-cols-5"
              : "sm:grid-cols-2 lg:grid-cols-6";

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-violet-500/20 bg-[#07060f] text-slate-200 shadow-[inset_0_1px_0_rgba(34,211,238,0.12)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-violet-600/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-6 py-14 sm:px-10 lg:px-16">
        <div className={`grid gap-12 ${gridTemplate} lg:gap-16`}>
          {showBrand ? (
            <div className="space-y-4 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.55)]" />
                <Image
                  src="/assets/logos/logo-optimized.svg"
                  alt="Club logo"
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                />
                <span className="font-syne font-extrabold tracking-tight text-white">
                  Robotics &amp; AI Club
                </span>
              </Link>
              <p className="max-w-sm text-[13px] font-light leading-[1.9] text-slate-400/80">
                {config.tagline}
              </p>
              {config.contactLocation || config.contactEmail ? (
                <div className="max-w-sm space-y-1 text-[12px] text-slate-500/90">
                  {config.contactLocation ? (
                    <p className="whitespace-pre-line font-light leading-relaxed">
                      {config.contactLocation}
                    </p>
                  ) : null}
                  {config.contactEmail ? (
                    <a
                      href={`mailto:${config.contactEmail}`}
                      className="text-cyan-400/90 hover:text-cyan-300"
                    >
                      {config.contactEmail}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/70">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((item) => (
                  <li key={`${col.heading}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="text-[13px] text-slate-400/55 transition-colors duration-200 hover:text-cyan-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {showSocial ? (
            <div>
              <h4 className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/70">
                {socialHeading}
              </h4>
              <div className="flex flex-wrap gap-2">
                {config.socialLinks.map((s) => (
                  <a
                    key={s.platform + s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABEL[s.platform]}
                    className="flex size-9 items-center justify-center rounded-full border border-violet-500/20 text-slate-400/70 transition-all duration-200 hover:border-cyan-400/35 hover:text-cyan-400"
                  >
                    {SOCIAL_ICONS[s.platform]}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showBottom ? (
        <div className="relative border-t border-violet-500/15 bg-black/30 px-6 py-5 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500/70 sm:flex-row sm:gap-0">
            <span>
              © {y - 1}–{y} {config.copyrightText}
            </span>
            <span>{config.versionLine}</span>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
