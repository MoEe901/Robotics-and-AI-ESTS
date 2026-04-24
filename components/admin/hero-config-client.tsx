"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { DEFAULT_HERO_CONFIG } from "@/lib/firebase/types";
import {
  HERO_STAT_ANIMATES,
  HERO_STAT_COLORS,
  HERO_STAT_EMPHASES,
  HERO_STAT_FORMATS,
  HERO_STAT_SIZES,
  HERO_STAT_SOURCES,
  normalizeHeroStatSource,
  type HeroStatAnimate,
  type HeroStatColor,
  type HeroStatEmphasis,
  type HeroStatFormat,
  type HeroStatSize,
  type HeroStatSource,
  type HeroStatsStripAlignment,
  type HeroStatsStripBackground,
  type HeroStatsStripLayout,
  type HeroStatsStripSeparator,
} from "@/lib/content/site-content-parser";
import { HeroStatTile } from "@/components/hero/hero-stats-strip";

type HeroFields = {
  eyebrow: string;
  headlinePrefix: string;
  headlineAccent: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaSecondaryText: string;
  ctaSecondaryHref: string;
};

type BgMediaFields = {
  type: "video" | "image" | "none";
  videoUrl: string;
  videoPosterUrl: string;
  imageUrl: string;
  loop: boolean;
  muted: boolean;
  autoplay: boolean;
};

type MaskFields = {
  enabled: boolean;
  opacity: number;
  color: string;
  gradient: "none" | "radial" | "linear-bottom" | "linear-top";
};

type DatashowFields = {
  enabled: boolean;
  imageUrl: string;
  caption: string;
  position: "center" | "left" | "right";
};
type StatTile = {
  id: string;
  label: string;
  labelSingular: string;
  source: HeroStatSource;
  manualValue: string;
  prefix: string;
  suffix: string;
  color: HeroStatColor;
  size: HeroStatSize;
  emphasis: HeroStatEmphasis;
  format: HeroStatFormat;
  animate: HeroStatAnimate;
  href: string;
  order: number;
  isVisible: boolean;
};
type StatsStripFields = {
  isVisible: boolean;
  layout: HeroStatsStripLayout;
  separator: HeroStatsStripSeparator;
  alignment: HeroStatsStripAlignment;
  background: HeroStatsStripBackground;
  animateOnScroll: boolean;
};
type TechItem = { id: string; label: string; accent: "violet" | "cyan" | "mixed"; order: number; isVisible: boolean };
type GrowthFields = { title: string; metric: "newMembers"; months: 3 | 6 | 12 };

const DEFAULT_BG: BgMediaFields = { type: "none", videoUrl: "", videoPosterUrl: "", imageUrl: "", loop: true, muted: true, autoplay: true };
const DEFAULT_MASK: MaskFields = { enabled: false, opacity: 0.6, color: "#07080f", gradient: "none" };
const DEFAULT_DATASHOW: DatashowFields = { enabled: false, imageUrl: "", caption: "", position: "center" };
const DEFAULT_STAT_TILES: StatTile[] = [
  { id: "members", label: "Members", labelSingular: "Member", source: "members-live", manualValue: "200", prefix: "", suffix: "", color: "violet", size: "md", emphasis: "number", format: "plain", animate: "none", href: "", order: 0, isVisible: true },
  { id: "cellules", label: "Cellules", labelSingular: "Cellule", source: "cellules-live", manualValue: "6", prefix: "", suffix: "", color: "cyan", size: "md", emphasis: "number", format: "plain", animate: "none", href: "", order: 1, isVisible: true },
  { id: "events", label: "Events", labelSingular: "Event", source: "events-live", manualValue: "0", prefix: "", suffix: "", color: "emerald", size: "md", emphasis: "number", format: "plain", animate: "none", href: "", order: 2, isVisible: true },
  { id: "projects", label: "Projects", labelSingular: "Project", source: "projects", manualValue: "14", prefix: "", suffix: "", color: "fuchsia", size: "md", emphasis: "number", format: "plain", animate: "none", href: "", order: 3, isVisible: true },
  { id: "awards", label: "Awards", labelSingular: "Award", source: "awards", manualValue: "8", prefix: "", suffix: "", color: "amber", size: "md", emphasis: "number", format: "plain", animate: "none", href: "", order: 4, isVisible: true },
];
const DEFAULT_STATS_STRIP: StatsStripFields = {
  isVisible: true,
  layout: "row",
  separator: "line",
  alignment: "center",
  background: "transparent",
  animateOnScroll: true,
};
const DEFAULT_TECH: TechItem[] = [
  { id: "python", label: "Python", accent: "cyan", order: 0, isVisible: true },
  { id: "ros2", label: "ROS2", accent: "violet", order: 1, isVisible: true },
  { id: "arduino", label: "Arduino", accent: "mixed", order: 2, isVisible: true },
];
const DEFAULT_GROWTH: GrowthFields = { title: "Club stats", metric: "newMembers", months: 6 };

