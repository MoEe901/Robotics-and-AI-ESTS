import type { QuerySnapshot, DocumentData } from "firebase/firestore";
import { z } from "zod";

import type {
  CellulesConfig,
  FooterConfig,
  FooterNavItem,
  FooterSocialLink,
  FooterSocialPlatform,
  KnowUsConfig,
  NavbarConfig,
  PartnersConfig,
  ProcessStepsConfig,
  ProcessStepItem,
  WhyJoinConfig,
} from "@/lib/firebase/types";
import { DEFAULT_FOOTER_CONFIG } from "@/lib/firebase/types";
import { DEFAULT_NAVBAR_CONFIG } from "@/lib/firebase/types";
import { DEFAULT_PROCESS_STEPS_CONFIG } from "@/lib/content/process-steps-defaults";

const heroCtaSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const heroBackgroundMediaSchema = z
  .object({
    type: z.enum(["video", "image", "none"]).optional(),
    videoUrl: z.string().nullable().optional(),
    videoPosterUrl: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
    autoplay: z.boolean().optional(),
  })
  .passthrough()
  .optional();

const heroMaskSchema = z
  .object({
    enabled: z.boolean().optional(),
    opacity: z.number().min(0).max(1).optional(),
    color: z.string().optional(),
    gradient: z.enum(["none", "radial", "linear-bottom", "linear-top"]).optional(),
  })
  .passthrough()
  .optional();

const heroDatashowSchema = z
  .object({
    enabled: z.boolean().optional(),
    imageUrl: z.string().nullable().optional(),
    caption: z.string().optional(),
    position: z.enum(["center", "left", "right"]).optional(),
  })
  .passthrough()
  .optional();

const heroSchema = z
  .object({
    eyebrow: z.string().optional(),
    location: z.string().optional(),
    titleLines: z.array(z.string()).optional(),
    accentIndices: z.array(z.number()).optional(),
    description: z.string().optional(),
    primaryCta: heroCtaSchema.partial().optional(),
    secondaryCta: heroCtaSchema.partial().optional(),
    videoUrl: z.string().nullable().optional(),
    liveActivity: z
      .array(z.object({ id: z.string(), title: z.string(), timeAgo: z.string() }))
      .optional(),
    techStack: z.array(z.string()).optional(),
    growthStats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    backgroundMedia: heroBackgroundMediaSchema,
    mask: heroMaskSchema,
    datashow: heroDatashowSchema,
  })
  .passthrough();

export type PublicHeroContent = {
  eyebrow: string;
  location: string;
  titleLines: string[];
  accentIndices: number[];
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  videoUrl: string | null;
  backgroundMedia: {
    type: "video" | "image" | "none";
    videoUrl: string | null;
    videoPosterUrl: string | null;
    imageUrl: string | null;
    loop: boolean;
    muted: boolean;
    autoplay: boolean;
  };
  mask: {
    enabled: boolean;
    opacity: number;
    color: string;
    gradient: "none" | "radial" | "linear-bottom" | "linear-top";
  };
  datashow: {
    enabled: boolean;
    imageUrl: string | null;
    caption: string;
    position: "center" | "left" | "right";
  };
  liveActivity: Array<{ id: string; title: string; timeAgo: string }>;
  techStack: string[];
  growthStats: Array<{ label: string; value: string }>;
};

export const DEFAULT_HERO_PUBLIC: PublicHeroContent = {
  eyebrow: "University Tech Community",
  location: "EST Safi · Morocco",
  titleLines: ["Welcome", "to the", "Robotics", "& AI", "Club."],
  accentIndices: [2, 3],
  description:
    "A community of builders, dreamers, and innovators transforming ideas into intelligent machines. Join us and shape the future of technology — starting today.",
  primaryCta: { label: "Join the Club", href: "/#apply" },
  secondaryCta: { label: "Explore Events", href: "/#events" },
  videoUrl: null,
  backgroundMedia: {
    type: "none",
    videoUrl: null,
    videoPosterUrl: null,
    imageUrl: null,
    loop: true,
    muted: true,
    autoplay: true,
  },
  mask: {
    enabled: true,
    opacity: 0.6,
    color: "#07080f",
    gradient: "none",
  },
  datashow: {
    enabled: false,
    imageUrl: null,
    caption: "",
    position: "center",
  },
  liveActivity: [
    { id: "1", title: "New workshop announced", timeAgo: "2m ago" },
    { id: "2", title: "Member joined Design Cellule", timeAgo: "1h ago" },
    { id: "3", title: "Competition results published", timeAgo: "3h ago" },
  ],
  techStack: ["Python", "ROS2", "Arduino", "TensorFlow", "OpenCV", "MATLAB"],
  growthStats: [
    { label: "Members", value: "200+" },
    { label: "Cellules", value: "6" },
    { label: "Projects", value: "14" },
    { label: "Awards", value: "8+" },
  ],
};

