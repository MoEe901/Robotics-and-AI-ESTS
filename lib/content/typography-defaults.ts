// ─── Font Registry ────────────────────────────────────────────────────────────

export type FontCategory = "display" | "sans" | "mono";

export type FontEntry = {
  id: string;
  label: string;
  /** CSS font-family value used in style injection. Pre-bundled fonts
   *  reference the next/font CSS variable so the browser never re-fetches. */
  cssFamily: string;
  /** Google Fonts CSS URL — only present for externally-loaded fonts. */
  googleFontUrl?: string;
  /** True when already loaded via next/font/google (no extra network request). */
  preloaded: boolean;
  category: FontCategory;
};

export const FONT_REGISTRY: readonly FontEntry[] = [
  // ── Pre-bundled via next/font (CSS vars always present on <html>) ──────────
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    cssFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
    preloaded: true,
    category: "display",
  },
  {
    id: "syne",
    label: "Syne",
    cssFamily: "var(--font-syne), 'Syne', sans-serif",
    preloaded: true,
    category: "sans",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    cssFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
    preloaded: true,
    category: "sans",
  },
  {
    id: "inter",
    label: "Inter",
    cssFamily: "var(--font-inter), 'Inter', sans-serif",
    preloaded: true,
    category: "sans",
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    cssFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
    preloaded: true,
    category: "mono",
  },
  // ── External — injected as <link rel="stylesheet"> on demand ─────────────
  {
    id: "orbitron",
    label: "Orbitron",
    cssFamily: "'Orbitron', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap",
    preloaded: false,
    category: "display",
  },
  {
    id: "rajdhani",
    label: "Rajdhani",
    cssFamily: "'Rajdhani', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap",
    preloaded: false,
    category: "display",
  },
  {
    id: "exo-2",
    label: "Exo 2",
    cssFamily: "'Exo 2', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700;800&display=swap",
    preloaded: false,
    category: "sans",
  },
  {
    id: "oswald",
    label: "Oswald",
    cssFamily: "'Oswald', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap",
    preloaded: false,
    category: "display",
  },
  {
    id: "share-tech-mono",
    label: "Share Tech Mono",
    cssFamily: "'Share Tech Mono', monospace",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap",
    preloaded: false,
    category: "mono",
  },
] as const;

// ─── Config Type ──────────────────────────────────────────────────────────────

export type CustomFontEntry = {
  id: string;
  label: string;
  /** Google Fonts CSS URL or a direct @font-face stylesheet URL. */
  url: string;
  /** CSS font-family string, e.g. "'Nunito', sans-serif" */
  family: string;
};

export type TypographyConfig = {
  /** Font id for hero gradient / accent lines (e.g. "ROBOTICS & AI"). */
  accentFont: string;
  /** Font id for hero structural lines (WELCOME TO THE / CLUB.) and section h2. */
  headingFont: string;
  /** cqi value for the hero title clamp() — valid range [4, 12]. */
  heroSize: number;
  /** rem lower-bound for the hero title clamp() — valid range [1, 2.5]. */
  heroMinRem: number;
  /** rem upper-bound for the hero title clamp() — valid range [6, 14]. */
  heroMaxRem: number;
  /** unitless line-height for the hero title — valid range [0.7, 1.5]. */
  lineHeightHero: number;
  /** vw value for section heading clamp() — valid range [2, 7]. */
  sectionHeadingSize: number;
  /** unitless line-height for section headings — valid range [0.9, 1.8]. */
  lineHeightSection: number;
  /** em value for accent-line letter-spacing — valid range [0, 0.2]. */
  letterSpacingAccent: number;
  /** Admin-defined custom fonts, available in addition to FONT_REGISTRY. */
  customFonts: CustomFontEntry[];
};

