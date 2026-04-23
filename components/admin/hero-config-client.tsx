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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteConfig", "hero"));
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
        doc(db(), "siteConfig", "hero"),
        {
          eyebrow: fields.eyebrow.trim() || DEFAULT_HERO_CONFIG.eyebrow,
          headlinePrefix: fields.headlinePrefix.trim() || DEFAULT_HERO_CONFIG.headlinePrefix,
          headlineAccent: fields.headlineAccent.trim(),
          subtitle: fields.subtitle.trim(),
          ctaPrimaryText: fields.ctaPrimaryText.trim() || DEFAULT_HERO_CONFIG.ctaPrimaryText,
          ctaPrimaryHref: fields.ctaPrimaryHref.trim() || DEFAULT_HERO_CONFIG.ctaPrimaryHref,
          ctaSecondaryText: fields.ctaSecondaryText.trim() || DEFAULT_HERO_CONFIG.ctaSecondaryText,
          ctaSecondaryHref: fields.ctaSecondaryHref.trim() || DEFAULT_HERO_CONFIG.ctaSecondaryHref,
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
