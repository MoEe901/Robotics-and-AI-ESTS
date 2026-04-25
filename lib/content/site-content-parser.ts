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
import { SECTION_ICON_KEYS } from "@/lib/icons/section-icon-pack";

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
    techStack: z.unknown().optional(),
    growthStats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    backgroundMedia: heroBackgroundMediaSchema,
    mask: heroMaskSchema,
    datashow: heroDatashowSchema,
  })
  .passthrough();

export type HeroStatSource =
  | "manual"
  | "members-live"
  | "cellules-live"
  | "events-live"
  | "events-upcoming"
  | "events-past"
  | "partners-live"
  | "faq-live"
  | "team-alumni"
  | "years-active"
  | "projects"
  | "awards";

export type HeroStatColor = "violet" | "cyan" | "emerald" | "fuchsia" | "amber" | "white";
export type HeroStatSize = "sm" | "md" | "lg";
export type HeroStatEmphasis = "number" | "label" | "balanced";
export type HeroStatFormat = "plain" | "compact" | "padded";
export type HeroStatAnimate = "none" | "count-up" | "pulse";
export type HeroStatsStripLayout = "row" | "grid-2" | "grid-4";
export type HeroStatsStripSeparator = "line" | "dot" | "none";
export type HeroStatsStripAlignment = "left" | "center" | "right";
export type HeroStatsStripBackground = "transparent" | "panel" | "glow";

export const HERO_STAT_COLORS: HeroStatColor[] = ["violet", "cyan", "emerald", "fuchsia", "amber", "white"];
export const HERO_STAT_SIZES: HeroStatSize[] = ["sm", "md", "lg"];
export const HERO_STAT_EMPHASES: HeroStatEmphasis[] = ["number", "label", "balanced"];
export const HERO_STAT_FORMATS: HeroStatFormat[] = ["plain", "compact", "padded"];
export const HERO_STAT_ANIMATES: HeroStatAnimate[] = ["none", "count-up", "pulse"];

export const HERO_STAT_SOURCES: Array<{ value: HeroStatSource; label: string; derivable: boolean; requires?: "foundedYear" }> = [
  { value: "manual", label: "Manual (free text)", derivable: false },
  { value: "members-live", label: "Members — active (live count)", derivable: true },
  { value: "cellules-live", label: "Cellules (live count)", derivable: true },
  { value: "events-live", label: "Events — all active (live count)", derivable: true },
  { value: "events-upcoming", label: "Events — upcoming (live count)", derivable: true },
  { value: "events-past", label: "Events — past (live count)", derivable: true },
  { value: "partners-live", label: "Partners (live count)", derivable: true },
  { value: "faq-live", label: "FAQ questions (live count)", derivable: true },
  { value: "team-alumni", label: "Team alumni (live count)", derivable: true },
  { value: "years-active", label: "Years active (from founded year)", derivable: true, requires: "foundedYear" },
  { value: "projects", label: "Projects (manual)", derivable: false },
  { value: "awards", label: "Awards (manual)", derivable: false },
];

const LEGACY_SOURCE_MAP: Record<string, HeroStatSource> = {
  members: "members-live",
  cellules: "cellules-live",
  events: "events-live",
  "events-all": "events-live",
  partners: "partners-live",
  "faq-questions": "faq-live",
};

