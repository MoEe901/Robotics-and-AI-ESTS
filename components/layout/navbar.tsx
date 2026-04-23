"use client";

import { siteConfig } from "@/lib/site-config";
import { motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const THEME_KEY = "site-theme";
const THEME_EVENT = "site-theme-change";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY) onStoreChange();
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onCustom);
  };
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    resolveInitialTheme,
    () => "dark",
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50 mx-auto mt-3 flex w-[min(calc(100%-1.5rem),1100px)] max-w-full items-center justify-between gap-2 rounded-full border px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-[400ms] ease-in-out [background:var(--surface)] [border-color:var(--surface-border)] sm:mt-4 sm:gap-3 sm:px-5 sm:py-3"
      >
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/assets/logos/logo-optimized.svg"
            alt="Club logo"
            width={32}
            height={32}
            className="size-8 shrink-0"
            loading="eager"
            priority
          />
          <span className="truncate text-xs font-semibold tracking-wide [color:var(--foreground)] sm:text-sm">
            Robotics & AI Club
          </span>
        </Link>

        <nav className="ml-auto hidden shrink-0 items-center gap-6 md:flex">
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
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-medium transition-all duration-[400ms] ease-in-out [color:var(--foreground-muted)] hover:[color:var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border [border-color:var(--surface-border)] [color:var(--foreground)]"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>

          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border [border-color:var(--surface-border)] [color:var(--foreground)]"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </motion.header>

      {open ? (
        <div className="fixed inset-x-0 top-[78px] z-40 mx-auto w-[min(94%,1100px)] rounded-2xl border p-3 backdrop-blur-xl md:hidden [background:var(--surface-strong)] [border-color:var(--surface-border)]">
          <nav className="flex flex-col gap-1">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium [color:var(--foreground-muted)] hover:[background:var(--surface-hover)] hover:[color:var(--foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