export function parseHeroDoc(raw: Record<string, unknown>): PublicHeroContent {
  const r = heroSchema.safeParse(raw);
  if (!r.success) {
    console.warn("[siteContent/hero] invalid shape, using defaults", r.error.flatten());
    return { ...DEFAULT_HERO_PUBLIC };
  }
  const d = r.data;
  const mediaRaw = raw.backgroundMedia && typeof raw.backgroundMedia === "object"
    ? (raw.backgroundMedia as Record<string, unknown>)
    : {};
  const maskRaw = raw.mask && typeof raw.mask === "object" ? (raw.mask as Record<string, unknown>) : {};
  const datashowRaw = raw.datashow && typeof raw.datashow === "object"
    ? (raw.datashow as Record<string, unknown>)
    : {};
  const mediaTypeRaw = typeof mediaRaw.type === "string" ? mediaRaw.type.trim().toLowerCase() : "none";
  const mediaType = mediaTypeRaw === "video" || mediaTypeRaw === "image" ? mediaTypeRaw : "none";
  const maskGradientRaw = typeof maskRaw.gradient === "string" ? maskRaw.gradient.trim().toLowerCase() : "none";
  const maskGradient =
    maskGradientRaw === "radial" || maskGradientRaw === "linear-bottom" || maskGradientRaw === "linear-top"
      ? maskGradientRaw
      : "none";
  const datashowPosRaw = typeof datashowRaw.position === "string" ? datashowRaw.position.trim().toLowerCase() : "center";
  const datashowPosition = datashowPosRaw === "left" || datashowPosRaw === "right" ? datashowPosRaw : "center";
  const maskOpacityValue = typeof maskRaw.opacity === "number" && Number.isFinite(maskRaw.opacity) ? maskRaw.opacity : 0.6;
  const maskOpacity = Math.min(1, Math.max(0, maskOpacityValue));
  return {
    eyebrow: d.eyebrow?.trim() || DEFAULT_HERO_PUBLIC.eyebrow,
    location: d.location?.trim() || DEFAULT_HERO_PUBLIC.location,
    titleLines:
      Array.isArray(d.titleLines) && d.titleLines.length
        ? d.titleLines.map((s) => String(s).trim()).filter(Boolean)
        : DEFAULT_HERO_PUBLIC.titleLines,
    accentIndices: Array.isArray(d.accentIndices) ? d.accentIndices : DEFAULT_HERO_PUBLIC.accentIndices,
    description: d.description?.trim() || DEFAULT_HERO_PUBLIC.description,
    primaryCta: {
      label: d.primaryCta?.label?.trim() || DEFAULT_HERO_PUBLIC.primaryCta.label,
      href: d.primaryCta?.href?.trim() || DEFAULT_HERO_PUBLIC.primaryCta.href,
    },
    secondaryCta: {
      label: d.secondaryCta?.label?.trim() || DEFAULT_HERO_PUBLIC.secondaryCta.label,
      href: d.secondaryCta?.href?.trim() || DEFAULT_HERO_PUBLIC.secondaryCta.href,
    },
    videoUrl: typeof d.videoUrl === "string" && d.videoUrl.trim() ? d.videoUrl.trim() : d.videoUrl ?? null,
    backgroundMedia: {
      type: mediaType,
      videoUrl:
        typeof mediaRaw.videoUrl === "string" && mediaRaw.videoUrl.trim()
          ? mediaRaw.videoUrl.trim()
          : null,
      videoPosterUrl:
        typeof mediaRaw.videoPosterUrl === "string" && mediaRaw.videoPosterUrl.trim()
          ? mediaRaw.videoPosterUrl.trim()
          : null,
      imageUrl:
        typeof mediaRaw.imageUrl === "string" && mediaRaw.imageUrl.trim()
          ? mediaRaw.imageUrl.trim()
          : null,
      loop: mediaRaw.loop !== false,
      muted: mediaRaw.muted !== false,
      autoplay: mediaRaw.autoplay !== false,
    },
    mask: {
      enabled: maskRaw.enabled !== false,
      opacity: maskOpacity,
      color:
        typeof maskRaw.color === "string" && maskRaw.color.trim()
          ? maskRaw.color.trim()
          : "#07080f",
      gradient: maskGradient,
    },
    datashow: {
      enabled: datashowRaw.enabled === true,
      imageUrl:
        typeof datashowRaw.imageUrl === "string" && datashowRaw.imageUrl.trim()
          ? datashowRaw.imageUrl.trim()
          : null,
      caption: typeof datashowRaw.caption === "string" ? datashowRaw.caption.trim() : "",
      position: datashowPosition,
    },
    liveActivity:
      Array.isArray(d.liveActivity) && d.liveActivity.length ? d.liveActivity : DEFAULT_HERO_PUBLIC.liveActivity,
    techStack: Array.isArray(d.techStack) && d.techStack.length ? d.techStack : DEFAULT_HERO_PUBLIC.techStack,
    growthStats:
      Array.isArray(d.growthStats) && d.growthStats.length ? d.growthStats : DEFAULT_HERO_PUBLIC.growthStats,
  };
}