export function normalizeHeroStatSource(raw: unknown): HeroStatSource {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "manual";
  if (s in LEGACY_SOURCE_MAP) return LEGACY_SOURCE_MAP[s];
  const allowed = HERO_STAT_SOURCES.map((src) => src.value) as string[];
  return (allowed.includes(s) ? s : "manual") as HeroStatSource;
}

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
  techStack: Array<{
    id: string;
    label: string;
    accent: "violet" | "cyan" | "mixed";
    order: number;
    isVisible: boolean;
  }>;
  growthStats: Array<{ label: string; value: string }>;
  stats: {
    tiles: Array<{
      id: string;
      label: string;
      labelSingular: string | null;
      source: HeroStatSource;
      manualValue: string;
      prefix: string;
      suffix: string;
      color: HeroStatColor;
      size: HeroStatSize;
      emphasis: HeroStatEmphasis;
      format: HeroStatFormat;
      animate: HeroStatAnimate;
      href: string | null;
      order: number;
      isVisible: boolean;
    }>;
    roundDerivedTo: number;
  };
  statsStrip: {
    isVisible: boolean;
    layout: HeroStatsStripLayout;
    separator: HeroStatsStripSeparator;
    alignment: HeroStatsStripAlignment;
    background: HeroStatsStripBackground;
    animateOnScroll: boolean;
  };
  foundedYear: number | null;
  growth: {
    title: string;
    metric: "newMembers";
    months: number;
  };
  heroCards: {
    activity: { isVisible: boolean; eyebrow: string; title: string };
    techStack: { isVisible: boolean; eyebrow: string; title: string };
    growth: { isVisible: boolean; eyebrow: string };
  };
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
  techStack: [
    { id: "python", label: "Python", accent: "cyan", order: 0, isVisible: true },
    { id: "ros2", label: "ROS2", accent: "violet", order: 1, isVisible: true },
    { id: "arduino", label: "Arduino", accent: "mixed", order: 2, isVisible: true },
    { id: "tensorflow", label: "TensorFlow", accent: "violet", order: 3, isVisible: true },
    { id: "opencv", label: "OpenCV", accent: "cyan", order: 4, isVisible: true },
    { id: "matlab", label: "MATLAB", accent: "mixed", order: 5, isVisible: true },
  ],
  growthStats: [
    { label: "Members", value: "200+" },
    { label: "Cellules", value: "6" },
    { label: "Projects", value: "14" },
    { label: "Awards", value: "8+" },
  ],
  stats: {
    tiles: [
      { id: "members", label: "Members", labelSingular: "Member", source: "members-live", manualValue: "200", prefix: "", suffix: "", color: "violet", size: "md", emphasis: "number", format: "plain", animate: "none", href: null, order: 0, isVisible: true },
      { id: "cellules", label: "Cellules", labelSingular: "Cellule", source: "cellules-live", manualValue: "6", prefix: "", suffix: "", color: "cyan", size: "md", emphasis: "number", format: "plain", animate: "none", href: null, order: 1, isVisible: true },
      { id: "events", label: "Events", labelSingular: "Event", source: "events-live", manualValue: "0", prefix: "", suffix: "", color: "emerald", size: "md", emphasis: "number", format: "plain", animate: "none", href: null, order: 2, isVisible: true },
      { id: "projects", label: "Projects", labelSingular: "Project", source: "projects", manualValue: "14", prefix: "", suffix: "", color: "fuchsia", size: "md", emphasis: "number", format: "plain", animate: "none", href: null, order: 3, isVisible: true },
      { id: "awards", label: "Awards", labelSingular: "Award", source: "awards", manualValue: "8", prefix: "", suffix: "", color: "amber", size: "md", emphasis: "number", format: "plain", animate: "none", href: null, order: 4, isVisible: true },
    ],
    roundDerivedTo: 1,
  },
  statsStrip: {
    isVisible: true,
    layout: "row",
    separator: "line",
    alignment: "center",
    background: "transparent",
    animateOnScroll: true,
  },
  foundedYear: null,
  growth: { title: "Club stats", metric: "newMembers", months: 6 },
  heroCards: {
    activity: { isVisible: true, eyebrow: "Live Activity", title: "Club Updates" },
    techStack: { isVisible: true, eyebrow: "Tech Stack", title: "What We Build With" },
    growth: { isVisible: true, eyebrow: "Growth" },
  },
};

