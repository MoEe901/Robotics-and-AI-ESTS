export type SiteDesign = "futuristic" | "editorial";

export const SITE_DESIGN_KEY = "rac-design";
export const SITE_DESIGN_EVENT = "rac-design-change";

export function getSiteDesignSnapshot(): SiteDesign {
  if (typeof window === "undefined") return "futuristic";
  const saved = window.localStorage.getItem(SITE_DESIGN_KEY);
  if (saved === "editorial") return "editorial";
  return "futuristic";
}

export function subscribeSiteDesign(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === SITE_DESIGN_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SITE_DESIGN_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SITE_DESIGN_EVENT, onChange);
  };
}

export function setSiteDesign(design: SiteDesign): void {
  window.localStorage.setItem(SITE_DESIGN_KEY, design);
  window.dispatchEvent(new Event(SITE_DESIGN_EVENT));
}
