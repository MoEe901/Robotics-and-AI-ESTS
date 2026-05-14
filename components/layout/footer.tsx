"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { durS, easeLux } from "@/lib/motion";

import {
  DEFAULT_FOOTER_CONFIG,
  type FooterColumn,
  type FooterSocialPlatform,
} from "@/lib/firebase/types";
import { useHomeContentStore } from "@/store/homeContentStore";
import { useLanguage } from "@/lib/i18n/context";

// ---------------------------------------------------------------------------
// Social icon map — minimal stroke SVGs
// ---------------------------------------------------------------------------
const SOCIAL_ICONS: Record<FooterSocialPlatform, React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-4">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-4">
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

// ---------------------------------------------------------------------------
// Circuit-board corner SVG — detailed version
// ---------------------------------------------------------------------------
function CircuitCorner({ className }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute opacity-[0.14] ${className ?? ""}`}
      width="180"
      height="140"
      viewBox="0 0 180 140"
      fill="none"
      aria-hidden
    >
      {/* Main L-bracket */}
      <path d="M0 0 L70 0 L70 1 L1 1 L1 70 L0 70 Z" fill="rgba(6,182,212,0.9)" />
      {/* Cross-hatch traces */}
      <path d="M0 22 L22 22 L22 23 L0 23 Z" fill="rgba(6,182,212,0.45)" />
      <path d="M22 0 L23 0 L23 22 L22 22 Z" fill="rgba(6,182,212,0.45)" />
      <path d="M0 44 L10 44 L10 45 L0 45 Z" fill="rgba(6,182,212,0.3)" />
      <path d="M44 0 L45 0 L45 10 L44 10 Z" fill="rgba(6,182,212,0.3)" />
      {/* Junction dots */}
      <circle cx="70" cy="1" r="2" fill="rgba(124,58,237,0.7)" />
      <circle cx="1" cy="70" r="2" fill="rgba(124,58,237,0.7)" />
      <circle cx="22" cy="22" r="1.5" fill="rgba(6,182,212,0.6)" />
      {/* Diagonal trace */}
      <line x1="28" y1="0" x2="0" y2="28" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function visibleColumns(columns: FooterColumn[] | undefined): FooterColumn[] {
  if (!columns) return [];
  return columns.filter((c) => c.isVisible !== false && c.heading && c.links?.length);
}

function gridColClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "sm:grid-cols-2";
  if (count === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (count === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count === 5) return "sm:grid-cols-2 lg:grid-cols-5";
  return "sm:grid-cols-2 lg:grid-cols-6";
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
export function Footer() {
  const live = useHomeContentStore((s) => s.footerConfig);
  const config = live ?? DEFAULT_FOOTER_CONFIG;
  const year = new Date().getFullYear();
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";

  if (config.isVisible === false) return null;

  // Build translated footer columns when in FR mode
  const rawCols = visibleColumns(
    config.footerColumns?.length ? config.footerColumns : DEFAULT_FOOTER_CONFIG.footerColumns,
  );
  const cols = isFr
    ? rawCols.map((col) => {
        // Map CMS column headings to their French equivalents
        const headingLower = col.heading.toLowerCase();
        if (headingLower === "club") {
          return { ...col, heading: t.footer.clubColumn, links: t.footer.clubLinks.map((l) => ({ label: l.label, href: l.href })) };
        }
        if (headingLower === "info") {
          return { ...col, heading: t.footer.infoColumn, links: t.footer.infoLinks.map((l) => ({ label: l.label, href: l.href })) };
        }
        if (headingLower === "connect") {
          return { ...col, heading: t.footer.connectColumn, links: t.footer.connectLinks.map((l) => ({ label: l.label, href: l.href })) };
        }
        return col;
      })
    : rawCols;
  const showBrand = config.showBrandColumn !== false;
  const showSocial = config.showSocialColumn !== false && (config.socialLinks?.length ?? 0) > 0;
  const showBottom = config.showBottomBar !== false;
  const socialHeading = isFr ? t.footer.socialColumn : (config.socialHeading?.trim() || "Social");
  const blockCount = (showBrand ? 1 : 0) + cols.length + (showSocial ? 1 : 0);

  return (
    <footer className="relative mt-24 overflow-hidden bg-[#050507] text-slate-200">
      {/* ── Top separator: dual gradient lines ── */}
      <div className="relative h-px overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="absolute inset-0 translate-x-1/4 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
      </div>
      {/* Secondary faint separator below */}
      <div className="relative h-px overflow-hidden opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-400/20 to-transparent" />
      </div>

      {/* ── Circuit-board corner geometry ── */}
      <CircuitCorner className="left-0 top-0" />
      <CircuitCorner className="right-0 top-0 -scale-x-100" />
      <CircuitCorner className="bottom-0 left-0 -scale-y-100" />
      <CircuitCorner className="bottom-0 right-0 -scale-x-100 -scale-y-100" />

      {/* ── Ambient glow blobs ── */}
      <div
        className="pointer-events-none absolute -left-32 top-1/2 size-80 -translate-y-1/2 rounded-full bg-violet-600/[0.07] blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 size-64 rounded-full bg-cyan-500/[0.05] blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/3 top-0 size-48 rounded-full bg-fuchsia-500/[0.03] blur-[60px]"
        aria-hidden
      />

      {/* ── Main content grid ── */}
      <div className="relative mx-auto max-w-[1200px] px-6 py-20 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: durS.slow, ease: easeLux }}
          className={`grid gap-12 ${gridColClass(blockCount)} lg:gap-16`}
        >
          {/* ── Brand column ── */}
          {showBrand ? (
            <div className="space-y-5 lg:col-span-1">
              <Link
                href="/"
                className="group inline-flex items-center gap-2.5 transition-opacity duration-[var(--motion-dur-fast)] hover:opacity-80"
              >
                <span
                  className="size-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                  aria-hidden
                />
                <Image
                  src="/assets/logos/logo-optimized.svg"
                  alt="Club logo"
                  width={30}
                  height={30}
                  className="size-7 shrink-0 transition-transform duration-[var(--motion-dur-normal)] group-hover:rotate-6"
                />
                <span className="font-syne font-extrabold tracking-tight text-white">
                  {isFr ? t.footer.brandName : (config.brandName || "Robotics & AI Club")}
                </span>
              </Link>

              <p className="max-w-[280px] text-sm font-light leading-[1.9] text-slate-400/75">
                {isFr ? t.footer.tagline : config.tagline}
              </p>

              {(config.contactLocation || config.contactEmail) ? (
                <div className="space-y-2 text-[13px] text-slate-500/80">
                  {config.contactLocation ? (
                    <p className="whitespace-pre-line font-light leading-relaxed">
                      {config.contactLocation}
                    </p>
                  ) : null}
                  {config.contactEmail ? (
                    <a
                      href={`mailto:${config.contactEmail}`}
                      className="block text-cyan-400/80 transition-colors duration-[var(--motion-dur-fast)] hover:text-cyan-300"
                    >
                      {config.contactEmail}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {/* ── Decorative tech badge ── */}
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/18 bg-violet-500/[0.06] px-4 py-2">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] ring-pulse" aria-hidden />
                <span className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {isFr ? t.footer.estBadge : (config.estBadge || "Est. 2024 · Rabat, Morocco")}
                </span>
              </div>
            </div>
          ) : null}

          {/* ── Link columns ── */}
          {cols.map((col, colIdx) => (
            <motion.div
              key={col.heading}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: durS.normal, ease: easeLux, delay: colIdx * 0.06 }}
            >
              <h4 className="font-jetbrains mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-400/60">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((item) => (
                  <li key={`${col.heading}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="footer-link group inline-flex items-center gap-2.5 text-sm text-slate-400/50 transition-[color,transform] duration-[var(--motion-dur-fast)] hover:translate-x-1 hover:text-slate-200"
                    >
                      <span
                        className="size-1 shrink-0 rounded-full bg-violet-500/30 transition-all duration-[var(--motion-dur-fast)] group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* ── Social column ── */}
          {showSocial ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: durS.normal, ease: easeLux, delay: cols.length * 0.06 }}
            >
              <h4 className="font-jetbrains mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-400/60">
                {socialHeading}
              </h4>
              <div className="flex flex-wrap gap-3">
                {config.socialLinks.map((s) => (
                  <a
                    key={s.platform + s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABEL[s.platform]}
                    className="group pill-hover relative flex size-11 items-center justify-center overflow-hidden rounded-full border border-white/[0.07] bg-white/[0.03] text-slate-400/60 transition-[border-color,color,box-shadow,transform] duration-[var(--motion-dur-normal)] hover:-translate-y-1 hover:border-cyan-400/35 hover:text-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,0.25)]"
                  >
                    {/* Shine sweep on hover */}
                    <span
                      className="pointer-events-none absolute inset-0 translate-x-[-120%] skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-[120%]"
                      aria-hidden
                    />
                    {SOCIAL_ICONS[s.platform]}
                  </a>
                ))}
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </div>

      {/* ── Gradient divider above bottom bar ── */}
      <div className="relative h-px overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute inset-0 -translate-x-1/4 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
      </div>

      {/* ── Bottom bar ── */}
      {showBottom ? (
        <div className="relative overflow-hidden bg-black/30 px-6 py-6 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
            <span className="font-jetbrains text-[11px] uppercase tracking-[0.14em] text-slate-500/60">
              © {year - 1}–{year} {config.copyrightText}
            </span>

            {/* Center: tech pills */}
            {(config.techPills?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap items-center gap-3" aria-hidden>
                {(config.techPills ?? ["React", "Next.js", "Three.js"]).map((tech) => (
                  <span
                    key={tech}
                    className="font-jetbrains rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1 text-[10px] uppercase tracking-widest text-slate-600 transition-colors duration-[var(--motion-dur-fast)] hover:border-violet-500/20 hover:text-slate-500"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : null}

            <span className="font-jetbrains text-[11px] uppercase tracking-[0.14em] text-slate-500/60">
              {isFr ? t.footer.allSystemsOperational : config.versionLine}
            </span>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