export function parseHeroDoc(raw: Record<string, unknown>): PublicHeroContent {
  const r = heroSchema.safeParse(raw);
  if (!r.success) {
    console.warn("[siteContent/hero] invalid shape, using defaults", r.error.flatten());
    return { ...DEFAULT_HERO_PUBLIC };
  }
  const d = r.data;
  const statsRaw = raw.stats && typeof raw.stats === "object" ? (raw.stats as Record<string, unknown>) : {};
  const growthRaw = raw.growth && typeof raw.growth === "object" ? (raw.growth as Record<string, unknown>) : {};
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
  const pickEnum = <T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T =>
    (typeof raw === "string" && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback);
  const parseTile = (row: unknown, idx: number): PublicHeroContent["stats"]["tiles"][number] | null => {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const source = normalizeHeroStatSource(o.source);
    const singularRaw = typeof o.labelSingular === "string" ? o.labelSingular.trim() : "";
    const fallback = DEFAULT_HERO_PUBLIC.stats.tiles[idx] ?? DEFAULT_HERO_PUBLIC.stats.tiles[0];
    const hrefRaw = typeof o.href === "string" ? o.href.trim() : "";
    return {
      id: typeof o.id === "string" && o.id.trim() ? o.id.trim() : `tile-${idx}`,
      label: label || "Stat",
      labelSingular: singularRaw || null,
      source,
      manualValue: typeof o.manualValue === "string" ? o.manualValue : typeof o.value === "string" ? o.value : "",
      prefix: typeof o.prefix === "string" ? o.prefix : "",
      suffix: typeof o.suffix === "string" ? o.suffix : "",
      color: pickEnum(o.color, HERO_STAT_COLORS, fallback.color),
      size: pickEnum(o.size, HERO_STAT_SIZES, fallback.size),
      emphasis: pickEnum(o.emphasis, HERO_STAT_EMPHASES, fallback.emphasis),
      format: pickEnum(o.format, HERO_STAT_FORMATS, fallback.format),
      animate: pickEnum(o.animate, HERO_STAT_ANIMATES, fallback.animate),
      href: hrefRaw || null,
      order: typeof o.order === "number" ? o.order : idx,
      isVisible: o.isVisible !== false,
    };
  };
  let tiles: PublicHeroContent["stats"]["tiles"] = [];
  if (Array.isArray(statsRaw.tiles)) {
    tiles = (statsRaw.tiles as unknown[])
      .map((row, idx) => parseTile(row, idx))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .sort((a, b) => a.order - b.order);
  } else {
    const legacyKeys: Array<"members" | "cellules" | "projects" | "awards"> = ["members", "cellules", "projects", "awards"];
    tiles = legacyKeys
      .map((key, idx) => {
        const legacy = statsRaw[key] && typeof statsRaw[key] === "object" ? (statsRaw[key] as Record<string, unknown>) : null;
        const fallback = DEFAULT_HERO_PUBLIC.stats.tiles[idx];
        if (!legacy) return fallback;
        const source: HeroStatSource = legacy.mode === "manual" ? "manual" : normalizeHeroStatSource(key);
        return {
          ...fallback,
          id: key,
          source,
          manualValue: typeof legacy.value === "string" ? legacy.value : fallback.manualValue,
          suffix: legacy.showPlus === true ? "+" : "",
          order: idx,
          isVisible: true,
        };
      });
  }
  const stripRaw = raw.statsStrip && typeof raw.statsStrip === "object" ? (raw.statsStrip as Record<string, unknown>) : {};
  const statsStrip: PublicHeroContent["statsStrip"] = {
    isVisible: stripRaw.isVisible !== false,
    layout: pickEnum(stripRaw.layout, ["row", "grid-2", "grid-4"] as const, DEFAULT_HERO_PUBLIC.statsStrip.layout),
    separator: pickEnum(stripRaw.separator, ["line", "dot", "none"] as const, DEFAULT_HERO_PUBLIC.statsStrip.separator),
    alignment: pickEnum(stripRaw.alignment, ["left", "center", "right"] as const, DEFAULT_HERO_PUBLIC.statsStrip.alignment),
    background: pickEnum(stripRaw.background, ["transparent", "panel", "glow"] as const, DEFAULT_HERO_PUBLIC.statsStrip.background),
    animateOnScroll: stripRaw.animateOnScroll !== false,
  };
  const foundedYearRaw = raw.foundedYear;
  const foundedYearNum = typeof foundedYearRaw === "number" && Number.isFinite(foundedYearRaw)
    ? Math.floor(foundedYearRaw)
    : typeof foundedYearRaw === "string" && foundedYearRaw.trim()
      ? Number.parseInt(foundedYearRaw.trim(), 10)
      : null;
  const foundedYear = foundedYearNum && foundedYearNum >= 1900 && foundedYearNum <= 3000 ? foundedYearNum : null;
  const roundRaw = typeof statsRaw.roundDerivedTo === "number" ? statsRaw.roundDerivedTo : DEFAULT_HERO_PUBLIC.stats.roundDerivedTo;
  const roundDerivedTo = [1, 5, 10, 25, 50, 100].includes(roundRaw) ? roundRaw : 1;
  const rawTech = Array.isArray(raw.techStack)
    ? raw.techStack
    : raw.techStack && typeof raw.techStack === "object" && Array.isArray((raw.techStack as Record<string, unknown>).items)
      ? ((raw.techStack as Record<string, unknown>).items as unknown[])
      : [];
  const techItems = sortByOrder(
    rawTech
      .map((row, idx) => {
        if (typeof row === "string" && row.trim()) {
          return { id: `ts-${idx}`, label: row.trim(), accent: "mixed" as const, order: idx, isVisible: true };
        }
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label.trim() : "";
        if (!label) return null;
        const accentRaw = typeof o.accent === "string" ? o.accent.trim().toLowerCase() : "mixed";
        const accent = accentRaw === "violet" || accentRaw === "cyan" ? accentRaw : "mixed";
        return {
          id: typeof o.id === "string" && o.id.trim() ? o.id.trim() : `ts-${idx}`,
          label,
          accent: accent as "violet" | "cyan" | "mixed",
          order: typeof o.order === "number" ? o.order : idx,
          isVisible: o.isVisible !== false,
        };
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v)),
  );
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
    techStack: techItems.length ? techItems : DEFAULT_HERO_PUBLIC.techStack,
    growthStats:
      Array.isArray(d.growthStats) && d.growthStats.length ? d.growthStats : DEFAULT_HERO_PUBLIC.growthStats,
    stats: {
      tiles: tiles.length ? tiles : DEFAULT_HERO_PUBLIC.stats.tiles,
      roundDerivedTo,
    },
    statsStrip,
    foundedYear,
    growth: {
      title:
        typeof growthRaw.title === "string" && growthRaw.title.trim()
          ? growthRaw.title.trim()
          : DEFAULT_HERO_PUBLIC.growth.title,
      metric: "newMembers",
      months:
        typeof growthRaw.months === "number" && [3, 6, 12].includes(growthRaw.months)
          ? growthRaw.months
          : DEFAULT_HERO_PUBLIC.growth.months,
    },
    heroCards: parseHeroCards(raw.heroCards),
  };
}

