"use client";

import { DEFAULT_NAVBAR_CONFIG } from "@/lib/firebase/types";
import { useHomeContentStore } from "@/store/homeContentStore";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  applySiteTheme,
  resolveSiteTheme,
  setSiteTheme,
  subscribeSiteTheme,
  type SiteThemeMode,
} from "@/lib/theme/site-theme";

export function Navbar() {
  const navbarConfig = useHomeContentStore((s) => s.navbarConfig);
  const nav = navbarConfig ?? DEFAULT_NAVBAR_CONFIG;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const theme = useSyncExternalStore<SiteThemeMode>(
    subscribeSiteTheme,
    resolveSiteTheme,
    () => "dark",
  );

  useEffect(() => {
    applySiteTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next: SiteThemeMode = theme === "dark" ? "light" : "dark";
    setSiteTheme(next);
  };

  const navLinks = nav.navItems.filter((item) => item.href !== "/#apply");
  const applyNav = nav.navItems.find((item) => item.href === "/#apply");

  const shellClass =
    theme === "dark"
      ? scrolled
        ? "border-violet-500/35 bg-[rgba(7,8,15,0.92)] shadow-[0_0_40px_rgba(124,58,237,0.2),0_8px_32px_rgba(0,0,0,0.4)]"
        : "border-violet-500/20 bg-[rgba(13,15,26,0.65)] shadow-[0_0_15px_rgba(124,58,237,0.08)]"
      : "[border-color:var(--surface-border)] [background:var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.18)]";

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
            className={`size-2 shrink-0 rounded-full bg-cyan-400 ${theme === "dark" ? "nav-dot-pulse" : ""}`}
            aria-hidden
          />
          <Image
            src="/assets/logos/logo-optimized.svg"
            alt="Club logo"
            width={32}
            height={32}
            className="size-6 shrink-0 sm:size-7 md:size-8"
            loading="eager"
            priority
          />
          <span
            className={`font-syne min-w-0 truncate text-[0.82rem] font-extrabold tracking-[0.03em] sm:text-sm md:text-base ${
              theme === "dark" ? "text-white" : "[color:var(--foreground)]"
            }`}
          >
            {nav.logoText}
          </span>
        </Link>

        <nav className="ml-auto hidden shrink-0 items-center gap-8 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex items-center justify-center rounded-full border p-1.5 [border-color:var(--surface-border)] [color:var(--foreground)]"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="size-3.5" />
            ) : (
              <Moon className="size-3.5" />
            )}
          </button>
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
                theme === "dark"
                  ? "text-slate-400/80 hover:text-cyan-400"
                  : "[color:var(--foreground-muted)] hover:[color:var(--foreground)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {applyNav ? (
            <Link
              href={nav.ctaHref || applyNav.href}
              className="btn-shine font-jetbrains rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-white shadow-[0_0_22px_rgba(124,58,237,0.38)] transition hover:-translate-y-px hover:shadow-[0_0_38px_rgba(124,58,237,0.58)]"
            >
              {nav.ctaText}
            </Link>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border [border-color:var(--surface-border)] [color:var(--foreground)] sm:size-10"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>

          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border [border-color:var(--surface-border)] [color:var(--foreground)] sm:size-10"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[64px] z-40 mx-auto w-[min(calc(100%-1rem),1100px)] rounded-2xl border p-2.5 backdrop-blur-xl sm:top-[74px] sm:w-[min(calc(100%-1.25rem),1100px)] sm:p-3 md:hidden [background:var(--surface-strong)] [border-color:var(--surface-border)]"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium uppercase tracking-wide [color:var(--foreground-muted)] hover:[background:var(--surface-hover)] hover:[color:var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
              {applyNav ? (
                <Link
                  href={nav.ctaHref || applyNav.href}
                  onClick={() => setOpen(false)}
                  className="btn-shine font-jetbrains mt-1 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-white"
                >
                  {nav.ctaText}
                </Link>
              ) : null}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
