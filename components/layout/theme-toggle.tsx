"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { getSiteThemeSnapshot, subscribeSiteTheme, toggleSiteTheme, type SiteTheme } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore<SiteTheme>(subscribeSiteTheme, getSiteThemeSnapshot, () => "dark" as const);

  return (
    <button
      type="button"
      onClick={() => toggleSiteTheme(theme)}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={
        className ??
        "inline-flex size-8 items-center justify-center rounded-full border border-violet-500/25 text-white/70 transition-colors duration-200 hover:border-violet-500/45 hover:text-cyan-400"
      }
    >
      {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}
