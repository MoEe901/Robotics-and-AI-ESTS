"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { DEFAULT_FOOTER_CONFIG, type FooterSocialPlatform } from "@/lib/firebase/types";

type NavItem = { label: string; href: string };
type SocialLink = { platform: FooterSocialPlatform; url: string };

const SOCIAL_PLATFORMS: { key: FooterSocialPlatform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "github", label: "GitHub" },
];

const EMPTY_NAV: NavItem = { label: "", href: "" };
const EMPTY_SOCIAL: SocialLink = { platform: "instagram", url: "" };

export function FooterConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tagline, setTagline] = useState(DEFAULT_FOOTER_CONFIG.tagline);
  const [footerNav, setFooterNav] = useState<NavItem[]>([...DEFAULT_FOOTER_CONFIG.footerNav]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([...DEFAULT_FOOTER_CONFIG.socialLinks]);
  const [contactEmail, setContactEmail] = useState(DEFAULT_FOOTER_CONFIG.contactEmail);
  const [contactLocation, setContactLocation] = useState(DEFAULT_FOOTER_CONFIG.contactLocation);
  const [copyrightText, setCopyrightText] = useState(DEFAULT_FOOTER_CONFIG.copyrightText);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteContent", "footer"));
        if (!cancelled && snap.exists()) {
          const r = snap.data() as Record<string, unknown>;
          const str = (key: string, fb: string) =>
            typeof r[key] === "string" && (r[key] as string).trim()
              ? (r[key] as string).trim()
              : fb;
          const cols = Array.isArray(r.columns) ? r.columns : [];
          const clubCol = cols.find((c) => (c as { heading?: string })?.heading === "Club") as
            | { links?: unknown[] }
            | undefined;
          const rawNav = Array.isArray(clubCol?.links)
            ? clubCol!.links!
            : Array.isArray(r.footerNav)
              ? r.footerNav
              : [];
          const nav = rawNav
            .map((x) => {
              if (!x || typeof x !== "object") return null;
              const o = x as Record<string, unknown>;
              const label = typeof o.label === "string" ? o.label.trim() : "";
              const href = typeof o.href === "string" ? o.href.trim() : "";
              if (!label || !href) return null;
              return { label, href };
            })
            .filter((x): x is NavItem => x !== null);
          const rawSocial = Array.isArray(r.socials) ? r.socials : Array.isArray(r.socialLinks) ? r.socialLinks : [];
          const socials = rawSocial
            .map((x) => {
              if (!x || typeof x !== "object") return null;
              const o = x as Record<string, unknown>;
              const platform = typeof o.platform === "string" ? o.platform.trim() : "";
              const url = typeof o.url === "string" ? o.url.trim() : "";
              const valid = SOCIAL_PLATFORMS.some((p) => p.key === platform);
              if (!platform || !url || !valid) return null;
              return { platform: platform as FooterSocialPlatform, url };
            })
            .filter((x): x is SocialLink => x !== null);
          setTagline(str("tagline", DEFAULT_FOOTER_CONFIG.tagline));
          setFooterNav(nav.length ? nav : [...DEFAULT_FOOTER_CONFIG.footerNav]);
          setSocialLinks(socials.length ? socials : [...DEFAULT_FOOTER_CONFIG.socialLinks]);
          setContactEmail(str("email", str("contactEmail", DEFAULT_FOOTER_CONFIG.contactEmail)));
          setContactLocation(str("address", str("contactLocation", DEFAULT_FOOTER_CONFIG.contactLocation)));
          setCopyrightText(str("copyrightText", DEFAULT_FOOTER_CONFIG.copyrightText));
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load footer config.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function save() {
    if (!tagline.trim()) { setError("Tagline must not be empty."); return; }
    const cleanedNav = footerNav
      .map((x) => ({ label: x.label.trim(), href: x.href.trim() }))
      .filter((x) => x.label && x.href);
    if (!cleanedNav.length) { setError("Add at least one footer link."); return; }
    const cleanedSocial = socialLinks
      .map((x) => ({ platform: x.platform, url: x.url.trim() }))
      .filter((x) => x.url);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const infoLinks = [
        { label: "Know Us", href: "/#know" },
        { label: "Cellules", href: "/#cellules" },
        { label: "Team", href: "/#team" },
        { label: "FAQ", href: "/#faq" },
      ];
      const connectLinks = [
        { label: "Apply Now", href: "/#apply" },
        { label: "Contact Us", href: "/#apply" },
      ];
      await setDoc(
        doc(db(), "siteContent", "footer"),
        {
          tagline: tagline.trim(),
          address: contactLocation.trim() || DEFAULT_FOOTER_CONFIG.contactLocation,
          phone: "",
          email: contactEmail.trim() || DEFAULT_FOOTER_CONFIG.contactEmail,
          hours: "",
          columns: [
            { heading: "Club", links: cleanedNav },
            { heading: "Info", links: infoLinks },
            { heading: "Connect", links: connectLinks },
          ],
          socials: cleanedSocial.map((s) => ({ platform: s.platform, url: s.url })),
          footerNav: cleanedNav,
          socialLinks: cleanedSocial,
          contactEmail: contactEmail.trim() || DEFAULT_FOOTER_CONFIG.contactEmail,
          contactLocation: contactLocation.trim() || DEFAULT_FOOTER_CONFIG.contactLocation,
          copyrightText: copyrightText.trim() || DEFAULT_FOOTER_CONFIG.copyrightText,
          versionLine: DEFAULT_FOOTER_CONFIG.versionLine,
        },
        { merge: true },
      );
      setSuccess("Footer config saved. Changes are live immediately.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20";

  if (loading)
    return <p className="px-6 py-12 text-sm text-white/55">Loading footer config…</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Footer</h1>
      <p className="mt-2 text-sm text-white/55">
        Edit the footer tagline, navigation links, social media URLs, contact info, and copyright.
      </p>

      <div className="mt-8 space-y-6">
        {/* Tagline */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Tagline</p>
          <label className="block text-sm">
            <span className="text-white/70">Tagline text *</span>
            <textarea
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A community of innovators…"
              className={`${inputCls} resize-y`}
            />
          </label>
        </div>

        {/* Footer navigation */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Footer Links</p>
          <div className="space-y-2">
            {footerNav.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
                <input
                  value={item.label}
                  onChange={(e) => {
                    const next = [...footerNav];
                    next[i] = { ...next[i]!, label: e.target.value };
                    setFooterNav(next);
                  }}
                  placeholder="Label"
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/35"
                />
                <input
                  value={item.href}
                  onChange={(e) => {
                    const next = [...footerNav];
                    next[i] = { ...next[i]!, href: e.target.value };
                    setFooterNav(next);
                  }}
                  placeholder="/path or /#section"
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/35"
                />
                <button
                  type="button"
                  onClick={() => setFooterNav((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFooterNav((prev) => [...prev, EMPTY_NAV])}
            disabled={footerNav.length >= 12}
            className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add link
          </button>
        </div>

        {/* Social links */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Social Links</p>
          <div className="space-y-2">
            {socialLinks.map((item, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
                <select
                  value={item.platform}
                  onChange={(e) => {
                    const next = [...socialLinks];
                    next[i] = { ...next[i]!, platform: e.target.value as FooterSocialPlatform };
                    setSocialLinks(next);
                  }}
                  className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-white/35"
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <input
                  value={item.url}
                  onChange={(e) => {
                    const next = [...socialLinks];
                    next[i] = { ...next[i]!, url: e.target.value };
                    setSocialLinks(next);
                  }}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/35"
                />
                <button
                  type="button"
                  onClick={() => setSocialLinks((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSocialLinks((prev) => [...prev, EMPTY_SOCIAL])}
            disabled={socialLinks.length >= 8}
            className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add social
          </button>
        </div>

        {/* Contact & copyright */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Contact & Copyright</p>
          <label className="block text-sm">
            <span className="text-white/70">Contact email</span>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
              className={inputCls}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Location</span>
            <textarea
              rows={2}
              value={contactLocation}
              onChange={(e) => setContactLocation(e.target.value)}
              placeholder="École Supérieure de Technologie&#10;Safi, Morocco"
              className={`${inputCls} resize-y`}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Copyright text</span>
            <input
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder="Club Name. All rights reserved."
              className={inputCls}
            />
          </label>
          <div className="rounded-xl border border-white/8 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">Preview</p>
            <p className="text-xs text-white/55">{tagline || "—"}</p>
            <p className="mt-2 text-[11px] text-white/35">
              © {new Date().getFullYear()} {copyrightText || "—"}
            </p>
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
          {saving ? "Saving…" : "Save footer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setTagline(DEFAULT_FOOTER_CONFIG.tagline);
            setFooterNav([...DEFAULT_FOOTER_CONFIG.footerNav]);
            setSocialLinks([...DEFAULT_FOOTER_CONFIG.socialLinks]);
            setContactEmail(DEFAULT_FOOTER_CONFIG.contactEmail);
            setContactLocation(DEFAULT_FOOTER_CONFIG.contactLocation);
            setCopyrightText(DEFAULT_FOOTER_CONFIG.copyrightText);
          }}
          className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
