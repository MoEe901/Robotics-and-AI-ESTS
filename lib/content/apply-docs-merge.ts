import type { ApplySectionConfig } from "@/lib/firebase/types";
import { DEFAULT_APPLY_CONFIG, parseCommunityConfig } from "@/lib/content/apply-defaults";

/**
 * Merges documents from the `apply` collection (ids: hero, leftPanel, contactRows, socialLinks, form, submitBlock)
 * into the flat `ApplySectionConfig` used by the public Apply section.
 */
export function mergeApplyCollectionDocs(docsById: Record<string, Record<string, unknown>>): ApplySectionConfig {
  const d = structuredClone(DEFAULT_APPLY_CONFIG);

  const hero = docsById.hero;
  if (hero) {
    if (typeof hero.stepLabel === "string" && hero.stepLabel.trim()) d.topLabel = hero.stepLabel.trim();
    if (typeof hero.titleLine1 === "string" && hero.titleLine1.trim()) d.heroLine1 = hero.titleLine1.trim();
    if (typeof hero.titleLine2 === "string" && hero.titleLine2.trim()) d.heroLine2 = hero.titleLine2.trim();
    if (typeof hero.subtitle === "string" && hero.subtitle.trim()) d.heroSub = hero.subtitle.trim();
  }

  const left = docsById.leftPanel;
  if (left) {
    if (typeof left.badge === "string" && left.badge.trim()) d.infoBadge = left.badge.trim();
    if (typeof left.title === "string" && left.title.trim()) d.infoTitle = left.title.trim();
    if (typeof left.description === "string" && left.description.trim()) d.infoDesc = left.description.trim();
  }

  const cr = docsById.contactRows;
  const rowsRaw = cr && Array.isArray((cr as { rows?: unknown }).rows) ? (cr as { rows: unknown[] }).rows : cr;
  if (Array.isArray(rowsRaw)) {
    const parsed = rowsRaw
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label.trim() : "";
        const value = typeof o.value === "string" ? o.value.trim() : "";
        const iconKey = o.type === "phone" ? "phone" : o.type === "mail" ? "mail" : o.type === "clock" ? "clock" : "map";
        const tone =
          o.accent === "violet" || o.accent === "pink" || o.accent === "green" ? o.accent : "blue";
        if (!label || !value) return null;
        return {
          label,
          value,
          iconKey: iconKey as "map" | "phone" | "mail" | "clock",
          tone: tone as "blue" | "violet" | "pink" | "green",
        };
      })
      .filter(Boolean) as ApplySectionConfig["contactRows"];
    if (parsed.length) d.contactRows = parsed;
  }

  const social = docsById.socialLinks;
  if (social && typeof social === "object") {
    const o = social as Record<string, unknown>;
    const links: ApplySectionConfig["socialLinks"] = [];
    for (const p of ["instagram", "linkedin", "twitter", "youtube"] as const) {
      const url = typeof o[p] === "string" ? o[p].trim() : "";
      links.push({ platform: p, url });
    }
    d.socialLinks = links;
  }

  const form = docsById.form;
  if (form) {
    if (typeof form.formTitle === "string" && form.formTitle.trim()) d.formTitle = form.formTitle.trim();
    if (typeof form.formSubtitle === "string" && form.formSubtitle.trim())
      d.formSubtitle = form.formSubtitle.trim();
    const fl = form.fieldLabels as Record<string, unknown> | undefined;
    if (fl && typeof fl === "object") {
      if (typeof fl.firstName === "string") d.firstNameLabel = fl.firstName as string;
      if (typeof fl.lastName === "string") d.lastNameLabel = fl.lastName as string;
      if (typeof fl.year === "string") d.yearLabel = fl.year as string;
      if (typeof fl.department === "string") d.departmentLabel = fl.department as string;
      if (typeof fl.email === "string") d.emailLabel = fl.email as string;
      if (typeof fl.phone === "string") d.phoneLabel = fl.phone as string;
      if (typeof fl.message === "string") d.messageLabel = fl.message as string;
    }
    const ph = form.placeholders as Record<string, unknown> | undefined;
    if (ph && typeof ph === "object") {
      Object.assign(d.placeholders, ph);
    }
    if (Array.isArray(form.yearOptions)) {
      d.yearOptions = form.yearOptions
        .filter((x): x is string => typeof x === "string" && Boolean(x.trim()))
        .map((x) => x.trim());
    }
    if (Array.isArray(form.departmentOptions)) {
      d.departmentOptions = form.departmentOptions
        .map((x) => {
          if (typeof x === "string") return x.trim();
          if (x && typeof x === "object") {
            const o = x as Record<string, unknown>;
            const label = typeof o.label === "string" ? o.label.trim() : "";
            return label;
          }
          return "";
        })
        .filter(Boolean);
    }
  }

  const community = docsById.community;
  if (community) {
    d.community = parseCommunityConfig(community);
  }

  const sub = docsById.submitBlock;
  if (sub) {
    if (typeof sub.charterText === "string" && sub.charterText.trim()) d.charterLinkText = sub.charterText.trim();
    if (typeof sub.charterUrl === "string" && sub.charterUrl.trim()) d.charterLinkHref = sub.charterUrl.trim();
    if (typeof sub.submitNotePrefix === "string" && sub.submitNotePrefix.trim())
      d.submitNotePrefix = sub.submitNotePrefix.trim();
    if (typeof sub.submitLabel === "string" && sub.submitLabel.trim()) d.submitButtonLabel = sub.submitLabel.trim();
    if (typeof sub.successTitle === "string" && sub.successTitle.trim()) d.successTitle = sub.successTitle.trim();
    if (typeof sub.successMessage === "string" && sub.successMessage.trim())
      d.successMessage = sub.successMessage.trim();
  }

  return d;
}
