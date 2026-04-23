"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { DEFAULT_NAVBAR_CONFIG } from "@/lib/firebase/types";

type NavItem = { label: string; href: string };

const EMPTY_ITEM: NavItem = { label: "", href: "" };

export function NavbarConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [logoText, setLogoText] = useState(DEFAULT_NAVBAR_CONFIG.logoText);
  const [navItems, setNavItems] = useState<NavItem[]>([...DEFAULT_NAVBAR_CONFIG.navItems]);
  const [ctaText, setCtaText] = useState(DEFAULT_NAVBAR_CONFIG.ctaText);
  const [ctaHref, setCtaHref] = useState(DEFAULT_NAVBAR_CONFIG.ctaHref);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteContent", "navbar"));
        if (!cancelled && snap.exists()) {
          const r = snap.data() as Record<string, unknown>;
          const str = (key: string, fb: string) =>
            typeof r[key] === "string" && (r[key] as string).trim()
              ? (r[key] as string).trim()
              : fb;
          const rawItems = Array.isArray(r.navItems) ? r.navItems : [];
          const items = rawItems
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const o = item as Record<string, unknown>;
              return {
                label: typeof o.label === "string" ? o.label.trim() : "",
                href: typeof o.href === "string" ? o.href.trim() : "",
              };
            })
            .filter((x): x is NavItem => x !== null && Boolean(x.label) && Boolean(x.href));
          setLogoText(str("logoText", DEFAULT_NAVBAR_CONFIG.logoText));
          setNavItems(items.length ? items : [...DEFAULT_NAVBAR_CONFIG.navItems]);
          setCtaText(str("ctaText", DEFAULT_NAVBAR_CONFIG.ctaText));
          setCtaHref(str("ctaHref", DEFAULT_NAVBAR_CONFIG.ctaHref));
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load navbar config.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function save() {
    const cleaned = navItems
      .map((item) => ({ label: item.label.trim(), href: item.href.trim() }))
      .filter((item) => item.label && item.href);
    if (!cleaned.length) {
      setError("Add at least one navigation link.");
      return;
    }
    if (!ctaText.trim()) {
      setError("CTA button text must not be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setDoc(
        doc(db(), "siteContent", "navbar"),
        {
          logoText: logoText.trim() || DEFAULT_NAVBAR_CONFIG.logoText,
          navItems: cleaned,
          ctaText: ctaText.trim(),
          ctaHref: ctaHref.trim() || DEFAULT_NAVBAR_CONFIG.ctaHref,
        },
        { merge: true },
      );
      setSuccess("Navigation config saved. Changes are live immediately.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="px-6 py-12 text-sm text-white/55">Loading navigation config…</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Navigation</h1>
      <p className="mt-2 text-sm text-white/55">
        Edit the navbar logo text, menu links, and CTA button. Changes take effect immediately.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Logo</p>
            <label className="block text-sm">
              <span className="text-white/70">Logo text</span>
              <input
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder="Robotics & AI Club"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Navigation Links</p>
            <div className="space-y-2">
              {navItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
                  <input
                    value={item.label}
                    onChange={(e) => {
                      const next = [...navItems];
                      next[i] = { ...next[i]!, label: e.target.value };
                      setNavItems(next);
                    }}
                    placeholder="Label"
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/35"
                  />
                  <input
                    value={item.href}
                    onChange={(e) => {
                      const next = [...navItems];
                      next[i] = { ...next[i]!, href: e.target.value };
                      setNavItems(next);
                    }}
                    placeholder="/path or /#section"
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => setNavItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setNavItems((prev) => [...prev, EMPTY_ITEM])}
              disabled={navItems.length >= 12}
              className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add link
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">CTA Button</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-white/70">Button text</span>
                <input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Apply"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Button link</span>
                <input
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="/#apply"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">Preview</p>
          <div className="rounded-xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-3 border-b border-white/8 pb-3">
              <div className="size-6 rounded bg-gradient-to-br from-blue-500 to-violet-500" />
              <span className="text-sm font-semibold text-white">{logoText || "Logo text"}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {navItems.filter((x) => x.label).map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-white/25" />
                  <span className="text-xs text-white/65">{item.label}</span>
                  <span className="ml-auto text-[10px] text-white/30">{item.href}</span>
                </li>
              ))}
            </ul>
            {ctaText && (
              <div className="mt-3 pt-3 border-t border-white/8">
                <span className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
                  {ctaText}
                </span>
              </div>
            )}
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
          {saving ? "Saving…" : "Save navigation"}
        </button>
        <button
          type="button"
          onClick={() => {
            setLogoText(DEFAULT_NAVBAR_CONFIG.logoText);
            setNavItems([...DEFAULT_NAVBAR_CONFIG.navItems]);
            setCtaText(DEFAULT_NAVBAR_CONFIG.ctaText);
            setCtaHref(DEFAULT_NAVBAR_CONFIG.ctaHref);
          }}
          className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
