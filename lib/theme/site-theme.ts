"use client";

export type SiteThemeMode = "light" | "dark";

export const SITE_THEME_KEY = "site-theme";
export const SITE_THEME_EVENT = "site-theme-change";
export const DEFAULT_SITE_THEME: SiteThemeMode = "dark";

export function normalizeSiteTheme(value: string | null | undefined): SiteThemeMode | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

export function resolveSiteTheme(): SiteThemeMode {
  if (typeof window === "undefined") return DEFAULT_SITE_THEME;
  const saved = normalizeSiteTheme(window.localStorage.getItem(SITE_THEME_KEY));
  return saved ?? DEFAULT_SITE_THEME;
}

export function applySiteTheme(theme: SiteThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function setSiteTheme(theme: SiteThemeMode): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SITE_THEME_KEY, theme);
    window.dispatchEvent(new Event(SITE_THEME_EVENT));
  }
  applySiteTheme(theme);
}

export function subscribeSiteTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === SITE_THEME_KEY) onStoreChange();
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(SITE_THEME_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SITE_THEME_EVENT, onCustom);
  };
}

