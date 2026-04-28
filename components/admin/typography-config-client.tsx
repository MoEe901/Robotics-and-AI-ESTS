"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { Check, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { db } from "@/lib/firebase";
import {
  buildTypographyCss,
  clampValue,
  DEFAULT_TYPOGRAPHY_CONFIG,
  FONT_REGISTRY,
  parseTypographyConfig,
  resolveFontEntry,
  type CustomFontEntry,
  type FontEntry,
  type TypographyConfig,
} from "@/lib/content/typography-defaults";

// ─── Mini helpers ─────────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Inject a Google Font <link> into the current document (admin preview use). */
function ensureFontLoaded(entry: FontEntry | undefined) {
  if (!entry || entry.preloaded || !entry.googleFontUrl) return;
  const id = `gf-${entry.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = entry.googleFontUrl;
  document.head.appendChild(link);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type FontPickerProps = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  customFonts: CustomFontEntry[];
};

function FontPicker({ label, value, onChange, customFonts }: FontPickerProps) {
  const id = useId();
  const allFonts: FontEntry[] = [
    ...FONT_REGISTRY,
    ...customFonts.map<FontEntry>((cf) => ({
      id: cf.id,
      label: cf.label,
      cssFamily: cf.family,
      preloaded: false,
      googleFontUrl: cf.url,
      category: "display",
    })),
  ];

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-medium uppercase tracking-[0.1em] text-white/50"
      >
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {allFonts.map((font) => {
          const active = value === font.id;
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onChange(font.id)}
              title={font.label}
              className={[
                "relative flex min-h-[64px] flex-col items-start justify-between overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                active
                  ? "border-violet-500/60 bg-violet-500/[0.12] shadow-[0_0_0_1px_rgba(124,58,237,0.35)]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-violet-500/30 hover:bg-violet-500/[0.06]",
              ].join(" ")}
            >
              {active && (
                <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-violet-500">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </span>
              )}
              <span
                className="mt-1 text-[22px] leading-none text-white"
                style={{ fontFamily: resolveFontEntry(font.id, []).cssFamily }}
              >
                Aa
              </span>
              <span className="mt-2 block truncate text-[10px] font-medium text-white/60">
                {font.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  description?: string;
};

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  description,
}: SliderFieldProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/50"
        >
          {label}
        </label>
        <span className="font-jetbrains rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/80">
          {round2(value)}
          {unit}
        </span>
      </div>
      {description && (
        <p className="mb-2 text-[11px] text-white/35">{description}</p>
      )}
      <div className="relative h-5 flex items-center">
        <div className="absolute h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-violet-400 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(124,58,237,0.6)]"
        />
      </div>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

type PreviewProps = {
  config: TypographyConfig;
};

function LivePreview({ config }: PreviewProps) {
  const accentEntry = resolveFontEntry(config.accentFont, config.customFonts);
  const headingEntry = resolveFontEntry(config.headingFont, config.customFonts);

  const heroStyle = {
    fontSize: `clamp(${config.heroMinRem}rem, ${config.heroSize}cqi, ${config.heroMaxRem}rem)`,
    fontWeight: 800,
    lineHeight: config.lineHeightHero,
    letterSpacing: "-0.01em",
    textTransform: "uppercase" as const,
  };

  const sectionHStyle = {
    fontSize: `clamp(1.8rem, ${config.sectionHeadingSize}vw, 3.2rem)`,
    fontWeight: 800,
    lineHeight: config.lineHeightSection,
    letterSpacing: "-0.02em",
    textTransform: "uppercase" as const,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero mock */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07080f] p-6">
        <p className="font-jetbrains mb-3 text-[9px] uppercase tracking-[0.2em] text-white/30">
          Hero title preview
        </p>
        <div
          className="[container-type:inline-size]"
          style={{ fontFamily: headingEntry.cssFamily, ...heroStyle }}
        >
          <span className="block text-white" style={{ ...heroStyle }}>
            WELCOME TO THE
          </span>
          <span
            className="block hero-title-grad"
            style={{
              ...heroStyle,
              fontFamily: accentEntry.cssFamily,
              letterSpacing: `${config.letterSpacingAccent}em`,
            }}
          >
            ROBOTICS & AI.
          </span>
          <span className="block text-white" style={{ ...heroStyle }}>
            CLUB.
          </span>
        </div>
      </div>

      {/* Section heading mock */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07080f] p-6">
        <p className="font-jetbrains mb-3 text-[9px] uppercase tracking-[0.2em] text-white/30">
          Section heading preview
        </p>
        <div style={{ fontFamily: headingEntry.cssFamily, ...sectionHStyle }}>
          <span className="text-white">Our </span>
          <span className="hero-title-grad">Events</span>
        </div>
      </div>

      {/* Body preview */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07080f] p-6">
        <p className="font-jetbrains mb-3 text-[9px] uppercase tracking-[0.2em] text-white/30">
          Accent glyphs
        </p>
        <div
          className="flex flex-wrap gap-3"
          style={{ fontFamily: accentEntry.cssFamily }}
        >
          {["A", "B", "R", "0", "1", "&", "."].map((ch) => (
            <span
              key={ch}
              className="hero-title-grad text-[2.8rem] font-bold leading-none"
              style={{ letterSpacing: `${config.letterSpacingAccent}em` }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Custom Fonts Panel ───────────────────────────────────────────────────────

type CustomFontsPanelProps = {
  fonts: CustomFontEntry[];
  onChange: (fonts: CustomFontEntry[]) => void;
};

function CustomFontsPanel({ fonts, onChange }: CustomFontsPanelProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [family, setFamily] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function add() {
    const trimLabel = label.trim();
    const trimUrl = url.trim();
    const trimFamily = family.trim();
    if (!trimLabel || !trimUrl || !trimFamily) {
      setErr("All three fields are required.");
      return;
    }
    const id = trimLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (fonts.some((f) => f.id === id)) {
      setErr(`A font named "${trimLabel}" already exists.`);
      return;
    }
    const newEntry: CustomFontEntry = { id, label: trimLabel, url: trimUrl, family: trimFamily };
    ensureFontLoaded({
      id,
      label: trimLabel,
      cssFamily: trimFamily,
      preloaded: false,
      googleFontUrl: trimUrl,
      category: "display",
    });
    onChange([...fonts, newEntry]);
    setLabel("");
    setUrl("");
    setFamily("");
    setErr(null);
  }

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:border-violet-400/50 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition";

  return (
    <div className="space-y-4">
      {fonts.length > 0 && (
        <div className="space-y-2">
          {fonts.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white">{f.label}</p>
                <p className="truncate text-[11px] text-white/40">{f.family}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(fonts.filter((x) => x.id !== f.id))}
                className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                title="Remove font"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-dashed border-white/[0.1] p-4">
        <p className="font-jetbrains mb-3 text-[10px] uppercase tracking-[0.12em] text-white/40">
          Add custom font
        </p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Display name  (e.g. Nunito)"
          className={inputCls}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Google Fonts CSS URL"
          className={inputCls}
        />
        <input
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          placeholder="CSS family  (e.g. 'Nunito', sans-serif)"
          className={inputCls}
        />
        {err && <p className="text-[12px] text-rose-400">{err}</p>}
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/[0.08] px-4 py-2 text-[12px] font-medium text-violet-300 transition hover:bg-violet-500/[0.15]"
        >
          <Plus className="size-3.5" />
          Add font
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TypographyConfigClient() {
  const [config, setConfig] = useState<TypographyConfig>(DEFAULT_TYPOGRAPHY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current config from Firestore
  useEffect(() => {
    void (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteConfig", "typography"));
        if (snap.exists()) {
          setConfig(parseTypographyConfig(snap.data()));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load typography config.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Apply a live preview of the current config to the page without saving
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loading) return;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      const el = document.getElementById("typo-overrides") as HTMLStyleElement | null;
      if (el) el.textContent = buildTypographyCss(config);
      // Ensure fonts for current selection are loaded
      [config.accentFont, config.headingFont].forEach((id) => {
        ensureFontLoaded(resolveFontEntry(id, config.customFonts));
      });
    }, 120);
    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [config, loading]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await setDoc(doc(db(), "siteConfig", "typography"), config, { merge: false });
      setSaved(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfig(DEFAULT_TYPOGRAPHY_CONFIG);
    setSaved(false);
  }

  function update<K extends keyof TypographyConfig>(
    key: K,
    value: TypographyConfig[K],
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Typography</h1>
        <div className="mt-12 flex items-center justify-center gap-3 text-white/40">
          <RefreshCw className="size-4 animate-spin" />
          <span className="text-sm">Loading config…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Typography</h1>
          <p className="admin-page-subtitle">
            Control fonts, sizes, and letter-spacing across the site. Changes are applied live — save to persist.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[12px] font-medium text-white/70 transition hover:border-white/30 hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Reset defaults
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={[
              "flex items-center gap-2 rounded-full px-5 py-2 text-[12px] font-medium text-white transition disabled:opacity-50",
              saved
                ? "bg-emerald-600 shadow-[0_0_20px_rgba(5,150,105,0.35)]"
                : "bg-gradient-to-br from-violet-600 to-cyan-500 shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]",
            ].join(" ")}
          >
            {saving ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : saved ? (
              <Check className="size-3.5" />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Font families */}
          <div className="admin-card space-y-6 p-6">
            <div>
              <h2 className="font-syne mb-1 text-[15px] font-bold text-white">
                Font Families
              </h2>
              <p className="text-[12px] text-white/40">
                Accent — gradient/highlight lines. Heading — structural headlines &amp; section titles.
              </p>
            </div>

            <FontPicker
              label="Accent font  (hero gradient lines)"
              value={config.accentFont}
              onChange={(id) => update("accentFont", id)}
              customFonts={config.customFonts}
            />

            <div className="h-px bg-white/[0.06]" />

            <FontPicker
              label="Heading font  (structural lines + section h2)"
              value={config.headingFont}
              onChange={(id) => update("headingFont", id)}
              customFonts={config.customFonts}
            />
          </div>

          {/* Sizes */}
          <div className="admin-card space-y-5 p-6">
            <div>
              <h2 className="font-syne mb-1 text-[15px] font-bold text-white">
                Sizes
              </h2>
              <p className="text-[12px] text-white/40">
                All values feed into CSS <code className="text-white/60">clamp()</code> expressions for
                safe responsive scaling.
              </p>
            </div>

            <SliderField
              label="Hero title — cqi scale"
              value={config.heroSize}
              min={4}
              max={12}
              step={0.1}
              unit=" cqi"
              onChange={(v) => update("heroSize", round2(v))}
              description="Scales with the text column width. Default 7.2 cqi."
            />

            <div className="grid grid-cols-2 gap-4">
              <SliderField
                label="Hero min"
                value={config.heroMinRem}
                min={1}
                max={2.5}
                step={0.05}
                unit=" rem"
                onChange={(v) => {
                  const safe = round2(clampValue(v, 1, config.heroMaxRem - 1));
                  update("heroMinRem", safe);
                }}
              />
              <SliderField
                label="Hero max"
                value={config.heroMaxRem}
                min={6}
                max={14}
                step={0.5}
                unit=" rem"
                onChange={(v) => {
                  const safe = round2(clampValue(v, config.heroMinRem + 1, 14));
                  update("heroMaxRem", safe);
                }}
              />
            </div>

            <SliderField
              label="Hero line height"
              value={config.lineHeightHero}
              min={0.7}
              max={1.5}
              step={0.01}
              unit=""
              onChange={(v) => update("lineHeightHero", round2(v))}
              description="Unitless line-height for the hero title. Default 0.9."
            />

            <SliderField
              label="Section heading — vw scale"
              value={config.sectionHeadingSize}
              min={2}
              max={7}
              step={0.1}
              unit=" vw"
              onChange={(v) => update("sectionHeadingSize", round2(v))}
              description="Controls Events, Know Us, Why Join headings. Default 4 vw."
            />

            <SliderField
              label="Section heading line height"
              value={config.lineHeightSection}
              min={0.9}
              max={1.8}
              step={0.01}
              unit=""
              onChange={(v) => update("lineHeightSection", round2(v))}
              description="Unitless line-height for section headings. Default 1.05."
            />

            <SliderField
              label="Accent letter-spacing"
              value={config.letterSpacingAccent}
              min={0}
              max={0.2}
              step={0.005}
              unit=" em"
              onChange={(v) => update("letterSpacingAccent", round2(v))}
              description="Applied to gradient/accent lines. Default 0.04 em."
            />
          </div>

          {/* Custom fonts */}
          <div className="admin-card p-6">
            <h2 className="font-syne mb-1 text-[15px] font-bold text-white">
              Custom Fonts
            </h2>
            <p className="mb-4 text-[12px] text-white/40">
              Add any Google Fonts URL or a direct @font-face stylesheet. The font becomes available in the pickers above.
            </p>
            <CustomFontsPanel
              fonts={config.customFonts}
              onChange={(fonts) => update("customFonts", fonts)}
            />
          </div>
        </div>

        {/* ── Live Preview ───────────────────────────────────────────────── */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="admin-card overflow-hidden p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-white/40">
                Live preview
              </span>
            </div>
            <LivePreview config={config} />
          </div>

          {/* Config summary */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="font-jetbrains mb-3 text-[9px] uppercase tracking-[0.2em] text-white/30">
              CSS output snapshot
            </p>
            <pre className="overflow-x-auto text-[10px] leading-relaxed text-white/40">
              {buildTypographyCss(config)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