export const DEFAULT_TYPOGRAPHY_CONFIG: TypographyConfig = {
  accentFont: "bebas-neue",
  headingFont: "syne",
  heroSize: 7.2,
  heroMinRem: 1.4,
  heroMaxRem: 9,
  lineHeightHero: 0.9,
  sectionHeadingSize: 4,
  lineHeightSection: 1.05,
  letterSpacingAccent: 0.04,
  customFonts: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the FontEntry for the given id, falling back to Bebas Neue. */
export function resolveFontEntry(
  id: string,
  customFonts: CustomFontEntry[],
): FontEntry {
  const registered = FONT_REGISTRY.find((f) => f.id === id);
  if (registered) return { ...registered };

  const custom = customFonts.find((f) => f.id === id);
  if (custom) {
    return {
      id: custom.id,
      label: custom.label,
      cssFamily: custom.family,
      preloaded: false,
      googleFontUrl: custom.url,
      category: "display",
    };
  }
  return { ...(FONT_REGISTRY[0] as FontEntry) };
}

/** Clamp a number within inclusive bounds. */
export function clampValue(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Build the `:root { … }` CSS block that overrides typography variables. */
export function buildTypographyCss(config: TypographyConfig): string {
  const accent = resolveFontEntry(config.accentFont, config.customFonts);
  const heading = resolveFontEntry(config.headingFont, config.customFonts);
  const heroMin = clampValue(config.heroMinRem, 1, 2.5);
  const heroSize = clampValue(config.heroSize, 4, 12);
  const heroMax = clampValue(config.heroMaxRem, 6, 14);
  const lhHero = clampValue(config.lineHeightHero, 0.7, 1.5);
  const sectionSize = clampValue(config.sectionHeadingSize, 2, 7);
  const lhSection = clampValue(config.lineHeightSection, 0.9, 1.8);
  const ls = clampValue(config.letterSpacingAccent, 0, 0.2);

  return [
    `:root {`,
    `  --typo-accent-family: ${accent.cssFamily};`,
    `  --typo-heading-family: ${heading.cssFamily};`,
    `  --typo-hero-size: clamp(${heroMin}rem, ${heroSize}cqi, ${heroMax}rem);`,
    `  --typo-line-height-hero: ${lhHero};`,
    `  --typo-section-heading-size: clamp(2rem, ${sectionSize}vw, 3.2rem);`,
    `  --typo-line-height-section: ${lhSection};`,
    `  --typo-letter-spacing-accent: ${ls}em;`,
    `}`,
  ].join("\n");
}

/** Safely parse a Firestore document into a validated TypographyConfig. */
export function parseTypographyConfig(raw: unknown): TypographyConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_TYPOGRAPHY_CONFIG;
  const r = raw as Record<string, unknown>;
  const d = DEFAULT_TYPOGRAPHY_CONFIG;
  return {
    accentFont: typeof r.accentFont === "string" ? r.accentFont : d.accentFont,
    headingFont: typeof r.headingFont === "string" ? r.headingFont : d.headingFont,
    heroSize: typeof r.heroSize === "number" ? clampValue(r.heroSize, 4, 12) : d.heroSize,
    heroMinRem: typeof r.heroMinRem === "number" ? clampValue(r.heroMinRem, 1, 2.5) : d.heroMinRem,
    heroMaxRem: typeof r.heroMaxRem === "number" ? clampValue(r.heroMaxRem, 6, 14) : d.heroMaxRem,
    lineHeightHero:
      typeof r.lineHeightHero === "number"
        ? clampValue(r.lineHeightHero, 0.7, 1.5)
        : d.lineHeightHero,
    sectionHeadingSize:
      typeof r.sectionHeadingSize === "number"
        ? clampValue(r.sectionHeadingSize, 2, 7)
        : d.sectionHeadingSize,
    lineHeightSection:
      typeof r.lineHeightSection === "number"
        ? clampValue(r.lineHeightSection, 0.9, 1.8)
        : d.lineHeightSection,
    letterSpacingAccent:
      typeof r.letterSpacingAccent === "number"
        ? clampValue(r.letterSpacingAccent, 0, 0.2)
        : d.letterSpacingAccent,
    customFonts: Array.isArray(r.customFonts)
      ? (r.customFonts as CustomFontEntry[]).filter(
          (f) =>
            f &&
            typeof f.id === "string" &&
            typeof f.label === "string" &&
            typeof f.url === "string" &&
            typeof f.family === "string",
        )
      : [],
  };
}
