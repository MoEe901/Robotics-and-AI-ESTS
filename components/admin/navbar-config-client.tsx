"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { DEFAULT_NAVBAR_CONFIG } from "@/lib/firebase/types";

type NavItem = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  order: number;
  isVisible: boolean;
};

const EMPTY_ITEM: NavItem = {
  id: "",
  label: "",
  href: "",
  isExternal: false,
  order: 0,
  isVisible: true,
};

export function NavbarConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [logoText, setLogoText] = useState(DEFAULT_NAVBAR_CONFIG.logoText);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_NAVBAR_CONFIG.logoUrl);
  const [showThemeToggle, setShowThemeToggle] = useState(DEFAULT_NAVBAR_CONFIG.showThemeToggle);
  const [navItems, setNavItems] = useState<NavItem[]>([...DEFAULT_NAVBAR_CONFIG.links]);
  const [ctaText, setCtaText] = useState(DEFAULT_NAVBAR_CONFIG.ctaButton.label);
  const [ctaHref, setCtaHref] = useState(DEFAULT_NAVBAR_CONFIG.ctaButton.href);
  const [ctaVisible, setCtaVisible] = useState(DEFAULT_NAVBAR_CONFIG.ctaButton.isVisible);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteConfig", "navbar"));
        if (!cancelled && snap.exists()) {
          const r = snap.data() as Record<string, unknown>;
          const str = (key: string, fb: string) =>
            typeof r[key] === "string" && (r[key] as string).trim()
              ? (r[key] as string).trim()
              : fb;
          const rawItems = Array.isArray(r.links) ? r.links : Array.isArray(r.navItems) ? r.navItems : [];
          const items = rawItems
            .map((item, idx) => {
              if (!item || typeof item !== "object") return null;
              const o = item as Record<string, unknown>;
              return {
                id:
                  typeof o.id === "string" && o.id.trim()
                    ? o.id.trim()
                    : `link-${idx + 1}`,
                label: typeof o.label === "string" ? o.label.trim() : "",
                href: typeof o.href === "string" ? o.href.trim() : "",
                isExternal: o.isExternal === true,
                order: typeof o.order === "number" ? o.order : idx,
                isVisible: o.isVisible !== false,
              };
            })
            .filter((x): x is NavItem => x !== null)
            .sort((a, b) => a.order - b.order);
          const ctaObj = r.ctaButton && typeof r.ctaButton === "object" ? (r.ctaButton as Record<string, unknown>) : {};
          setLogoUrl(str("logoUrl", DEFAULT_NAVBAR_CONFIG.logoUrl));
          setLogoText(str("logoText", DEFAULT_NAVBAR_CONFIG.logoText));
          setShowThemeToggle(r.showThemeToggle !== false);
          setNavItems(items.length ? items : [...DEFAULT_NAVBAR_CONFIG.links]);
          setCtaText(
            str("ctaText", typeof ctaObj.label === "string" ? ctaObj.label : DEFAULT_NAVBAR_CONFIG.ctaButton.label),
          );
          setCtaHref(
            str("ctaHref", typeof ctaObj.href === "string" ? ctaObj.href : DEFAULT_NAVBAR_CONFIG.ctaButton.href),
          );
          setCtaVisible(ctaObj.isVisible !== false);
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

  function move(index: number, direction: -1 | 1) {
    setNavItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index]!;
      next[index] = next[target]!;
      next[target] = temp;
      return next.map((row, idx) => ({ ...row, order: idx }));
    });
  }

  async function save() {
    const cleaned = navItems
      .map((item, index) => ({
        id: item.id.trim() || `link-${index + 1}`,
        label: item.label.trim(),
        href: item.href.trim(),
        isExternal: item.isExternal === true,
        isVisible: item.isVisible !== false,
        order: index,
      }))
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
      await setDoc(doc(db(), "siteConfig", "navbar"), {
        logoUrl: logoUrl.trim() || DEFAULT_NAVBAR_CONFIG.logoUrl,
        logoText: logoText.trim() || DEFAULT_NAVBAR_CONFIG.logoText,
        links: cleaned,
        ctaButton: {
          label: ctaText.trim() || DEFAULT_NAVBAR_CONFIG.ctaButton.label,
          href: ctaHref.trim() || DEFAULT_NAVBAR_CONFIG.ctaButton.href,
          isVisible: ctaVisible,
        },
        showThemeToggle,
      }, { merge: true });
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
              <span className="text-white/70">Logo URL</span>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/assets/logos/logo-optimized.svg"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Logo text</span>
              <input
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder="Robotics & AI Club"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                checked={showThemeToggle}
                onChange={(e) => setShowThemeToggle(e.target.checked)}
              />
              Show theme toggle in navbar
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Navigation Links</p>
            <div className="space-y-2">
              {navItems.map((item, i) => (
                <div key={`${item.id}-${i}`} className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
                  <button type="button" onClick={() => move(i, -1)} className="rounded border border-white/20 p-1">
                    <ArrowUp className="size-3" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded border border-white/20 p-1">
                    <ArrowDown className="size-3" />
                  </button>
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
                  <div className="col-span-5 flex items-center gap-4 px-1 text-xs text-white/70">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isVisible}
                        onChange={(e) => {
                          const next = [...navItems];
                          next[i] = { ...next[i]!, isVisible: e.target.checked };
                          setNavItems(next);
                        }}
                      />
                      Visible
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isExternal}
                        onChange={(e) => {
                          const next = [...navItems];
                          next[i] = { ...next[i]!, isExternal: e.target.checked };
                          setNavItems(next);
                        }}
                      />
                      External link
                    </label>
                  </div>
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
            <label className="inline-flex items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                checked={ctaVisible}
                onChange={(e) => setCtaVisible(e.target.checked)}
              />
              Show CTA button
            </label>
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
            {ctaText && ctaVisible && (
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
            setLogoUrl(DEFAULT_NAVBAR_CONFIG.logoUrl);
            setShowThemeToggle(DEFAULT_NAVBAR_CONFIG.showThemeToggle);
            setNavItems([...DEFAULT_NAVBAR_CONFIG.links]);
            setCtaText(DEFAULT_NAVBAR_CONFIG.ctaButton.label);
            setCtaHref(DEFAULT_NAVBAR_CONFIG.ctaButton.href);
            setCtaVisible(DEFAULT_NAVBAR_CONFIG.ctaButton.isVisible);
          }}
          className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
