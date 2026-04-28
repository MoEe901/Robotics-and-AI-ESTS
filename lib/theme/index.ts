export type SiteTheme = "dark" | "light";

export const SITE_THEME_KEY = "rac-theme";
export const SITE_THEME_EVENT = "rac-theme-change";

export function getSiteThemeSnapshot(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(SITE_THEME_KEY) === "light" ? "light" : "dark";
}

export function subscribeSiteTheme(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === SITE_THEME_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SITE_THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SITE_THEME_EVENT, onChange);
  };
}

export function toggleSiteTheme(current: SiteTheme): void {
  const next: SiteTheme = current === "dark" ? "light" : "dark";
  window.localStorage.setItem(SITE_THEME_KEY, next);
  window.dispatchEvent(new Event(SITE_THEME_EVENT));
}