function sortByOrder<T extends { order?: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function parseKnowUsDoc(raw: Record<string, unknown>): KnowUsConfig | null {
  const mainTitle = typeof raw.mainTitle === "string" ? raw.mainTitle.trim() : "";
  const cardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
  const cards = sortByOrder(
    cardsRaw
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const title = typeof o.title === "string" ? o.title.trim() : "";
        const body = typeof o.body === "string" ? o.body.trim() : "";
        if (!title || !body) return null;
        return { title, description: body, order: typeof o.order === "number" ? o.order : 0 };
      })
      .filter((c): c is { title: string; description: string; order: number } => Boolean(c)),
  ).map(({ title, description }) => ({ title, description }));
  const emailHeading = typeof raw.emailHeading === "string" ? raw.emailHeading.trim() : "";
  const intro = emailHeading || mainTitle || "";
  if (!intro && !cards.length) return null;
  return {
    intro: intro || mainTitle,
    cards,
    sectionTitle: mainTitle || undefined,
  };
}

export function parseNavbarDoc(raw: Record<string, unknown>): NavbarConfig | null {
  const logoUrl =
    typeof raw.logoUrl === "string" && raw.logoUrl.trim()
      ? raw.logoUrl.trim()
      : DEFAULT_NAVBAR_CONFIG.logoUrl;
  const logoText = typeof raw.logoText === "string" ? raw.logoText.trim() : "";
  const rawItems =
    Array.isArray(raw.links) ? raw.links : Array.isArray(raw.navItems) ? raw.navItems : [];
  const links = sortByOrder(
    rawItems
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id =
        typeof o.id === "string" && o.id.trim()
          ? o.id.trim()
          : `${String(o.label ?? "link").trim().toLowerCase().replace(/\s+/g, "-")}-${idx}`;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const href = typeof o.href === "string" ? o.href.trim() : "";
      if (!label || !href) return null;
      return {
        id,
        label,
        href,
        isExternal: o.isExternal === true || /^https?:\/\//i.test(href),
        order: typeof o.order === "number" ? o.order : 0,
        isVisible: o.isVisible !== false,
      };
    })
    .filter((x): x is NavbarConfig["links"][number] => Boolean(x)),
  );
  const ctaLabel =
    typeof raw.ctaText === "string" && raw.ctaText.trim()
      ? raw.ctaText.trim()
      : raw.ctaButton && typeof raw.ctaButton === "object" && typeof (raw.ctaButton as Record<string, unknown>).label === "string"
        ? ((raw.ctaButton as Record<string, unknown>).label as string).trim()
        : DEFAULT_NAVBAR_CONFIG.ctaButton.label;
  const ctaHref =
    typeof raw.ctaHref === "string" && raw.ctaHref.trim()
      ? raw.ctaHref.trim()
      : raw.ctaButton && typeof raw.ctaButton === "object" && typeof (raw.ctaButton as Record<string, unknown>).href === "string"
        ? ((raw.ctaButton as Record<string, unknown>).href as string).trim()
        : DEFAULT_NAVBAR_CONFIG.ctaButton.href;
  const ctaVisible =
    raw.ctaButton && typeof raw.ctaButton === "object"
      ? (raw.ctaButton as Record<string, unknown>).isVisible !== false
      : true;
  return {
    logoUrl,
    logoText: logoText || DEFAULT_NAVBAR_CONFIG.logoText,
    links: links.length ? links : [...DEFAULT_NAVBAR_CONFIG.links],
    ctaButton: {
      label: ctaLabel || DEFAULT_NAVBAR_CONFIG.ctaButton.label,
      href: ctaHref || DEFAULT_NAVBAR_CONFIG.ctaButton.href,
      isVisible: ctaVisible,
    },
    showThemeToggle: raw.showThemeToggle !== false,
  };
}

