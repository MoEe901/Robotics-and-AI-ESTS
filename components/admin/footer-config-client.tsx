"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import {
  DEFAULT_FOOTER_CONFIG,
  type FooterColumn,
  type FooterSocialLink,
  type FooterSocialPlatform,
} from "@/lib/firebase/types";

type NavItem = { label: string; href: string };
type ColumnDraft = { heading: string; links: NavItem[]; isVisible: boolean };

const SOCIAL_PLATFORMS: { key: FooterSocialPlatform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "github", label: "GitHub" },
];

const EMPTY_LINK: NavItem = { label: "", href: "" };
const EMPTY_SOCIAL: FooterSocialLink = { platform: "instagram", url: "" };

function makeDefaultColumns(): ColumnDraft[] {
  const src =
    DEFAULT_FOOTER_CONFIG.footerColumns ?? [
      { heading: "Club", links: [...DEFAULT_FOOTER_CONFIG.footerNav] },
    ];
  return src.map((c) => ({
    heading: c.heading,
    links: c.links.map((l) => ({ ...l })),
    isVisible: c.isVisible !== false,
  }));
}

function parseColumns(raw: unknown): ColumnDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: ColumnDraft[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const heading = typeof o.heading === "string" ? o.heading.trim() : "";
    if (!heading) continue;
    const linksRaw = Array.isArray(o.links) ? o.links : [];
    const links: NavItem[] = [];
    for (const link of linksRaw) {
      if (!link || typeof link !== "object") continue;
      const l = link as Record<string, unknown>;
      const label = typeof l.label === "string" ? l.label.trim() : "";
      const href = typeof l.href === "string" ? l.href.trim() : "";
      if (!label || !href) continue;
      links.push({ label, href });
    }
    out.push({ heading, links, isVisible: o.isVisible !== false });
  }
  return out;
}