const URL_RE = /^https?:\/\/.+\..+/;

// Preview-only swatch colors. Uses the same palette tokens as the rendered tile
// but expressed as backgrounds for the admin color picker. No new CSS; standard
// Tailwind utilities only.
function colorSwatchClass(c: HeroStatColor): string {
  switch (c) {
    case "violet":
      return "bg-violet-500 border-violet-300/60";
    case "cyan":
      return "bg-cyan-400 border-cyan-200/60";
    case "emerald":
      return "bg-emerald-400 border-emerald-200/60";
    case "fuchsia":
      return "bg-fuchsia-400 border-fuchsia-200/60";
    case "amber":
      return "bg-amber-300 border-amber-100/60";
    case "white":
      return "bg-white border-white/80";
    default:
      return "bg-white/60 border-white/20";
  }
}

// Pick a reasonable sample integer for a tile preview so admins can see how
// formatting / count-up behave without real data. Manual sources echo their
// configured value; derived sources get a plausible placeholder number.
function sampleNumericForSource(src: HeroStatSource, manualValue: string, foundedYearStr: string): number | null {
  if (src === "manual" || src === "projects" || src === "awards") {
    const n = Number.parseInt(manualValue, 10);
    return Number.isFinite(n) ? n : 0;
  }
  if (src === "years-active") {
    const y = Number.parseInt(foundedYearStr, 10);
    if (Number.isFinite(y) && y >= 1900 && y <= 3000) {
      return Math.max(0, new Date().getFullYear() - y);
    }
    return null;
  }
  switch (src) {
    case "members-live":
      return 42;
    case "cellules-live":
      return 6;
    case "events-live":
      return 18;
    case "events-upcoming":
      return 3;
    case "events-past":
      return 15;
    case "partners-live":
      return 7;
    case "faq-live":
      return 12;
    case "team-alumni":
      return 24;
    default:
      return 0;
  }
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20";
  return (
    <label className="block text-sm">
      <span className="text-white/70">{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

export function HeroConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fields, setFields] = useState<HeroFields>({ ...DEFAULT_HERO_CONFIG });
  const [bgMedia, setBgMedia] = useState<BgMediaFields>({ ...DEFAULT_BG });
  const [mask, setMask] = useState<MaskFields>({ ...DEFAULT_MASK });
  const [datashow, setDatashow] = useState<DatashowFields>({ ...DEFAULT_DATASHOW });
  const [statTiles, setStatTiles] = useState<StatTile[]>([...DEFAULT_STAT_TILES]);
  const [roundDerivedTo, setRoundDerivedTo] = useState(1);
  const [statsStrip, setStatsStrip] = useState<StatsStripFields>({ ...DEFAULT_STATS_STRIP });
  const [foundedYear, setFoundedYear] = useState<string>("");
  const [techItems, setTechItems] = useState<TechItem[]>([...DEFAULT_TECH]);
  const [growth, setGrowth] = useState<GrowthFields>({ ...DEFAULT_GROWTH });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteContent", "hero"));
        if (!cancelled && snap.exists()) {
          const r = snap.data() as Record<string, unknown>;
          const str = (key: keyof HeroFields) =>
            typeof r[key] === "string" && (r[key] as string).trim()
              ? (r[key] as string).trim()
              : DEFAULT_HERO_CONFIG[key];
          setFields({
            eyebrow: str("eyebrow"),
            headlinePrefix: str("headlinePrefix"),
            headlineAccent: str("headlineAccent"),
            subtitle: str("subtitle"),
            ctaPrimaryText: str("ctaPrimaryText"),
            ctaPrimaryHref: str("ctaPrimaryHref"),
            ctaSecondaryText: str("ctaSecondaryText"),
            ctaSecondaryHref: str("ctaSecondaryHref"),
          });
          const bmRaw = r.backgroundMedia && typeof r.backgroundMedia === "object" ? r.backgroundMedia as Record<string,unknown> : {};
          const maskRaw = r.mask && typeof r.mask === "object" ? r.mask as Record<string,unknown> : {};
          const dsRaw = r.datashow && typeof r.datashow === "object" ? r.datashow as Record<string,unknown> : {};
          const bmType = bmRaw.type === "video" || bmRaw.type === "image" ? bmRaw.type : "none";
          setBgMedia({
            type: bmType as BgMediaFields["type"],
            videoUrl: typeof bmRaw.videoUrl === "string" ? bmRaw.videoUrl : "",
            videoPosterUrl: typeof bmRaw.videoPosterUrl === "string" ? bmRaw.videoPosterUrl : "",
            imageUrl: typeof bmRaw.imageUrl === "string" ? bmRaw.imageUrl : "",
            loop: bmRaw.loop !== false,
            muted: bmRaw.muted !== false,
            autoplay: bmRaw.autoplay !== false,
          });
          const maskGradient = maskRaw.gradient === "radial" || maskRaw.gradient === "linear-bottom" || maskRaw.gradient === "linear-top" ? maskRaw.gradient : "none";
          setMask({
            enabled: maskRaw.enabled === true,
            opacity: typeof maskRaw.opacity === "number" ? Math.min(1, Math.max(0, maskRaw.opacity)) : 0.6,
            color: typeof maskRaw.color === "string" && maskRaw.color.trim() ? maskRaw.color.trim() : "#07080f",
            gradient: maskGradient as MaskFields["gradient"],
          });
          const dsPos = dsRaw.position === "left" || dsRaw.position === "right" ? dsRaw.position : "center";
          setDatashow({
            enabled: dsRaw.enabled === true,
            imageUrl: typeof dsRaw.imageUrl === "string" ? dsRaw.imageUrl : "",
            caption: typeof dsRaw.caption === "string" ? dsRaw.caption : "",
            position: dsPos as DatashowFields["position"],
          });
          const statsRaw = r.stats && typeof r.stats === "object" ? (r.stats as Record<string, unknown>) : {};
          const pickEnum = <T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T =>
            typeof raw === "string" && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
          const parseTile = (row: unknown, idx: number): StatTile | null => {
            if (!row || typeof row !== "object") return null;
            const o = row as Record<string, unknown>;
            const source = normalizeHeroStatSource(o.source);
            const fallback = DEFAULT_STAT_TILES[idx] ?? DEFAULT_STAT_TILES[0];
            return {
              id: typeof o.id === "string" && o.id.trim() ? o.id.trim() : `tile-${idx}`,
              label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : "Stat",
              labelSingular: typeof o.labelSingular === "string" ? o.labelSingular : "",
              source,
              manualValue: typeof o.manualValue === "string"
                ? o.manualValue
                : typeof o.value === "string"
                  ? o.value
                  : "",
              prefix: typeof o.prefix === "string" ? o.prefix : "",
              suffix: typeof o.suffix === "string" ? o.suffix : "",
              color: pickEnum<HeroStatColor>(o.color, HERO_STAT_COLORS, fallback.color),
              size: pickEnum<HeroStatSize>(o.size, HERO_STAT_SIZES, fallback.size),
              emphasis: pickEnum<HeroStatEmphasis>(o.emphasis, HERO_STAT_EMPHASES, fallback.emphasis),
              format: pickEnum<HeroStatFormat>(o.format, HERO_STAT_FORMATS, fallback.format),
              animate: pickEnum<HeroStatAnimate>(o.animate, HERO_STAT_ANIMATES, fallback.animate),
              href: typeof o.href === "string" ? o.href : "",
              order: typeof o.order === "number" ? o.order : idx,
              isVisible: o.isVisible !== false,
            };
          };
          let loadedTiles: StatTile[] | null = null;
          if (Array.isArray(statsRaw.tiles)) {
            loadedTiles = (statsRaw.tiles as unknown[])
              .map((row, idx) => parseTile(row, idx))
              .filter((t): t is StatTile => Boolean(t))
              .sort((a, b) => a.order - b.order);
          } else if (statsRaw.members || statsRaw.cellules || statsRaw.projects || statsRaw.awards) {
            const legacyKeys: Array<"members" | "cellules" | "projects" | "awards"> = ["members", "cellules", "projects", "awards"];
            loadedTiles = legacyKeys.map((key, idx) => {
              const legacy = statsRaw[key] && typeof statsRaw[key] === "object" ? (statsRaw[key] as Record<string, unknown>) : null;
              const fallback = DEFAULT_STAT_TILES[idx];
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
          if (loadedTiles && loadedTiles.length) setStatTiles(loadedTiles);
          setRoundDerivedTo(
            typeof statsRaw.roundDerivedTo === "number" && [1, 5, 10, 25, 50, 100].includes(statsRaw.roundDerivedTo)
              ? statsRaw.roundDerivedTo
              : 1,
          );
          const stripRaw = r.statsStrip && typeof r.statsStrip === "object" ? (r.statsStrip as Record<string, unknown>) : {};
          setStatsStrip({
            isVisible: stripRaw.isVisible !== false,
            layout: pickEnum<HeroStatsStripLayout>(stripRaw.layout, ["row", "grid-2", "grid-4"], DEFAULT_STATS_STRIP.layout),
            separator: pickEnum<HeroStatsStripSeparator>(stripRaw.separator, ["line", "dot", "none"], DEFAULT_STATS_STRIP.separator),
            alignment: pickEnum<HeroStatsStripAlignment>(stripRaw.alignment, ["left", "center", "right"], DEFAULT_STATS_STRIP.alignment),
            background: pickEnum<HeroStatsStripBackground>(stripRaw.background, ["transparent", "panel", "glow"], DEFAULT_STATS_STRIP.background),
            animateOnScroll: stripRaw.animateOnScroll !== false,
          });
          const fyRaw = r.foundedYear;
          const fyNum = typeof fyRaw === "number" && Number.isFinite(fyRaw)
            ? Math.floor(fyRaw)
            : typeof fyRaw === "string" && fyRaw.trim()
              ? Number.parseInt(fyRaw.trim(), 10)
              : NaN;
          setFoundedYear(Number.isFinite(fyNum) && fyNum >= 1900 && fyNum <= 3000 ? String(fyNum) : "");
          const rawTech = Array.isArray(r.techStack)
            ? r.techStack
            : r.techStack && typeof r.techStack === "object" && Array.isArray((r.techStack as Record<string, unknown>).items)
              ? ((r.techStack as Record<string, unknown>).items as unknown[])
              : [];
          const parsedTech = rawTech
            .map((row, i) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const label = typeof o.label === "string" ? o.label.trim() : "";
              if (!label) return null;
              const accent = o.accent === "violet" || o.accent === "cyan" ? o.accent : "mixed";
              return { id: typeof o.id === "string" ? o.id : `tech-${i}`, label, accent, order: typeof o.order === "number" ? o.order : i, isVisible: o.isVisible !== false } as TechItem;
            })
            .filter((x): x is TechItem => Boolean(x));
          if (parsedTech.length) setTechItems(parsedTech.sort((a, b) => a.order - b.order));
          const growthRaw = r.growth && typeof r.growth === "object" ? (r.growth as Record<string, unknown>) : {};
          setGrowth({
            title: typeof growthRaw.title === "string" && growthRaw.title.trim() ? growthRaw.title.trim() : DEFAULT_GROWTH.title,
            metric: "newMembers",
            months: growthRaw.months === 3 || growthRaw.months === 12 ? growthRaw.months : 6,
          });
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load hero config.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (key: keyof HeroFields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  async function save() {
    const required: Array<keyof HeroFields> = ["headlineAccent", "subtitle", "ctaPrimaryText", "ctaSecondaryText"];
    for (const k of required) {
      if (!fields[k].trim()) {
        setError(`"${k}" must not be empty.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setDoc(
        doc(db(), "siteContent", "hero"),
        {
          eyebrow: fields.eyebrow.trim() || DEFAULT_HERO_CONFIG.eyebrow,
          description: fields.subtitle.trim(),
          primaryCta: {
            label: fields.ctaPrimaryText.trim() || DEFAULT_HERO_CONFIG.ctaPrimaryText,
            href: fields.ctaPrimaryHref.trim() || DEFAULT_HERO_CONFIG.ctaPrimaryHref,
          },
          secondaryCta: {
            label: fields.ctaSecondaryText.trim() || DEFAULT_HERO_CONFIG.ctaSecondaryText,
            href: fields.ctaSecondaryHref.trim() || DEFAULT_HERO_CONFIG.ctaSecondaryHref,
          },
          headlinePrefix: fields.headlinePrefix.trim() || DEFAULT_HERO_CONFIG.headlinePrefix,
          headlineAccent: fields.headlineAccent.trim(),
          subtitle: fields.subtitle.trim(),
          ctaPrimaryText: fields.ctaPrimaryText.trim(),
          ctaSecondaryText: fields.ctaSecondaryText.trim(),
          backgroundMedia: {
            type: bgMedia.type,
            videoUrl: bgMedia.videoUrl.trim() || null,
            videoPosterUrl: bgMedia.videoPosterUrl.trim() || null,
            imageUrl: bgMedia.imageUrl.trim() || null,
            loop: bgMedia.loop,
            muted: bgMedia.muted,
            autoplay: bgMedia.autoplay,
          },
          mask: {
            enabled: mask.enabled,
            opacity: mask.opacity,
            color: mask.color.trim() || "#07080f",
            gradient: mask.gradient,
          },
          datashow: {
            enabled: datashow.enabled,
            imageUrl: datashow.imageUrl.trim() || null,
            caption: datashow.caption.trim(),
            position: datashow.position,
          },
          stats: {
            tiles: statTiles.map((tile, index) => ({
              id: tile.id,
              label: tile.label,
              labelSingular: tile.labelSingular.trim() ? tile.labelSingular.trim() : null,
              source: tile.source,
              manualValue: tile.manualValue,
              prefix: tile.prefix,
              suffix: tile.suffix,
              color: tile.color,
              size: tile.size,
              emphasis: tile.emphasis,
              format: tile.format,
              animate: tile.animate,
              href: tile.href.trim() ? tile.href.trim() : null,
              order: index,
              isVisible: tile.isVisible,
            })),
            roundDerivedTo,
          },
          statsStrip: {
            isVisible: statsStrip.isVisible,
            layout: statsStrip.layout,
            separator: statsStrip.separator,
            alignment: statsStrip.alignment,
            background: statsStrip.background,
            animateOnScroll: statsStrip.animateOnScroll,
          },
          foundedYear: (() => {
            const n = Number.parseInt(foundedYear.trim(), 10);
            return Number.isFinite(n) && n >= 1900 && n <= 3000 ? n : null;
          })(),
          techStack: {
            items: techItems.map((item, index) => ({ ...item, order: index })),
          },
          growth,
        },
        { merge: true },
      );
      setSuccess("Hero section saved. Changes appear on the homepage immediately.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="px-6 py-12 text-sm text-white/55">Loading hero config…</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Hero Section</h1>
      <p className="mt-2 text-sm text-white/55">
        Edit the homepage hero headline, subtitle, and call-to-action buttons. Changes take effect immediately.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Eyebrow & Headline</p>
            <TextField label="Eyebrow text" value={fields.eyebrow} onChange={set("eyebrow")} placeholder="University Tech Community · EST Safi" />
            <TextField label="Headline — prefix" value={fields.headlinePrefix} onChange={set("headlinePrefix")} placeholder="Welcome to the" />
            <TextField label="Headline — gradient accent *" value={fields.headlineAccent} onChange={set("headlineAccent")} placeholder="Robotics & AI Club" />
            <TextField label="Subtitle *" value={fields.subtitle} onChange={set("subtitle")} placeholder="A community of innovators…" multiline />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">CTA Buttons</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Primary button text *" value={fields.ctaPrimaryText} onChange={set("ctaPrimaryText")} placeholder="Join the Club" />
              <TextField label="Primary button link" value={fields.ctaPrimaryHref} onChange={set("ctaPrimaryHref")} placeholder="/#apply" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Secondary button text *" value={fields.ctaSecondaryText} onChange={set("ctaSecondaryText")} placeholder="Explore Events" />
              <TextField label="Secondary button link" value={fields.ctaSecondaryHref} onChange={set("ctaSecondaryHref")} placeholder="/#events" />
            </div>
          </div>

          {/* Background media */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Background media</p>
            <label className="block text-sm">
              <span className="text-white/70">Type</span>
              <select value={bgMedia.type} onChange={(e) => setBgMedia((p) => ({ ...p, type: e.target.value as BgMediaFields["type"] }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                <option value="none">None</option>
                <option value="video">Video</option>
                <option value="image">Image</option>
              </select>
            </label>
            {bgMedia.type === "video" && (
              <>
                <TextField label="Video URL" value={bgMedia.videoUrl} onChange={(v) => setBgMedia((p) => ({ ...p, videoUrl: v }))} placeholder="https://…/video.mp4" />
                {bgMedia.videoUrl && URL_RE.test(bgMedia.videoUrl) && (
                  <video src={bgMedia.videoUrl} className="mt-1 max-h-24 w-full rounded object-cover opacity-70" muted playsInline preload="metadata" />
                )}
                <TextField label="Poster URL (optional)" value={bgMedia.videoPosterUrl} onChange={(v) => setBgMedia((p) => ({ ...p, videoPosterUrl: v }))} placeholder="https://…/poster.jpg" />
                <div className="flex gap-4 text-sm text-white/70">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={bgMedia.loop} onChange={(e) => setBgMedia((p) => ({ ...p, loop: e.target.checked }))} /> Loop</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={bgMedia.muted} onChange={(e) => setBgMedia((p) => ({ ...p, muted: e.target.checked }))} /> Muted</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={bgMedia.autoplay} onChange={(e) => setBgMedia((p) => ({ ...p, autoplay: e.target.checked }))} /> Autoplay</label>
                </div>
              </>
            )}
            {bgMedia.type === "image" && (
              <>
                <TextField label="Image URL" value={bgMedia.imageUrl} onChange={(v) => setBgMedia((p) => ({ ...p, imageUrl: v }))} placeholder="https://…/image.jpg" />
                {bgMedia.imageUrl && URL_RE.test(bgMedia.imageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bgMedia.imageUrl} alt="" className="mt-1 max-h-24 w-full rounded object-cover opacity-70" />
                )}
              </>
            )}
          </div>

          {/* Mask overlay */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Mask overlay</p>
              <label className="flex items-center gap-1.5 text-xs text-white/70"><input type="checkbox" checked={mask.enabled} onChange={(e) => setMask((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label>
            </div>
            {mask.enabled && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-white/70">Color</span>
                    <input type="color" value={mask.color} onChange={(e) => setMask((p) => ({ ...p, color: e.target.value }))} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-white/15 bg-black/30 px-1" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-white/70">Opacity ({Math.round(mask.opacity * 100)}%)</span>
                    <input type="range" min={0} max={1} step={0.05} value={mask.opacity} onChange={(e) => setMask((p) => ({ ...p, opacity: parseFloat(e.target.value) }))} className="mt-2 w-full" />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-white/70">Gradient</span>
                  <select value={mask.gradient} onChange={(e) => setMask((p) => ({ ...p, gradient: e.target.value as MaskFields["gradient"] }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                    <option value="none">Solid</option>
                    <option value="radial">Radial (center clear)</option>
                    <option value="linear-bottom">Linear — dark at bottom</option>
                    <option value="linear-top">Linear — dark at top</option>
                  </select>
                </label>
              </>
            )}
          </div>

          {/* Datashow overlay */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Datashow overlay</p>
              <label className="flex items-center gap-1.5 text-xs text-white/70"><input type="checkbox" checked={datashow.enabled} onChange={(e) => setDatashow((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label>
            </div>
            {datashow.enabled && (
              <>
                <TextField label="Image URL" value={datashow.imageUrl} onChange={(v) => setDatashow((p) => ({ ...p, imageUrl: v }))} placeholder="https://…/datashow.png" />
                {datashow.imageUrl && URL_RE.test(datashow.imageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={datashow.imageUrl} alt="" className="mt-1 max-h-24 w-full rounded object-contain opacity-70" />
                )}
                <TextField label="Caption (optional)" value={datashow.caption} onChange={(v) => setDatashow((p) => ({ ...p, caption: v }))} placeholder="Caption text…" />
                <label className="block text-sm">
                  <span className="text-white/70">Position</span>
                  <select value={datashow.position} onChange={(e) => setDatashow((p) => ({ ...p, position: e.target.value as DatashowFields["position"] }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                    <option value="center">Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </>
            )}
          </div>

          {/* Strip-wide settings */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Stats strip</p>
              <label className="flex items-center gap-1.5 text-xs text-white/80">
                <input type="checkbox" checked={statsStrip.isVisible} onChange={(e) => setStatsStrip((p) => ({ ...p, isVisible: e.target.checked }))} />
                Visible on homepage
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-white/70">Layout</span>
                <select value={statsStrip.layout} onChange={(e) => setStatsStrip((p) => ({ ...p, layout: e.target.value as HeroStatsStripLayout }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                  <option value="row">Row (wraps on mobile)</option>
                  <option value="grid-2">Grid 2×2</option>
                  <option value="grid-4">Grid 4 cols (scrolls if narrow)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Alignment</span>
                <select value={statsStrip.alignment} onChange={(e) => setStatsStrip((p) => ({ ...p, alignment: e.target.value as HeroStatsStripAlignment }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Separator</span>
                <select value={statsStrip.separator} onChange={(e) => setStatsStrip((p) => ({ ...p, separator: e.target.value as HeroStatsStripSeparator }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                  <option value="line">Line</option>
                  <option value="dot">Dot</option>
                  <option value="none">None</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Background</span>
                <select value={statsStrip.background} onChange={(e) => setStatsStrip((p) => ({ ...p, background: e.target.value as HeroStatsStripBackground }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                  <option value="transparent">Transparent</option>
                  <option value="panel">Panel (dark glass)</option>
                  <option value="glow">Glow (violet/cyan radial)</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-white/75">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={statsStrip.animateOnScroll} onChange={(e) => setStatsStrip((p) => ({ ...p, animateOnScroll: e.target.checked }))} />
                Animate on scroll (count-up master switch)
              </label>
            </div>
          </div>

          {/* Tiles */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Stats tiles</p>
              <button
                type="button"
                onClick={() => setStatTiles((p) => [...p, { id: `tile-${Date.now()}`, label: "New stat", labelSingular: "", source: "manual", manualValue: "0", prefix: "", suffix: "", color: "white", size: "md", emphasis: "number", format: "plain", animate: "none", href: "", order: p.length, isVisible: true }])}
                className="rounded border border-white/20 px-2 py-1 text-xs text-white/80"
              >
                + Add tile
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-white/70">Round derived values down to nearest</span>
                <select value={roundDerivedTo} onChange={(e) => setRoundDerivedTo(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                  {[1, 5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n === 1 ? "No rounding (1)" : n}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Club founded year (for &ldquo;years-active&rdquo; tiles)</span>
                <input
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="e.g. 2018"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>

            {statTiles.length === 0 ? (
              <p className="text-sm text-white/50">No tiles yet. Click &quot;+ Add tile&quot; to create one.</p>
            ) : null}

            {statTiles.map((tile, i) => {
              const yearsActiveDisabled = tile.source === "years-active" && !foundedYear;
              const manualDisabled = tile.source !== "manual" && tile.source !== "projects" && tile.source !== "awards";
              const previewNumeric = sampleNumericForSource(tile.source, tile.manualValue, foundedYear);
              return (
                <div key={tile.id} className="rounded-xl border border-white/10 p-3 space-y-3">
                  {/* Row 1: controls bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button type="button" disabled={i === 0} onClick={() => setStatTiles((p) => { const n = [...p]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="rounded border border-white/20 px-2 py-1 disabled:opacity-30">↑</button>
                    <button type="button" disabled={i === statTiles.length - 1} onClick={() => setStatTiles((p) => { const n = [...p]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} className="rounded border border-white/20 px-2 py-1 disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => setStatTiles((p) => p.filter((x) => x.id !== tile.id))} className="rounded border border-red-400/30 px-2 py-1 text-red-200">✕</button>
                    <label className="ml-auto flex items-center gap-1.5 text-white/75">
                      <input type="checkbox" checked={tile.isVisible} onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, isVisible: e.target.checked } : x))} />
                      Visible
                    </label>
                  </div>

                  {/* Row 2: label + singular */}
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      value={tile.label}
                      onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, label: e.target.value } : x))}
                      placeholder="Label (plural)"
                      className="col-span-6 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                    />
                    <input
                      value={tile.labelSingular}
                      onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, labelSingular: e.target.value } : x))}
                      placeholder="Singular (optional, used when count = 1)"
                      className="col-span-6 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                    />
                  </div>

                  {/* Row 3: source + manual value */}
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={tile.source}
                      onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, source: e.target.value as HeroStatSource } : x))}
                      className="col-span-7 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                      title={yearsActiveDisabled ? "Set club founded year first" : undefined}
                    >
                      {HERO_STAT_SOURCES.map((s) => {
                        const disabled = s.value === "years-active" && !foundedYear;
                        return (
                          <option key={s.value} value={s.value} disabled={disabled}>
                            {s.label}{disabled ? " — set founded year first" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      value={tile.manualValue}
                      onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, manualValue: e.target.value } : x))}
                      placeholder={manualDisabled ? "Fallback while data loads" : "Value"}
                      className="col-span-5 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white disabled:opacity-50"
                      disabled={false}
                    />
                  </div>

                  {/* Row 4: prefix + suffix */}
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      value={tile.prefix}
                      onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, prefix: e.target.value } : x))}
                      placeholder='Prefix (e.g. "+", "€", "~")'
                      className="col-span-6 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                    />
                    <input
                      value={tile.suffix}
                      onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, suffix: e.target.value } : x))}
                      placeholder='Suffix (e.g. "+", "K", "%")'
                      className="col-span-6 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                    />
                  </div>

                  {/* Row 5: color swatches + size tabs */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/60">Color</span>
                      {HERO_STAT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          title={c}
                          aria-label={`Color ${c}`}
                          onClick={() => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, color: c } : x))}
                          className={`size-5 rounded-full border transition ${tile.color === c ? "ring-2 ring-white/70" : "ring-0"} ${colorSwatchClass(c)}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/60">Size</span>
                      {HERO_STAT_SIZES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, size: s } : x))}
                          className={`rounded border px-2 py-0.5 text-xs ${tile.size === s ? "border-white/60 bg-white/10 text-white" : "border-white/15 text-white/70"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/60">Emphasis</span>
                      {HERO_STAT_EMPHASES.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, emphasis: e } : x))}
                          className={`rounded border px-2 py-0.5 text-xs ${tile.emphasis === e ? "border-white/60 bg-white/10 text-white" : "border-white/15 text-white/70"}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 6: format + animate + link */}
                  <div className="grid grid-cols-12 gap-2">
                    <label className="col-span-4 block text-xs text-white/70">
                      Format
                      <select value={tile.format} onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, format: e.target.value as HeroStatFormat } : x))} className="mt-0.5 w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white">
                        <option value="plain">plain (14)</option>
                        <option value="compact">compact (1.2K)</option>
                        <option value="padded">padded (014)</option>
                      </select>
                    </label>
                    <label className="col-span-4 block text-xs text-white/70">
                      Animate
                      <select value={tile.animate} onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, animate: e.target.value as HeroStatAnimate } : x))} className="mt-0.5 w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white">
                        <option value="none">none</option>
                        <option value="count-up">count-up</option>
                        <option value="pulse">pulse</option>
                      </select>
                    </label>
                    <label className="col-span-4 block text-xs text-white/70">
                      Link URL (optional)
                      <input
                        value={tile.href}
                        onChange={(e) => setStatTiles((p) => p.map((x) => x.id === tile.id ? { ...x, href: e.target.value } : x))}
                        placeholder="/members or https://…"
                        className="mt-0.5 w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                      />
                    </label>
                  </div>

                  {/* Live preview — same component the homepage uses */}
                  <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Preview</p>
                    <div className="flex items-center justify-center">
                      <HeroStatTile
                        tile={{
                          id: tile.id,
                          label: tile.label || "Stat",
                          labelSingular: tile.labelSingular.trim() || null,
                          source: tile.source,
                          manualValue: tile.manualValue,
                          prefix: tile.prefix,
                          suffix: tile.suffix,
                          color: tile.color,
                          size: tile.size,
                          emphasis: tile.emphasis,
                          format: tile.format,
                          animate: tile.animate,
                          href: tile.href.trim() ? tile.href.trim() : null,
                          order: i,
                          isVisible: tile.isVisible,
                        }}
                        numeric={previewNumeric}
                        animateEnabled={statsStrip.animateOnScroll}
                        alignment={statsStrip.alignment}
                        className="px-2 py-3"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Tech stack pills</p>
              <button type="button" onClick={() => setTechItems((p) => [...p, { id: `tech-${Date.now()}`, label: "", accent: "mixed", order: p.length, isVisible: true }])} className="rounded border border-white/20 px-2 py-1 text-xs text-white/80">Add</button>
            </div>
            {techItems.map((item, i) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <input value={item.label} onChange={(e) => setTechItems((p) => p.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x))} className="col-span-5 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white" placeholder="Label" />
                <select value={item.accent} onChange={(e) => setTechItems((p) => p.map((x) => x.id === item.id ? { ...x, accent: e.target.value as TechItem["accent"] } : x))} className="col-span-3 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm text-white">
                  <option value="violet">violet</option><option value="cyan">cyan</option><option value="mixed">mixed</option>
                </select>
                <label className="col-span-2 flex items-center gap-1 text-xs text-white/75"><input type="checkbox" checked={item.isVisible} onChange={(e) => setTechItems((p) => p.map((x) => x.id === item.id ? { ...x, isVisible: e.target.checked } : x))} />Show</label>
                <button type="button" onClick={() => setTechItems((p) => p.filter((x) => x.id !== item.id))} className="col-span-2 rounded border border-red-400/30 px-2 py-1 text-xs text-red-200">Delete</button>
                <div className="col-span-12 flex gap-2">
                  <button type="button" disabled={i === 0} onClick={() => setTechItems((p) => { const n = [...p]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="rounded border border-white/20 px-2 py-1 text-xs text-white/70 disabled:opacity-30">Up</button>
                  <button type="button" disabled={i === techItems.length - 1} onClick={() => setTechItems((p) => { const n = [...p]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} className="rounded border border-white/20 px-2 py-1 text-xs text-white/70 disabled:opacity-30">Down</button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Growth chart</p>
            <TextField label="Title" value={growth.title} onChange={(v) => setGrowth((p) => ({ ...p, title: v }))} />
            <label className="block text-sm">
              <span className="text-white/70">Months</span>
              <select value={growth.months} onChange={(e) => setGrowth((p) => ({ ...p, months: Number(e.target.value) as 3 | 6 | 12 }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                <option value={3}>3</option><option value={6}>6</option><option value={12}>12</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Metric</span>
              <select defaultValue="newMembers" className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
                <option value="newMembers">newMembers</option>
                <option disabled>applications (Coming soon)</option>
                <option disabled>events (Coming soon)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">Preview</p>
          <div className="space-y-3 rounded-xl border border-white/8 bg-black/20 p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/45">
              {fields.eyebrow || "—"}
            </p>
            <p className="text-xl font-semibold leading-tight text-white">
              {fields.headlinePrefix}{" "}
              <span className="bg-gradient-to-r from-blue-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                {fields.headlineAccent || "Club Name"}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-white/60">{fields.subtitle || "—"}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
                {fields.ctaPrimaryText || "Primary CTA"}
              </span>
              <span className="rounded-full border border-white/25 bg-white/8 px-3 py-1 text-xs font-semibold text-white">
                {fields.ctaSecondaryText || "Secondary CTA"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save hero section"}
        </button>
        <button
          type="button"
          onClick={() => setFields({ ...DEFAULT_HERO_CONFIG })}
          className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