export function parsePartnersDoc(raw: Record<string, unknown>): PartnersConfig | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const logosRaw = Array.isArray(raw.logos) ? raw.logos : [];
  const logos = logosRaw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
      if (!imageUrl) return null;
      const alt = typeof o.alt === "string" && o.alt.trim() ? o.alt.trim() : "Partner logo";
      const visible = o.visible !== false;
      const sourceTone = o.sourceTone === "dark" ? "dark" : "light";
      if (!visible) return null;
      return { imageUrl, alt, sourceTone };
    })
    .filter((row): row is { imageUrl: string; alt: string; sourceTone: "light" | "dark" } => Boolean(row));
  if (!logos.length) return null;
  return { title: title || "Our Partners & Collaborations All the Time", logos };
}

export function parseWhyJoinDoc(raw: Record<string, unknown>): WhyJoinConfig | null {
  const eyebrow =
    (typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "") ||
    (typeof raw.smallHeading === "string" ? raw.smallHeading.trim() : "");
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const highlightsRaw = Array.isArray(raw.highlights) ? raw.highlights : [];
  const highlights = sortByOrder(
    highlightsRaw
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const t = typeof o.title === "string" ? o.title.trim() : "";
        const st = typeof o.subtitle === "string" ? o.subtitle.trim() : "";
        if (!t) return null;
        return { title: t, subtitle: st, order: typeof o.order === "number" ? o.order : 0 };
      })
      .filter((x): x is { title: string; subtitle: string; order: number } => Boolean(x)),
  );
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
  const stepCards = sortByOrder(
    stepsRaw
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const t = typeof o.title === "string" ? o.title.trim() : "";
        const body =
          (typeof o.body === "string" ? o.body.trim() : "") ||
          (typeof o.description === "string" ? o.description.trim() : "");
        if (!t || !body) return null;
        return { title: t, description: body, order: typeof o.order === "number" ? o.order : 0 };
      })
      .filter((x): x is { title: string; description: string; order: number } => Boolean(x)),
  );
  const legacyCardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
  const legacyAsSteps = sortByOrder(
    legacyCardsRaw
      .map((row, idx) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const t = typeof o.title === "string" ? o.title.trim() : "";
        const body =
          (typeof o.body === "string" ? o.body.trim() : "") ||
          (typeof o.description === "string" ? o.description.trim() : "");
        if (!t || !body) return null;
        return { title: t, description: body, order: typeof o.order === "number" ? o.order : idx };
      })
      .filter((x): x is { title: string; description: string; order: number } => Boolean(x)),
  );
  const effectiveStepCards = stepCards.length ? stepCards : legacyAsSteps;
  const hl = highlights.map((h) => ({ title: h.title, subtitle: h.subtitle }));
  const cards =
    effectiveStepCards.length > 0
      ? effectiveStepCards.map(({ title, description }) => ({ title, description }))
      : hl.map((h) => ({ title: h.title, description: h.subtitle || " " }));
  if (!title || !description || !cards.length) return null;
  return {
    smallHeading: eyebrow || "Why join",
    title,
    description,
    cards,
    highlights: hl.length ? hl : undefined,
  };
}