export function FooterConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Layout
  const [isVisible, setIsVisible] = useState(true);
  const [showBrandColumn, setShowBrandColumn] = useState(true);
  const [showSocialColumn, setShowSocialColumn] = useState(true);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [socialHeading, setSocialHeading] = useState(
    DEFAULT_FOOTER_CONFIG.socialHeading ?? "Social",
  );

  // Brand
  const [tagline, setTagline] = useState(DEFAULT_FOOTER_CONFIG.tagline);
  const [contactEmail, setContactEmail] = useState(DEFAULT_FOOTER_CONFIG.contactEmail);
  const [contactLocation, setContactLocation] = useState(
    DEFAULT_FOOTER_CONFIG.contactLocation,
  );

  // Columns
  const [columns, setColumns] = useState<ColumnDraft[]>(makeDefaultColumns());

  // Social
  const [socialLinks, setSocialLinks] = useState<FooterSocialLink[]>([
    ...DEFAULT_FOOTER_CONFIG.socialLinks,
  ]);

  // Bottom bar
  const [copyrightText, setCopyrightText] = useState(DEFAULT_FOOTER_CONFIG.copyrightText);
  const [versionLine, setVersionLine] = useState(DEFAULT_FOOTER_CONFIG.versionLine);

  // Brand extras
  const [brandName, setBrandName] = useState(DEFAULT_FOOTER_CONFIG.brandName ?? "Robotics & AI Club");
  const [estBadge, setEstBadge] = useState(DEFAULT_FOOTER_CONFIG.estBadge ?? "Est. 2024 · Rabat, Morocco");
  const [techPills, setTechPills] = useState((DEFAULT_FOOTER_CONFIG.techPills ?? ["React", "Next.js", "Three.js"]).join(", "));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteContent", "footer"));
        if (cancelled || !snap.exists()) return;
        const r = snap.data() as Record<string, unknown>;
        const str = (key: string, fb: string) =>
          typeof r[key] === "string" && (r[key] as string).trim()
            ? (r[key] as string).trim()
            : fb;

        // Visibility / layout flags (default-on for backward compatibility)
        setIsVisible(r.isVisible !== false);
        setShowBrandColumn(r.showBrandColumn !== false);
        setShowSocialColumn(r.showSocialColumn !== false);
        setShowBottomBar(r.showBottomBar !== false);
        setSocialHeading(
          str("socialHeading", DEFAULT_FOOTER_CONFIG.socialHeading ?? "Social"),
        );

        // Brand
        setTagline(str("tagline", DEFAULT_FOOTER_CONFIG.tagline));
        setContactEmail(str("email", str("contactEmail", DEFAULT_FOOTER_CONFIG.contactEmail)));
        setContactLocation(
          str("address", str("contactLocation", DEFAULT_FOOTER_CONFIG.contactLocation)),
        );

        // Columns (prefer saved, else single-column legacy footerNav, else defaults)
        const parsed = parseColumns(r.columns);
        if (parsed.length > 0) {
          setColumns(parsed);
        } else if (Array.isArray(r.footerNav) && r.footerNav.length) {
          // Legacy upgrade path: wrap a single "Club" column from the old footerNav.
          const legacyLinks: NavItem[] = [];
          for (const x of r.footerNav) {
            if (!x || typeof x !== "object") continue;
            const o = x as Record<string, unknown>;
            const label = typeof o.label === "string" ? o.label.trim() : "";
            const href = typeof o.href === "string" ? o.href.trim() : "";
            if (label && href) legacyLinks.push({ label, href });
          }
          setColumns(
            legacyLinks.length
              ? [{ heading: "Club", links: legacyLinks, isVisible: true }]
              : makeDefaultColumns(),
          );
        }

        // Socials
        const rawSocial = Array.isArray(r.socials)
          ? r.socials
          : Array.isArray(r.socialLinks)
            ? r.socialLinks
            : [];
        const socials: FooterSocialLink[] = [];
        for (const x of rawSocial) {
          if (!x || typeof x !== "object") continue;
          const o = x as Record<string, unknown>;
          const platform = typeof o.platform === "string" ? o.platform.trim() : "";
          const url = typeof o.url === "string" ? o.url.trim() : "";
          const valid = SOCIAL_PLATFORMS.some((p) => p.key === platform);
          if (!platform || !url || !valid) continue;
          socials.push({ platform: platform as FooterSocialPlatform, url });
        }
        if (socials.length > 0) setSocialLinks(socials);

        // Bottom bar
        setCopyrightText(str("copyrightText", DEFAULT_FOOTER_CONFIG.copyrightText));
        setVersionLine(str("versionLine", DEFAULT_FOOTER_CONFIG.versionLine));

        // Brand extras
        setBrandName(str("brandName", DEFAULT_FOOTER_CONFIG.brandName ?? "Robotics & AI Club"));
        setEstBadge(str("estBadge", DEFAULT_FOOTER_CONFIG.estBadge ?? "Est. 2024 · Rabat, Morocco"));
        if (Array.isArray(r.techPills) && r.techPills.length > 0) {
          setTechPills((r.techPills as string[]).join(", "));
        } else {
          setTechPills((DEFAULT_FOOTER_CONFIG.techPills ?? ["React", "Next.js", "Three.js"]).join(", "));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load footer config.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateColumn(idx: number, patch: Partial<ColumnDraft>) {
    setColumns((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, ...patch };
      return next;
    });
  }

  function moveColumn(idx: number, delta: -1 | 1) {
    setColumns((prev) => {
      const j = idx + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[j]!;
      next[j] = next[idx]!;
      next[idx] = tmp;
      return next;
    });
  }

  function updateLink(colIdx: number, linkIdx: number, patch: Partial<NavItem>) {
    setColumns((prev) => {
      const next = [...prev];
      const col = { ...next[colIdx]!, links: [...next[colIdx]!.links] };
      col.links[linkIdx] = { ...col.links[linkIdx]!, ...patch };
      next[colIdx] = col;
      return next;
    });
  }

  function moveLink(colIdx: number, linkIdx: number, delta: -1 | 1) {
    setColumns((prev) => {
      const col = prev[colIdx]!;
      const j = linkIdx + delta;
      if (j < 0 || j >= col.links.length) return prev;
      const next = [...prev];
      const newLinks = [...col.links];
      const tmp = newLinks[j]!;
      newLinks[j] = newLinks[linkIdx]!;
      newLinks[linkIdx] = tmp;
      next[colIdx] = { ...col, links: newLinks };
      return next;
    });
  }

  async function save() {
    setError(null);
    setSuccess(null);

    if (!tagline.trim()) {
      setError("Tagline must not be empty.");
      return;
    }

    const cleanColumns: FooterColumn[] = columns
      .map((c) => ({
        heading: c.heading.trim(),
        isVisible: c.isVisible,
        links: c.links
          .map((l) => ({ label: l.label.trim(), href: l.href.trim() }))
          .filter((l) => l.label && l.href),
      }))
      .filter((c) => c.heading && c.links.length > 0);

    const cleanSocials = socialLinks
      .map((s) => ({ platform: s.platform, url: s.url.trim() }))
      .filter((s) => s.url.length > 0);

    setSaving(true);
    try {
      await setDoc(
        doc(db(), "siteContent", "footer"),
        {
          // Brand
          tagline: tagline.trim(),
          address: contactLocation.trim() || DEFAULT_FOOTER_CONFIG.contactLocation,
          phone: "",
          email: contactEmail.trim() || DEFAULT_FOOTER_CONFIG.contactEmail,
          hours: "",
          contactEmail: contactEmail.trim() || DEFAULT_FOOTER_CONFIG.contactEmail,
          contactLocation:
            contactLocation.trim() || DEFAULT_FOOTER_CONFIG.contactLocation,

          // Columns
          columns: cleanColumns,
          // Backward-compat: keep `footerNav` as the first column's links
          footerNav: cleanColumns[0]?.links ?? [],

          // Social
          socials: cleanSocials,
          socialLinks: cleanSocials,
          socialHeading: socialHeading.trim() || "Social",

          // Bottom bar
          copyrightText: copyrightText.trim() || DEFAULT_FOOTER_CONFIG.copyrightText,
          versionLine: versionLine.trim() || DEFAULT_FOOTER_CONFIG.versionLine,

          // Layout flags
          isVisible,
          showBrandColumn,
          showSocialColumn,
          showBottomBar,

          // Brand extras
          brandName: brandName.trim() || DEFAULT_FOOTER_CONFIG.brandName,
          estBadge: estBadge.trim() || DEFAULT_FOOTER_CONFIG.estBadge,
          techPills: techPills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
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
  const cardCls = "rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4";

  if (loading) {
    return <p className="px-6 py-12 text-sm text-white/55">Loading footer config…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Footer</h1>
        <p className="mt-2 text-sm text-white/55">
          Full control over the public footer — visibility, brand block, link columns, social
          icons, and the bottom bar.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Layout & visibility */}
        <div className={cardCls}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
            Layout &amp; visibility
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30"
              />
              <span>
                <span className="block text-sm font-medium text-white">Footer visible</span>
                <span className="block text-[11px] text-white/50">
                  Master switch — when off the entire footer is hidden on the public site.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <input
                type="checkbox"
                checked={showBrandColumn}
                onChange={(e) => setShowBrandColumn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30"
              />
              <span>
                <span className="block text-sm font-medium text-white">Brand column</span>
                <span className="block text-[11px] text-white/50">
                  Logo, tagline, and contact block on the left.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <input
                type="checkbox"
                checked={showSocialColumn}
                onChange={(e) => setShowSocialColumn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30"
              />
              <span>
                <span className="block text-sm font-medium text-white">Social column</span>
                <span className="block text-[11px] text-white/50">
                  Dedicated column with social icons (uses the list below).
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <input
                type="checkbox"
                checked={showBottomBar}
                onChange={(e) => setShowBottomBar(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30"
              />
              <span>
                <span className="block text-sm font-medium text-white">Bottom bar</span>
                <span className="block text-[11px] text-white/50">
                  Copyright + version line at the very bottom.
                </span>
              </span>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-white/70">Social column heading</span>
            <input
              value={socialHeading}
              onChange={(e) => setSocialHeading(e.target.value)}
              placeholder="Social"
              className={inputCls}
            />
          </label>
        </div>

        {/* Brand */}
        <div className={cardCls}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
            Brand block
          </p>
          <label className="block text-sm">
            <span className="text-white/70">Brand name (next to logo)</span>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Robotics & AI Club"
              className={inputCls}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Tagline *</span>
            <textarea
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A community of innovators…"
              className={`${inputCls} resize-y`}
            />
          </label>
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
            <span className="text-white/70">Badge text (small pill below tagline)</span>
            <input
              value={estBadge}
              onChange={(e) => setEstBadge(e.target.value)}
              placeholder="Est. 2024 · Rabat, Morocco"
              className={inputCls}
            />
            <span className="mt-1 block text-[11px] text-white/40">
              The small green-dot badge under the tagline, e.g. &quot;Est. 2024 · Rabat, Morocco&quot;
            </span>
          </label>
        </div>

        {/* Columns */}
        <div className={cardCls}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
                Link columns
              </p>
              <p className="mt-1 text-[11px] text-white/40">
                Add as many columns as you need. Each column has a heading and its own list of
                links. Reorder with the arrow buttons.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setColumns((prev) => [
                  ...prev,
                  { heading: "New column", links: [{ ...EMPTY_LINK }], isVisible: true },
                ])
              }
              disabled={columns.length >= 6}
              className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add column
            </button>
          </div>

          {columns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/55">
              No columns yet — add one to start.
            </p>
          ) : (
            <div className="space-y-4">
              {columns.map((col, ci) => (
                <div
                  key={`col-${ci}`}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                    <input
                      value={col.heading}
                      onChange={(e) => updateColumn(ci, { heading: e.target.value })}
                      placeholder="Column heading (e.g. Club, Info, Connect)"
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-blue-500/50"
                    />
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/75">
                      <input
                        type="checkbox"
                        checked={col.isVisible}
                        onChange={(e) =>
                          updateColumn(ci, { isVisible: e.target.checked })
                        }
                        className="h-3.5 w-3.5 rounded border-white/30"
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      onClick={() => moveColumn(ci, -1)}
                      disabled={ci === 0}
                      className="rounded-lg border border-white/15 px-2.5 py-2 text-xs text-white/85 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Move column up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveColumn(ci, 1)}
                      disabled={ci === columns.length - 1}
                      className="rounded-lg border border-white/15 px-2.5 py-2 text-xs text-white/85 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Move column down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setColumns((prev) => prev.filter((_, j) => j !== ci))
                      }
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-2">
                    {col.links.map((link, li) => (
                      <div
                        key={`col-${ci}-link-${li}`}
                        className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 rounded-lg border border-white/10 bg-black/30 p-2"
                      >
                        <input
                          value={link.label}
                          onChange={(e) =>
                            updateLink(ci, li, { label: e.target.value })
                          }
                          placeholder="Label"
                          className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/35"
                        />
                        <input
                          value={link.href}
                          onChange={(e) =>
                            updateLink(ci, li, { href: e.target.value })
                          }
                          placeholder="/path or /#section"
                          className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-white/35"
                        />
                        <button
                          type="button"
                          onClick={() => moveLink(ci, li, -1)}
                          disabled={li === 0}
                          className="rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/75 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLink(ci, li, 1)}
                          disabled={li === col.links.length - 1}
                          className="rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/75 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setColumns((prev) => {
                              const next = [...prev];
                              const c = { ...next[ci]! };
                              c.links = c.links.filter((_, j) => j !== li);
                              next[ci] = c;
                              return next;
                            })
                          }
                          className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
                          title="Remove link"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setColumns((prev) => {
                        const next = [...prev];
                        const c = { ...next[ci]!, links: [...next[ci]!.links, { ...EMPTY_LINK }] };
                        next[ci] = c;
                        return next;
                      })
                    }
                    disabled={col.links.length >= 12}
                    className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Add link
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social */}
        <div className={cardCls}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
                Social links
              </p>
              <p className="mt-1 text-[11px] text-white/40">
                Rendered as icons in the dedicated Social column (toggle above).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSocialLinks((prev) => [...prev, { ...EMPTY_SOCIAL }])}
              disabled={socialLinks.length >= 8}
              className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add social
            </button>
          </div>
          <div className="space-y-2">
            {socialLinks.map((item, i) => (
              <div
                key={`social-${i}`}
                className="grid grid-cols-[auto_1fr_auto] gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5"
              >
                <select
                  value={item.platform}
                  onChange={(e) => {
                    const next = [...socialLinks];
                    next[i] = {
                      ...next[i]!,
                      platform: e.target.value as FooterSocialPlatform,
                    };
                    setSocialLinks(next);
                  }}
                  className="[color-scheme:dark] rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-white/35"
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
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
                  onClick={() =>
                    setSocialLinks((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className={cardCls}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
            Bottom bar
          </p>
          <label className="block text-sm">
            <span className="text-white/70">Copyright text</span>
            <input
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder="Club Name. All rights reserved."
              className={inputCls}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Version line (right side)</span>
            <input
              value={versionLine}
              onChange={(e) => setVersionLine(e.target.value)}
              placeholder="All systems operational · v2.0"
              className={inputCls}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Tech pills (center, comma-separated)</span>
            <input
              value={techPills}
              onChange={(e) => setTechPills(e.target.value)}
              placeholder="React, Next.js, Three.js"
              className={inputCls}
            />
            <span className="mt-1 block text-[11px] text-white/40">
              Small tags in the center of the bottom bar. Separate with commas. Leave empty to hide.
            </span>
          </label>
          <div className="rounded-xl border border-white/8 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Preview
            </p>
            <p className="mt-2 text-[11px] text-white/55">
              © {new Date().getFullYear() - 1}–{new Date().getFullYear()}{" "}
              {copyrightText || "—"}
            </p>
            <p className="mt-1 text-[11px] text-white/35">{versionLine || "—"}</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
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
            setIsVisible(true);
            setShowBrandColumn(true);
            setShowSocialColumn(true);
            setShowBottomBar(true);
            setSocialHeading(DEFAULT_FOOTER_CONFIG.socialHeading ?? "Social");
            setTagline(DEFAULT_FOOTER_CONFIG.tagline);
            setContactEmail(DEFAULT_FOOTER_CONFIG.contactEmail);
            setContactLocation(DEFAULT_FOOTER_CONFIG.contactLocation);
            setColumns(makeDefaultColumns());
            setSocialLinks([...DEFAULT_FOOTER_CONFIG.socialLinks]);
            setCopyrightText(DEFAULT_FOOTER_CONFIG.copyrightText);
            setVersionLine(DEFAULT_FOOTER_CONFIG.versionLine);
            setBrandName(DEFAULT_FOOTER_CONFIG.brandName ?? "Robotics & AI Club");
            setEstBadge(DEFAULT_FOOTER_CONFIG.estBadge ?? "Est. 2024 · Rabat, Morocco");
            setTechPills((DEFAULT_FOOTER_CONFIG.techPills ?? ["React", "Next.js", "Three.js"]).join(", "));
          }}
          className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
