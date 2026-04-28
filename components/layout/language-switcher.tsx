"use client";

import { useLanguage } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

/**
 * Compact EN / FR pill toggle for the navbar.
 * Reads and writes the global locale via LanguageContext.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.languageSwitcher.label}
      className="hidden items-center rounded-full border border-violet-500/20 bg-white/[0.03] p-0.5 md:flex"
    >
      {locales.map((l, i) => {
        const isActive = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={isActive}
            aria-label={l === "fr" ? t.languageSwitcher.switchToFr : t.languageSwitcher.switchToEn}
            className={[
              "min-w-[32px] rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all duration-200",
              i > 0 ? "" : "",
              isActive
                ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                : "text-slate-400 hover:text-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mobile variant — rendered inside the mobile dropdown menu.
 */
export function LanguageSwitcherMobile() {
  const { locale, setLocale, locales, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.languageSwitcher.label}
      className="flex items-center gap-1 rounded-xl border border-violet-500/15 bg-white/[0.03] p-1"
    >
      {locales.map((l) => {
        const isActive = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={isActive}
            aria-label={l === "fr" ? t.languageSwitcher.switchToFr : t.languageSwitcher.switchToEn}
            className={[
              "flex-1 rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200",
              isActive
                ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white"
                : "text-slate-400 hover:text-white",
            ].join(" ")}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