export function parseCellulesDoc(raw: Record<string, unknown>): CellulesConfig | null {
  const eyebrow = typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const intro =
    (typeof raw.intro === "string" ? raw.intro.trim() : "") ||
    (typeof raw.subtitle === "string" ? raw.subtitle.trim() : "");
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const legacyCardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
  const fromLegacy = legacyCardsRaw
    .map((row, idx) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const t = typeof o.title === "string" ? o.title.trim() : "";
      const body =
        (typeof o.body === "string" ? o.body.trim() : "") ||
        (typeof o.description === "string" ? o.description.trim() : "");
      if (!t || !body) return null;
      return {
        title: t,
        description: body,
        iconKey: typeof o.iconKey === "string" ? o.iconKey.trim() : undefined,
        iconImageUrl: typeof o.iconImageUrl === "string" ? o.iconImageUrl.trim() : undefined,
        order: typeof o.order === "number" ? o.order : idx,
      };
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const itemsMerged = itemsRaw.length ? itemsRaw : fromLegacy;
  const cards = sortByOrder(
    itemsMerged
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const t = typeof o.title === "string" ? o.title.trim() : "";
        const body =
          (typeof o.body === "string" ? o.body.trim() : "") ||
          (typeof o.description === "string" ? o.description.trim() : "");
        const iconKey = typeof o.iconKey === "string" ? o.iconKey.trim() : undefined;
        const iconImageUrl = typeof o.iconImageUrl === "string" ? o.iconImageUrl.trim() : undefined;
        if (!t || !body) return null;
        return {
          title: t,
          description: body,
          iconKey,
          iconImageUrl,
          order: typeof o.order === "number" ? o.order : 0,
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c)),
  ).map(({ title, description, iconKey, iconImageUrl }) => {
    const card: CellulesConfig["cards"][number] = { title, description };
    if (iconKey) card.iconKey = iconKey;
    if (iconImageUrl) card.iconImageUrl = iconImageUrl;
    return card;
  });
  if (!intro || !cards.length) return null;
  return { eyebrow: eyebrow || "Robotics & AI Club", title: title || "Our Cellules", subtitle: intro, cards };
}

const STEP_ICONS = new Set([
  "users",
  "lightbulb",
  "calendar",
  "award",
  "rocket",
  "target",
  "sparkles",
  "palette",
  "video",
  "file",
  "wallet",
  "megaphone",
]);

export function parseProcessStepsDoc(raw: Record<string, unknown>): ProcessStepsConfig | null {
  const eyebrow = typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "";
  const titleLine = typeof raw.titleLine === "string" ? raw.titleLine.trim() : "";
  const titleAccent = typeof raw.titleAccent === "string" ? raw.titleAccent.trim() : "";
  const titleCombined =
    (typeof raw.title === "string" ? raw.title.trim() : "") ||
    [titleLine, titleAccent].filter(Boolean).join("|");
  const title = titleCombined;
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
  const steps: ProcessStepItem[] = sortByOrder(
    stepsRaw
      .map((row): (ProcessStepItem & { order: number }) | null => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const fromNumber =
          typeof o.number === "string" ? o.number.trim() : typeof o.number === "number" ? String(o.number) : "";
        const fromBadge = typeof o.badge === "string" ? o.badge.trim() : "";
        const badge = fromNumber || fromBadge || "01";
        const lineTitle = typeof o.title === "string" ? o.title.trim() : "";
        const body =
          (typeof o.body === "string" ? o.body.trim() : "") ||
          (typeof o.description === "string" ? o.description.trim() : "");
        const label = typeof o.label === "string" ? o.label.trim() : "";
        if (!lineTitle || !body) return null;
        const ik = typeof o.iconKey === "string" ? o.iconKey.trim().toLowerCase() : "";
        const iconKey = STEP_ICONS.has(ik) ? ik : "users";
        return {
          badge: label || badge,
          title: lineTitle,
          description: body,
          iconKey,
          order: typeof o.order === "number" ? o.order : 0,
        };
      })
      .filter((s): s is ProcessStepItem & { order: number } => Boolean(s)),
  ).map(({ badge, title, description, iconKey }) => ({ badge, title, description, iconKey }));
  if (steps.length < 2) return null;
  const titleParts = title.split("|");
  return {
    eyebrow: eyebrow || DEFAULT_PROCESS_STEPS_CONFIG.eyebrow,
    titleLine: titleParts[0]?.trim() || DEFAULT_PROCESS_STEPS_CONFIG.titleLine,
    titleAccent: titleParts[1]?.trim() || title || DEFAULT_PROCESS_STEPS_CONFIG.titleAccent,
    steps,
  };
}

const SOCIAL_PLATFORMS = new Set(["instagram", "linkedin", "youtube", "github"]);

