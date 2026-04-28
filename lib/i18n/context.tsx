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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // On mount: read persisted preference from localStorage.
  // The setState is deferred into a microtask so it never fires synchronously
  // inside the effect body, avoiding cascading renders while keeping SSR-safe
  // hydration (server always starts at DEFAULT_LOCALE).
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isLocale(stored)) setLocaleState(stored);
      } catch {
        // localStorage unavailable (e.g. private browsing restriction)
      }
    });
  }, []);

  // Sync <html lang> attribute and persist whenever locale changes
  useEffect(() => {
    document.documentElement.lang = TRANSLATIONS[locale].meta.lang;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Non-fatal
    }
  }, [locale]);

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
