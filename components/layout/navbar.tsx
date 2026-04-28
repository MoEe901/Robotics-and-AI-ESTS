"use client";

import { DEFAULT_NAVBAR_CONFIG } from "@/lib/firebase/types";
import { parseNavbarDoc } from "@/lib/content/site-content-parser";
import { useFirestoreDoc } from "@/lib/hooks/use-firestore-doc";
import { useLanguage } from "@/lib/i18n/context";
import {
  LanguageSwitcher,
  LanguageSwitcherMobile,
} from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: navbarConfig } = useFirestoreDoc("siteConfig/navbar", (raw) => parseNavbarDoc(raw));
  const nav = navbarConfig ?? DEFAULT_NAVBAR_CONFIG;
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);

  /** Translate a CMS nav link label using the locale map (no-op in EN). */
  function xlLink(label: string) {
    if (locale === "en") return label;
    return t.nav.linkLabelMap[label.toLowerCase()] ?? label;
  }
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = nav.links.filter((item) => item.isVisible && item.href !== "/#apply");
  const applyNav = nav.links.find((item) => item.isVisible && item.href === "/#apply");

  const shellClass = scrolled
    ? "border-violet-500/35 bg-[rgba(7,8,15,0.92)] shadow-[0_0_40px_rgba(124,58,237,0.2),0_8px_32px_rgba(0,0,0,0.4)]"
    : "border-violet-500/20 bg-[rgba(13,15,26,0.65)] shadow-[0_0_15px_rgba(124,58,237,0.08)]";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed inset-x-0 top-0 z-50 mx-auto mt-2 flex w-[min(calc(100%-0.9rem),1100px)] max-w-full items-center justify-between gap-1.5 rounded-full border px-2 py-2 backdrop-blur-[20px] backdrop-saturate-150 transition-all duration-[400ms] ease-in-out sm:mt-4 sm:w-[min(calc(100%-1.25rem),1100px)] sm:gap-2 sm:px-3 sm:py-2.5 md:mt-6 md:gap-3 md:px-7 md:py-3.5 ${shellClass}`}
      >
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 sm:pr-2"
          onClick={() => setOpen(false)}
        >
          <span
            className="nav-dot-pulse size-2 shrink-0 rounded-full bg-cyan-400"
            aria-hidden
          />
          <Image
            src={nav.logoUrl || "/assets/logos/logo-optimized.svg"}
            alt="Club logo"
            width={32}
            height={32}
            className="size-6 shrink-0 sm:size-7 md:size-8"
            loading="eager"
            priority
          />
          <span className="font-syne min-w-0 truncate text-[0.82rem] font-extrabold tracking-[0.03em] text-white sm:text-sm md:text-base">
            {nav.logoText}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden shrink-0 items-center gap-6 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400/80 transition-colors duration-200 hover:text-cyan-400"
            >
              {xlLink(item.label)}
            </Link>
          ))}

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          {nav.showThemeToggle ? <ThemeToggle /> : null}

          {applyNav ? (
            <Link
              href={nav.ctaButton.href || applyNav.href}
              className="btn-shine font-jetbrains rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-white shadow-[0_0_22px_rgba(124,58,237,0.38)] transition hover:-translate-y-px hover:shadow-[0_0_38px_rgba(124,58,237,0.58)]"
            >
              {nav.ctaButton.label}
            </Link>
          ) : null}
        </nav>

        {/* Mobile hamburger */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:hidden">
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-500/25 text-white/85 sm:size-10"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[64px] z-40 mx-auto w-[min(calc(100%-1rem),1100px)] rounded-2xl border border-violet-500/25 bg-[rgba(13,15,26,0.92)] p-2.5 backdrop-blur-xl sm:top-[74px] sm:w-[min(calc(100%-1.25rem),1100px)] sm:p-3 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium uppercase tracking-wide text-slate-300 hover:bg-violet-500/10 hover:text-white"
                >
                  {xlLink(item.label)}
                </Link>
              ))}
              {applyNav ? (
                <Link
                  href={nav.ctaButton.href || applyNav.href}
                  onClick={() => setOpen(false)}
                  className="btn-shine font-jetbrains mt-1 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-white"
                >
                  {nav.ctaButton.label}
                </Link>
              ) : null}

              {/* Theme toggle + language switcher — mobile */}
              <div className="mt-1 flex items-center justify-between px-1 pb-1">
                <LanguageSwitcherMobile />
                {nav.showThemeToggle ? (
                  <ThemeToggle className="inline-flex size-9 items-center justify-center rounded-full border border-violet-500/25 text-white/70 transition-colors hover:border-violet-500/45 hover:text-cyan-400" />
                ) : null}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