export function parseFooterDoc(raw: Record<string, unknown>): FooterConfig {
  const tagline = typeof raw.tagline === "string" ? raw.tagline.trim() : DEFAULT_FOOTER_CONFIG.tagline;
  const address = typeof raw.address === "string" ? raw.address.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const hours = typeof raw.hours === "string" ? raw.hours.trim() : "";
  const contactLocation =
    [address, phone, hours].filter(Boolean).join("\n") || DEFAULT_FOOTER_CONFIG.contactLocation;
  const contactEmail = email || DEFAULT_FOOTER_CONFIG.contactEmail;

  const columnsRaw = Array.isArray(raw.columns) ? raw.columns : [];
  const columns = columnsRaw
    .map((col) => {
      if (!col || typeof col !== "object") return null;
      const o = col as Record<string, unknown>;
      const heading = typeof o.heading === "string" ? o.heading.trim() : "";
      const linksRaw = Array.isArray(o.links) ? o.links : [];
      const links = linksRaw
        .map((link) => {
          if (!link || typeof link !== "object") return null;
          const l = link as Record<string, unknown>;
          const label = typeof l.label === "string" ? l.label.trim() : "";
          const href = typeof l.href === "string" ? l.href.trim() : "";
          if (!label || !href) return null;
          return { label, href };
        })
        .filter((x): x is FooterNavItem => Boolean(x));
      if (!heading || !links.length) return null;
      return { heading, links };
    })
    .filter((c): c is { heading: string; links: FooterNavItem[] } => Boolean(c));

  const socialsRaw = Array.isArray(raw.socials) ? raw.socials : [];
  const socialLinks: FooterSocialLink[] = socialsRaw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const platform = typeof o.platform === "string" ? o.platform.trim().toLowerCase() : "";
      const url = typeof o.url === "string" ? o.url.trim() : "";
      if (!platform || !url || !SOCIAL_PLATFORMS.has(platform)) return null;
      return { platform: platform as FooterSocialPlatform, url };
    })
    .filter((x): x is FooterSocialLink => Boolean(x));

  const footerNav =
    columns[0]?.links?.length ? columns[0].links : [...DEFAULT_FOOTER_CONFIG.footerNav];

  return {
    tagline: tagline || DEFAULT_FOOTER_CONFIG.tagline,
    footerNav,
    socialLinks: socialLinks.length ? socialLinks : [...DEFAULT_FOOTER_CONFIG.socialLinks],
    contactLocation,
    contactEmail,
    copyrightText:
      typeof raw.copyrightText === "string" && raw.copyrightText.trim()
        ? raw.copyrightText.trim()
        : DEFAULT_FOOTER_CONFIG.copyrightText,
    versionLine:
      typeof raw.versionLine === "string" && raw.versionLine.trim()
        ? raw.versionLine.trim()
        : DEFAULT_FOOTER_CONFIG.versionLine,
    footerColumns: columns.length ? columns : undefined,
  };
}

export type SiteContentBundle = {
  hero: PublicHeroContent | null;
  navbar: NavbarConfig | null;
  knowUs: KnowUsConfig | null;
  partners: PartnersConfig | null;
  whyJoin: WhyJoinConfig | null;
  cellules: CellulesConfig | null;
  processSteps: ProcessStepsConfig | null;
  footer: FooterConfig | null;
};

export function parseSiteContentSnapshot(snapshot: QuerySnapshot<DocumentData>): SiteContentBundle {
  const byId: Record<string, Record<string, unknown>> = {};
  for (const d of snapshot.docs) {
    byId[d.id] = d.data() as Record<string, unknown>;
  }

  const heroRaw = byId.hero;
  const navbarRaw = byId.navbar;
  const knowUsRaw = byId.knowUs;
  const partnersRaw = byId.partners;
  const whyJoinRaw = byId.whyJoin;
  const cellulesRaw = byId.cellules;
  const processRaw = byId.processSteps;
  const footerRaw = byId.footer;

  return {
    hero: heroRaw ? parseHeroDoc(heroRaw) : null,
    navbar: navbarRaw ? parseNavbarDoc(navbarRaw) : null,
    knowUs: knowUsRaw ? parseKnowUsDoc(knowUsRaw) : null,
    partners: partnersRaw ? parsePartnersDoc(partnersRaw) : null,
    whyJoin: whyJoinRaw ? parseWhyJoinDoc(whyJoinRaw) : null,
    cellules: cellulesRaw ? parseCellulesDoc(cellulesRaw) : null,
    processSteps: processRaw ? parseProcessStepsDoc(processRaw) : null,
    footer: footerRaw ? parseFooterDoc(footerRaw) : null,
  };
}
