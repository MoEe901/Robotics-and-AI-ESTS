"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import type { ReactNode } from "react";

import { useCountUp } from "@/lib/hooks/use-count-up";
import {
  type HeroStatColor,
  type HeroStatFormat,
  type HeroStatSize,
  type HeroStatsStripAlignment,
  type HeroStatsStripBackground,
  type HeroStatsStripLayout,
  type HeroStatsStripSeparator,
  type PublicHeroContent,
} from "@/lib/content/site-content-parser";
import { formatCompact, formatPadded, formatPlain } from "@/lib/number-format";
import { cn } from "@/lib/utils";

export type HeroStatTileConfig = PublicHeroContent["stats"]["tiles"][number];
export type HeroStatsStripConfig = PublicHeroContent["statsStrip"];

/**
 * Counts available to the strip. Parent owns the listeners — the strip never
 * creates new ones. Each count is optional: when missing, the tile falls back
 * to its `manualValue`.
 */
export type HeroStatsCounts = {
  membersLive?: number;
  cellulesLive?: number;
  eventsLive?: number;
  eventsUpcoming?: number;
  eventsPast?: number;
  partnersLive?: number;
  faqLive?: number;
  teamAlumni?: number;
};

// ── Palette-restricted color map. Uses existing Tailwind tokens only.
const COLOR_CLASS: Record<HeroStatColor, string> = {
  violet: "text-violet-500",
  cyan: "text-cyan-400",
  emerald: "text-emerald-400",
  fuchsia: "text-fuchsia-400",
  amber: "text-amber-300",
  white: "text-white",
};

// ── Per-size font styles. `md` keeps the existing hero strip clamp so nothing
// shifts visually for the default tiles. `sm` / `lg` use standard Tailwind
// steps to avoid introducing new arbitrary values.
const NUMBER_SIZE: Record<HeroStatSize, string> = {
  sm: "text-xl sm:text-2xl font-bold",
  md: "text-[clamp(1.65rem,8vw,2.8rem)] font-extrabold",
  lg: "text-4xl sm:text-6xl font-extrabold",
};

const LABEL_SIZE_NUMBER_EMPHASIS: Record<HeroStatSize, string> = {
  sm: "text-[9px] sm:text-[10px]",
  md: "text-[10px] sm:text-[11px]",
  lg: "text-[11px] sm:text-xs",
};

const LABEL_SIZE_LABEL_EMPHASIS: Record<HeroStatSize, string> = {
  sm: "text-sm sm:text-base",
  md: "text-lg sm:text-xl",
  lg: "text-2xl sm:text-3xl",
};

const NUMBER_SIZE_LABEL_EMPHASIS: Record<HeroStatSize, string> = {
  sm: "text-sm font-semibold",
  md: "text-base sm:text-lg font-semibold",
  lg: "text-lg sm:text-xl font-semibold",
};

const NUMBER_SIZE_BALANCED: Record<HeroStatSize, string> = {
  sm: "text-lg font-semibold",
  md: "text-xl sm:text-2xl font-semibold",
  lg: "text-2xl sm:text-3xl font-bold",
};

const LABEL_SIZE_BALANCED: Record<HeroStatSize, string> = {
  sm: "text-lg font-medium",
  md: "text-xl sm:text-2xl font-medium",
  lg: "text-2xl sm:text-3xl font-medium",
};

/**
 * Format a resolved numeric value according to the tile's `format`.
 * For non-numeric fallbacks (e.g. string manualValue that doesn't parse),
 * callers should render the raw string directly and skip this formatter.
 */
function formatTileValue(n: number, mode: HeroStatFormat): string {
  switch (mode) {
    case "compact":
      return formatCompact(n);
    case "padded":
      return formatPadded(n);
    case "plain":
    default:
      return formatPlain(n);
  }
}

type HeroStatTileProps = {
  tile: HeroStatTileConfig;
  /** Numeric value when resolvable; null falls back to manualValue. */
  numeric: number | null;
  /** Whether this tile is eligible for count-up animation (strip-wide master switch + tile setting). */
  animateEnabled: boolean;
  /** Horizontal alignment inherited from strip. */
  alignment?: HeroStatsStripAlignment;
  /** Optional className to layer with container styles (padding, border, etc). */
  className?: string;
};

/**
 * Renders a single stats tile exactly as it appears on the homepage.
 * Safe to import in the admin for the live per-tile preview.
 */
