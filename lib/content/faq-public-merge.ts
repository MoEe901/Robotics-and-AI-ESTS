import type { FaqCategory, FaqConfig, FaqItem, FaqItemColor } from "@/lib/firebase/types";
import { DEFAULT_FAQ_CONFIG } from "@/lib/content/faq-defaults";

const FAQ_ITEM_COLORS = new Set(["blue", "violet", "pink", "amber", "green"]);
const FAQ_ITEM_ICON_KEYS = new Set([
  "circle-dollar-sign",
  "calendar",
  "lightbulb",
  "trending-up",
  "users",
  "code",
  "award",
  "clock",
  "help-circle",
  "message-circle",
  "sparkles",
  "target",
]);

export function parseFaqConfigHeader(raw: Record<string, unknown>): Partial<FaqConfig> | null {
  const eyebrow = typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "";
  const title =
    (typeof raw.title === "string" ? raw.title.trim() : "")
    || (typeof raw.titleLine === "string" ? raw.titleLine.trim() : "");
  const accent =
    (typeof raw.accent === "string" ? raw.accent.trim() : "")
    || (typeof raw.titleAccent === "string" ? raw.titleAccent.trim() : "");
  const subtitle = typeof raw.subtitle === "string" ? raw.subtitle.trim() : "";
  const categoriesRaw = Array.isArray(raw.categories) ? raw.categories : [];
  const categories = categoriesRaw
    .map((row): FaqCategory | null => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id.trim().toLowerCase() : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!id || !label) return null;
      return { id, label };
    })
    .filter((c): c is FaqCategory => Boolean(c));
  if (!categories.length) return null;
  return {
    eyebrow: eyebrow || DEFAULT_FAQ_CONFIG.eyebrow,
    titleLine: title || DEFAULT_FAQ_CONFIG.titleLine,
    titleAccent: accent || DEFAULT_FAQ_CONFIG.titleAccent,
    subtitle: subtitle || DEFAULT_FAQ_CONFIG.subtitle,
    categories,
    ctaTitle: typeof raw.ctaTitle === "string" ? raw.ctaTitle.trim() : DEFAULT_FAQ_CONFIG.ctaTitle,
    ctaSubtitle: typeof raw.ctaSubtitle === "string" ? raw.ctaSubtitle.trim() : DEFAULT_FAQ_CONFIG.ctaSubtitle,
    ctaButtonLabel:
      typeof raw.ctaButtonLabel === "string" ? raw.ctaButtonLabel.trim() : DEFAULT_FAQ_CONFIG.ctaButtonLabel,
    ctaButtonHref:
      typeof raw.ctaButtonHref === "string" ? raw.ctaButtonHref.trim() : DEFAULT_FAQ_CONFIG.ctaButtonHref,
  };
}

export function parseFaqQuestionDoc(raw: Record<string, unknown>, docId: string): FaqItem | null {
  const categoryId = typeof raw.categoryId === "string" ? raw.categoryId.trim().toLowerCase() : "";
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const answer = typeof raw.answer === "string" ? raw.answer.trim() : "";
  const colorRaw =
    (typeof raw.accentColor === "string" ? raw.accentColor : typeof raw.color === "string" ? raw.color : "")
      .trim()
      .toLowerCase();
  const color = (FAQ_ITEM_COLORS.has(colorRaw) ? colorRaw : "blue") as FaqItemColor;
  const ik = (typeof raw.icon === "string" ? raw.icon : typeof raw.iconKey === "string" ? raw.iconKey : "")
    .trim()
    .toLowerCase();
  const iconKey = FAQ_ITEM_ICON_KEYS.has(ik) ? ik : "help-circle";
  if (raw.isVisible !== true) return null;
  if (!categoryId || !question || !answer) {
    console.warn("[faq/questions] skipping invalid doc", docId);
    return null;
  }
  return { categoryId, question, answer, color, iconKey };
}

export function mergeFaqConfig(header: Partial<FaqConfig> | null, items: FaqItem[]): FaqConfig | null {
  if (!header?.categories?.length) return null;
  const catIds = new Set(header.categories.map((c) => c.id));
  const valid = items.filter((it) => catIds.has(it.categoryId));
  if (!valid.length) return null;
  return {
    eyebrow: header.eyebrow ?? DEFAULT_FAQ_CONFIG.eyebrow,
    titleLine: header.titleLine ?? DEFAULT_FAQ_CONFIG.titleLine,
    titleAccent: header.titleAccent ?? DEFAULT_FAQ_CONFIG.titleAccent,
    subtitle: header.subtitle ?? DEFAULT_FAQ_CONFIG.subtitle,
    categories: header.categories,
    items: valid,
    ctaTitle: header.ctaTitle ?? DEFAULT_FAQ_CONFIG.ctaTitle,
    ctaSubtitle: header.ctaSubtitle ?? DEFAULT_FAQ_CONFIG.ctaSubtitle,
    ctaButtonLabel: header.ctaButtonLabel ?? DEFAULT_FAQ_CONFIG.ctaButtonLabel,
    ctaButtonHref: header.ctaButtonHref ?? DEFAULT_FAQ_CONFIG.ctaButtonHref,
  };
}
