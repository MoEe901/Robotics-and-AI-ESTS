/** Accent colors for public event page (matches template presets). */
export type EventPageAccentPreset =
  | "conference"
  | "workshop"
  | "competition"
  | "ceremony"
  | "social"
  | "training";

const PRESETS: Record<
  EventPageAccentPreset,
  { hex: string; dim: string; border: string }
> = {
  conference: {
    hex: "#4f8ef7",
    dim: "rgba(79,142,247,0.12)",
    border: "rgba(79,142,247,0.25)",
  },
  workshop: {
    hex: "#3ecf8e",
    dim: "rgba(62,207,142,0.12)",
    border: "rgba(62,207,142,0.25)",
  },
  competition: {
    hex: "#f5a623",
    dim: "rgba(245,166,35,0.12)",
    border: "rgba(245,166,35,0.25)",
  },
  ceremony: {
    hex: "#a78bfa",
    dim: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
  },
  social: {
    hex: "#f056a0",
    dim: "rgba(240,86,160,0.12)",
    border: "rgba(240,86,160,0.25)",
  },
  training: {
    hex: "#38bdf8",
    dim: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.25)",
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function accentFromHex(hex?: string | null): { hex: string; dim: string; border: string } {
  const h = hex?.trim() ?? "";
  const rgb = h && /^#[0-9a-f]{6}$/i.test(h) ? hexToRgb(h) : null;
  if (!rgb) return PRESETS.conference;
  const { r, g, b } = rgb;
  return {
    hex: h.startsWith("#") ? h : `#${h}`,
    dim: `rgba(${r},${g},${b},0.12)`,
    border: `rgba(${r},${g},${b},0.25)`,
  };
}

/** Map free text / slug hints to a template preset (optional variety). */
export function inferAccentPreset(title: string, slug: string): EventPageAccentPreset {
  const s = `${title} ${slug}`.toLowerCase();
  if (/\b(workshop|lab|hands[-\s]?on)\b/.test(s)) return "workshop";
  if (/\b(competition|contest|hackathon|battle)\b/.test(s)) return "competition";
  if (/\b(ceremony|gala|award|graduation)\b/.test(s)) return "ceremony";
  if (/\b(social|meetup|networking|party)\b/.test(s)) return "social";
  if (/\b(training|bootcamp|course|session)\b/.test(s)) return "training";
  return "conference";
}

export function presetAccent(preset: EventPageAccentPreset): { hex: string; dim: string; border: string } {
  return PRESETS[preset] ?? PRESETS.conference;
}

/** Split title into two lines: first half + accent second half (template hero). */
export function splitHeroTitle(title: string): { line1: string; line2: string } {
  const t = title.trim();
  if (!t) return { line1: "Event", line2: "" };
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 1) return { line1: t, line2: "" };
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(" "),
    line2: words.slice(mid).join(" "),
  };
}
