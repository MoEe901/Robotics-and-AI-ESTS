"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeToFooterConfig } from "@/lib/firebase/realtime";
import { DEFAULT_FOOTER_CONFIG, type FooterConfig, type FooterSocialPlatform } from "@/lib/firebase/types";

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

export function Footer() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const year = new Date().getFullYear();

  useEffect(() => {
    return subscribeToFooterConfig((cfg) => setConfig(cfg));
  }, []);

  return (
    <footer className="relative mt-24 border-t [border-color:var(--surface-border)] [background:var(--background)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/[0.03] to-transparent" />

      <div className="relative mx-auto w-[min(94%,1100px)] py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/assets/logos/logo.webp"
                alt="Robotics & AI Club"
                width={34}
                height={34}
              />
              <span className="text-sm font-semibold tracking-tight [color:var(--foreground)]">
                Robotics & AI Club
              </span>
            </Link>
            <p className="max-w-[260px] text-sm leading-relaxed [color:var(--foreground-muted)]">
              {config.tagline}
            </p>
            <div className="flex items-center gap-2.5">
              {config.socialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}
                  className="flex size-9 items-center justify-center rounded-full border transition-all duration-300 [border-color:var(--surface-border)] [color:var(--foreground-muted)] hover:scale-105 hover:[border-color:rgba(79,142,247,0.45)] hover:[color:#4f8ef7] hover:[background:rgba(79,142,247,0.08)]"
                >
                  {SOCIAL_ICONS[s.platform]}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] [color:var(--foreground-subtle)]">
              Navigation
            </p>
            <nav className="flex flex-col gap-2.5">
              {config.footerNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm transition-colors duration-200 [color:var(--foreground-muted)] hover:[color:var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] [color:var(--foreground-subtle)]">
              Contact
            </p>
            <div className="flex flex-col gap-3 text-sm [color:var(--foreground-muted)]">
              {config.contactLocation && (
                <div className="flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="mt-0.5 size-4 shrink-0 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ whiteSpace: "pre-line" }}>{config.contactLocation}</span>
                </div>
              )}
              {config.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-4 shrink-0 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href={`mailto:${config.contactEmail}`}
                    className="transition-colors hover:[color:var(--foreground)]"
                  >
                    {config.contactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Join CTA */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] [color:var(--foreground-subtle)]">
              Get Involved
            </p>
            <p className="text-sm leading-relaxed [color:var(--foreground-muted)]">
              Ready to build the future? Join our community of innovators.
            </p>
            <Link
              href="/#apply"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(79,142,247,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(79,142,247,0.45)]"
            >
              Apply Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t pt-8 [border-color:var(--surface-border)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs [color:var(--foreground-subtle)]">
              © {year} {config.copyrightText}
            </p>
            <p className="text-xs [color:var(--foreground-subtle)]">
              Built with passion by the Club Tech Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
