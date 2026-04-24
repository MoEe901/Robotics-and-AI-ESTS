"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { DEFAULT_HERO_CONFIG } from "@/lib/firebase/types";

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

const DEFAULT_BG: BgMediaFields = { type: "none", videoUrl: "", videoPosterUrl: "", imageUrl: "", loop: true, muted: true, autoplay: true };
const DEFAULT_MASK: MaskFields = { enabled: false, opacity: 0.6, color: "#07080f", gradient: "none" };
const DEFAULT_DATASHOW: DatashowFields = { enabled: false, imageUrl: "", caption: "", position: "center" };

const URL_RE = /^https?:\/\/.+\..+/;

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