export function HeroStatTile({ tile, numeric, animateEnabled, alignment = "center", className }: HeroStatTileProps) {
  const hasNumeric = typeof numeric === "number" && Number.isFinite(numeric);
  const rawText = hasNumeric ? formatTileValue(numeric as number, tile.format) : tile.manualValue;
  const label = hasNumeric && numeric === 1 && tile.labelSingular ? tile.labelSingular : tile.label;

  const shouldCountUp =
    animateEnabled && tile.animate === "count-up" && hasNumeric && tile.format !== "padded";

  const { value: animatedValue, ref: countUpRef } = useCountUp<HTMLSpanElement>(
    hasNumeric ? (numeric as number) : 0,
    { enabled: shouldCountUp },
  );

  const displayText = shouldCountUp ? formatTileValue(animatedValue, tile.format) : rawText;
  const shouldPulse = animateEnabled && tile.animate === "pulse";

  const colorClass = COLOR_CLASS[tile.color];
  const alignClass =
    alignment === "left" ? "items-start text-left" : alignment === "right" ? "items-end text-right" : "items-center text-center";

  let numberClass: string;
  let labelClass: string;
  if (tile.emphasis === "label") {
    numberClass = NUMBER_SIZE_LABEL_EMPHASIS[tile.size];
    labelClass = LABEL_SIZE_LABEL_EMPHASIS[tile.size];
  } else if (tile.emphasis === "balanced") {
    numberClass = NUMBER_SIZE_BALANCED[tile.size];
    labelClass = LABEL_SIZE_BALANCED[tile.size];
  } else {
    numberClass = NUMBER_SIZE[tile.size];
    labelClass = LABEL_SIZE_NUMBER_EMPHASIS[tile.size];
  }

  const numberEl = (
    <span
      ref={countUpRef}
      className={cn("font-syne leading-none tabular-nums", numberClass, colorClass, shouldPulse && "animate-pulse")}
    >
      {tile.prefix ? <span aria-hidden>{tile.prefix}</span> : null}
      {displayText}
      {tile.suffix ? <span aria-hidden>{tile.suffix}</span> : null}
    </span>
  );

  const labelEl = (
    <span
      className={cn(
        "font-jetbrains font-medium uppercase tracking-[0.16em] text-slate-500 sm:tracking-[0.25em]",
        tile.emphasis === "label" ? "text-slate-300" : "",
        labelClass,
      )}
    >
      {label}
    </span>
  );

  // emphasis=label renders label above number; otherwise label below.
  const stack = tile.emphasis === "label"
    ? (
        <>
          {labelEl}
          {numberEl}
        </>
      )
    : (
        <>
          {numberEl}
          {labelEl}
        </>
      );

  const inner = (
    <div className={cn("flex flex-col gap-1", alignClass, className)}>{stack}</div>
  );

  if (tile.href) {
    return (
      <Link
        href={tile.href}
        className="group block rounded-md outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400/60"
        aria-label={`${tile.label}${hasNumeric ? `: ${rawText}` : ""}`}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

// ── Separator element between tiles (row layout only). Grid layouts rely on gap.
function Separator({ mode }: { mode: HeroStatsStripSeparator }) {
  if (mode === "none") return null;
  if (mode === "dot") {
    return (
      <span
        aria-hidden
        className="mx-1 flex h-1.5 w-1.5 shrink-0 self-center rounded-full bg-white/20"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="hidden shrink-0 self-stretch border-l border-violet-500/[0.08] sm:block"
    />
  );
}

type HeroStatsStripProps = {
  config: HeroStatsStripConfig;
  tiles: HeroStatTileConfig[];
  counts: HeroStatsCounts;
  /** Needed for the `years-active` source. */
  foundedYear?: number | null;
  /** Rounding helper for derived tiles (e.g. round to nearest 10). */
  roundDerivedTo?: number;
  /** Optional override for outer className (e.g. from parent wrapper animations). */
  className?: string;
};

/**
 * Full stats strip: reads `statsStrip` + `tiles` from hero content and renders
 * them with the configured layout / separator / alignment / background.
 * Consumes pre-computed counts from the parent so no new Firestore listeners
 * are added here.
 */
export function HeroStatsStrip({
  config,
  tiles,
  counts,
  foundedYear = null,
  roundDerivedTo = 1,
  className,
}: HeroStatsStripProps) {
  const visibleTiles = useMemo(
    () => tiles.filter((t) => t.isVisible).sort((a, b) => a.order - b.order),
    [tiles],
  );

  if (!config.isVisible) return null;
  if (visibleTiles.length === 0) return null;

  const resolve = (tile: HeroStatTileConfig): number | null => {
    const round = (n: number) => (roundDerivedTo > 1 ? Math.floor(n / roundDerivedTo) * roundDerivedTo : n);
    switch (tile.source) {
      case "manual":
      case "projects":
      case "awards": {
        const parsed = Number.parseInt(tile.manualValue, 10);
        return Number.isFinite(parsed) ? parsed : null;
      }
      case "members-live":
        return counts.membersLive != null ? round(counts.membersLive) : null;
      case "cellules-live":
        return counts.cellulesLive != null ? round(counts.cellulesLive) : null;
      case "events-live":
        return counts.eventsLive != null ? round(counts.eventsLive) : null;
      case "events-upcoming":
        return counts.eventsUpcoming != null ? round(counts.eventsUpcoming) : null;
      case "events-past":
        return counts.eventsPast != null ? round(counts.eventsPast) : null;
      case "partners-live":
        return counts.partnersLive != null ? round(counts.partnersLive) : null;
      case "faq-live":
        return counts.faqLive != null ? round(counts.faqLive) : null;
      case "team-alumni":
        return counts.teamAlumni != null ? round(counts.teamAlumni) : null;
      case "years-active": {
        if (!foundedYear) return null;
        const years = new Date().getFullYear() - foundedYear;
        return years >= 0 ? years : null;
      }
      default:
        return null;
    }
  };

  const layoutClass = layoutToClass(config.layout, visibleTiles.length);
  const backgroundClass = backgroundToClass(config.background);
  const alignWrapperClass =
    config.alignment === "left" ? "justify-start" : config.alignment === "right" ? "justify-end" : "justify-center";

  const isRow = config.layout === "row";
  const isGrid = !isRow;

  const tileNodes: ReactNode[] = visibleTiles.map((tile, idx) => {
    const numeric = resolve(tile);
    const isLast = idx === visibleTiles.length - 1;
    const tilePadding = isRow
      ? "px-3 py-7 sm:px-4 sm:py-10"
      : "px-3 py-5 sm:px-4 sm:py-6";
    const tileEl = (
      <HeroStatTile
        key={tile.id}
        tile={tile}
        numeric={numeric}
        animateEnabled={config.animateOnScroll}
        alignment={config.alignment}
        className={cn("min-w-0", tilePadding)}
      />
    );

    if (isRow) {
      return (
        <Fragment key={tile.id}>
          <div className="flex min-w-[50%] flex-1 justify-center sm:min-w-0">{tileEl}</div>
          {isLast ? null : <Separator mode={config.separator} />}
        </Fragment>
      );
    }
    return tileEl;
  });

  return (
    <div
      className={cn(
        "relative border-y border-violet-500/10",
        backgroundClass,
        className,
      )}
    >
      {/* Glow background — rendered as an absolutely-positioned layer so it
          never affects tile layout or spacing. */}
      {config.background === "glow" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-[1] opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 25% 50%, rgba(124,58,237,0.18) 0%, transparent 55%), radial-gradient(ellipse at 75% 50%, rgba(6,182,212,0.14) 0%, transparent 55%)",
          }}
        />
      ) : null}
      <div className={cn("flex w-full", alignWrapperClass)}>
        <div className={cn("w-full", isGrid ? "" : "flex", layoutClass)}>
          {tileNodes}
        </div>
      </div>
    </div>
  );
}

function layoutToClass(layout: HeroStatsStripLayout, _tileCount: number): string {
  void _tileCount;
  switch (layout) {
    case "grid-2":
      return "grid grid-cols-2 gap-2 sm:gap-4 p-2";
    case "grid-4":
      return "grid auto-cols-[minmax(25%,1fr)] grid-flow-col gap-2 overflow-x-auto p-2";
    case "row":
    default:
      return "flex flex-wrap sm:flex-nowrap";
  }
}

function backgroundToClass(bg: HeroStatsStripBackground): string {
  switch (bg) {
    case "panel":
      return "border-white/10 bg-slate-950/60 backdrop-blur-xl";
    case "glow":
      return "bg-violet-500/[0.02]";
    case "transparent":
    default:
      return "bg-violet-500/[0.02]";
  }
}
