"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { en } from "./en";
import { fr } from "./fr";
import type { Locale, Translations } from "./types";

// ─── Registry ────────────────────────────────────────────────────────────────

const TRANSLATIONS: Record<Locale, Translations> = { en, fr };
const LOCALES = Object.keys(TRANSLATIONS) as Locale[];
const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "rac_locale";

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && LOCALES.includes(v as Locale);
}

// ─── Context ─────────────────────────────────────────────────────────────────

type LanguageContextValue = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  locales: Locale[];
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  t: en,
  setLocale: () => undefined,
  locales: LOCALES,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing restriction)
  }
  return DEFAULT_LOCALE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  // After hydration, read the stored locale from localStorage
  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== DEFAULT_LOCALE) setLocaleState(stored);
    setHydrated(true);
  }, []);

  // Sync <html lang> attribute and persist whenever locale changes (skip before hydration)
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = TRANSLATIONS[locale].meta.lang;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Non-fatal
    }
  }, [locale, hydrated]);

  const setLocale = useCallback((next: Locale) => {
    if (isLocale(next)) setLocaleState(next);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        t: TRANSLATIONS[locale],
        setLocale,
        locales: LOCALES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Access the current locale, translations object, and setLocale setter.
 *
 * @example
 * const { t, locale, setLocale } = useLanguage();
 * <p>{t.apply.validation.emailRequired}</p>
 */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

/**
 * Translate a CMS string via the cmsMap dictionaries.
 * Returns the original value when no mapping exists.
 */
export function translateCms(
  translations: Translations,
  kind: keyof Translations["cmsMap"],
  value: string,
): string {
  const map = translations.cmsMap[kind];
  if (map[value]) return map[value];
  // Case-insensitive fallback: CMS values may differ in casing
  const lower = value.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === lower) return v;
  }
  return value;
}