function parseHeroCards(raw: unknown): PublicHeroContent["heroCards"] {
  const src =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  function pick(
    key: "activity" | "techStack" | "growth",
  ): Record<string, unknown> {
    const v = src[key];
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  }
  const a = pick("activity");
  const t = pick("techStack");
  const g = pick("growth");
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  return {
    activity: {
      isVisible: a.isVisible !== false,
      eyebrow: str(a.eyebrow, DEFAULT_HERO_PUBLIC.heroCards.activity.eyebrow),
      title: str(a.title, DEFAULT_HERO_PUBLIC.heroCards.activity.title),
    },
    techStack: {
      isVisible: t.isVisible !== false,
      eyebrow: str(t.eyebrow, DEFAULT_HERO_PUBLIC.heroCards.techStack.eyebrow),
      title: str(t.title, DEFAULT_HERO_PUBLIC.heroCards.techStack.title),
    },
    growth: {
      isVisible: g.isVisible !== false,
      eyebrow: str(g.eyebrow, DEFAULT_HERO_PUBLIC.heroCards.growth.eyebrow),
    },
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

/* Single source of truth for the section icon whitelist — same set powers
   the Process Steps and Cellules dropdowns and the runtime icon map. */
const STEP_ICONS = SECTION_ICON_KEYS;

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
      const isVisible = o.isVisible !== false;
      return { heading, links, isVisible };
    })
    .filter(
      (c): c is { heading: string; links: FooterNavItem[]; isVisible: boolean } =>
        Boolean(c),
    );

  const socialsRaw = Array.isArray(raw.socials)
    ? raw.socials
    : Array.isArray(raw.socialLinks)
      ? raw.socialLinks
      : [];
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

  const socialHeading =
    typeof raw.socialHeading === "string" && raw.socialHeading.trim()
      ? raw.socialHeading.trim()
      : DEFAULT_FOOTER_CONFIG.socialHeading ?? "Social";

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
    isVisible: raw.isVisible !== false,
    showBrandColumn: raw.showBrandColumn !== false,
    showSocialColumn: raw.showSocialColumn !== false,
    socialHeading,
    showBottomBar: raw.showBottomBar !== false,
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
