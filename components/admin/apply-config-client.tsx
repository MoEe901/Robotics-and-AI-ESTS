"use client";

import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import type {
  ApplyCommunityAction,
  ApplyCommunityColor,
  ApplyCommunityConfig,
  ApplyCommunityPlatform,
  ApplyContactRow,
  ApplyContactIconKey,
  ApplyContactTone,
  ApplySocialLink,
  ApplySocialPlatform,
} from "@/lib/firebase/types";
import { mergeApplyCollectionDocs } from "@/lib/content/apply-docs-merge";
import {
  COMMUNITY_COLORS,
  COMMUNITY_PLATFORMS,
  DEFAULT_APPLY_CONFIG,
  DEFAULT_COMMUNITY_CONFIG,
  mergeApplyFromFirestore,
} from "@/lib/content/apply-defaults";
import { CommunityPlatformIcon } from "@/components/content/community-card";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const ICON_OPTIONS: { key: ApplyContactIconKey; label: string }[] = [
  { key: "map", label: "Map / location" },
  { key: "phone", label: "Phone" },
  { key: "mail", label: "Email" },
  { key: "clock", label: "Clock / hours" },
];

const TONE_OPTIONS: { key: ApplyContactTone; label: string }[] = [
  { key: "blue", label: "Blue" },
  { key: "violet", label: "Violet" },
  { key: "pink", label: "Pink" },
  { key: "green", label: "Green" },
];

const PLATFORM_ORDER: ApplySocialPlatform[] = ["instagram", "linkedin", "twitter", "youtube"];

function normalizeSocials(links: ApplySocialLink[]): ApplySocialLink[] {
  const by = new Map(links.map((l) => [l.platform, l]));
  return PLATFORM_ORDER.map((p) => ({ platform: p, url: by.get(p)?.url?.trim() ?? "" }));
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isValidHex(value: string | undefined | null): boolean {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

const PRESET_PREVIEW: Record<Exclude<ApplyCommunityColor, "custom">, string> = {
  indigo: "#4f46e5",
  emerald: "#059669",
  sky: "#0284c7",
  violet: "#7c3aed",
  cyan: "#0891b2",
  rose: "#e11d48",
  amber: "#f59e0b",
  white: "#ffffff",
  blue: "#2563eb",
  teal: "#0d9488",
  green: "#16a34a",
  lime: "#84cc16",
  orange: "#f97316",
  red: "#dc2626",
  pink: "#db2777",
  fuchsia: "#c026d3",
  purple: "#9333ea",
  slate: "#334155",
  black: "#000000",
};

function getActionPreviewColor(action: ApplyCommunityAction): string {
  if (action.color === "custom") {
    return isValidHex(action.customHex) ? (action.customHex as string) : "#334155";
  }
  return PRESET_PREVIEW[action.color] ?? "#334155";
}

export function ApplyConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [topLabel, setTopLabel] = useState(DEFAULT_APPLY_CONFIG.topLabel);
  const [heroLine1, setHeroLine1] = useState(DEFAULT_APPLY_CONFIG.heroLine1);
  const [heroLine2, setHeroLine2] = useState(DEFAULT_APPLY_CONFIG.heroLine2);
  const [heroSub, setHeroSub] = useState(DEFAULT_APPLY_CONFIG.heroSub);
  const [infoBadge, setInfoBadge] = useState(DEFAULT_APPLY_CONFIG.infoBadge);
  const [infoTitle, setInfoTitle] = useState(DEFAULT_APPLY_CONFIG.infoTitle);
  const [infoDesc, setInfoDesc] = useState(DEFAULT_APPLY_CONFIG.infoDesc);
  const [contactRows, setContactRows] = useState<ApplyContactRow[]>(() =>
    DEFAULT_APPLY_CONFIG.contactRows.map((r) => ({ ...r })),
  );
  const [socialLinks, setSocialLinks] = useState<ApplySocialLink[]>(() =>
    normalizeSocials(DEFAULT_APPLY_CONFIG.socialLinks),
  );
  const [formTitle, setFormTitle] = useState(DEFAULT_APPLY_CONFIG.formTitle);
  const [formSubtitle, setFormSubtitle] = useState(DEFAULT_APPLY_CONFIG.formSubtitle);
  const [firstNameLabel, setFirstNameLabel] = useState(DEFAULT_APPLY_CONFIG.firstNameLabel);
  const [lastNameLabel, setLastNameLabel] = useState(DEFAULT_APPLY_CONFIG.lastNameLabel);
  const [yearLabel, setYearLabel] = useState(DEFAULT_APPLY_CONFIG.yearLabel);
  const [departmentLabel, setDepartmentLabel] = useState(DEFAULT_APPLY_CONFIG.departmentLabel);
  const [emailLabel, setEmailLabel] = useState(DEFAULT_APPLY_CONFIG.emailLabel);
  const [phoneLabel, setPhoneLabel] = useState(DEFAULT_APPLY_CONFIG.phoneLabel);
  const [messageLabel, setMessageLabel] = useState(DEFAULT_APPLY_CONFIG.messageLabel);
  const [phFirst, setPhFirst] = useState(DEFAULT_APPLY_CONFIG.placeholders.firstName);
  const [phLast, setPhLast] = useState(DEFAULT_APPLY_CONFIG.placeholders.lastName);
  const [phEmail, setPhEmail] = useState(DEFAULT_APPLY_CONFIG.placeholders.email);
  const [phPhone, setPhPhone] = useState(DEFAULT_APPLY_CONFIG.placeholders.phone);
  const [phMessage, setPhMessage] = useState(DEFAULT_APPLY_CONFIG.placeholders.message);
  const [yearLines, setYearLines] = useState(() => DEFAULT_APPLY_CONFIG.yearOptions.join("\n"));
  const [deptLines, setDeptLines] = useState(() =>
    DEFAULT_APPLY_CONFIG.departmentOptions.join("\n"),
  );
  const [charterLinkText, setCharterLinkText] = useState(DEFAULT_APPLY_CONFIG.charterLinkText);
  const [charterLinkHref, setCharterLinkHref] = useState(DEFAULT_APPLY_CONFIG.charterLinkHref);
  const [charterLinkHrefFr, setCharterLinkHrefFr] = useState("");
  const [submitNotePrefix, setSubmitNotePrefix] = useState(DEFAULT_APPLY_CONFIG.submitNotePrefix);
  const [submitButtonLabel, setSubmitButtonLabel] = useState(DEFAULT_APPLY_CONFIG.submitButtonLabel);
  const [successTitle, setSuccessTitle] = useState(DEFAULT_APPLY_CONFIG.successTitle);
  const [successMessage, setSuccessMessage] = useState(DEFAULT_APPLY_CONFIG.successMessage);

  const [community, setCommunity] = useState<ApplyCommunityConfig>(() =>
    structuredClone(DEFAULT_COMMUNITY_CONFIG),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db(), "apply"));
        if (!snap.empty && !cancelled) {
          const byId: Record<string, Record<string, unknown>> = {};
          snap.forEach((d) => {
            byId[d.id] = d.data() as Record<string, unknown>;
          });
          const merged =
            Object.keys(byId).length > 0 ? mergeApplyCollectionDocs(byId) : mergeApplyFromFirestore({});
          setTopLabel(merged.topLabel);
          setHeroLine1(merged.heroLine1);
          setHeroLine2(merged.heroLine2);
          setHeroSub(merged.heroSub);
          setInfoBadge(merged.infoBadge);
          setInfoTitle(merged.infoTitle);
          setInfoDesc(merged.infoDesc);
          setContactRows(merged.contactRows.map((r) => ({ ...r })));
          setSocialLinks(normalizeSocials(merged.socialLinks));
          setFormTitle(merged.formTitle);
          setFormSubtitle(merged.formSubtitle);
          setFirstNameLabel(merged.firstNameLabel);
          setLastNameLabel(merged.lastNameLabel);
          setYearLabel(merged.yearLabel);
          setDepartmentLabel(merged.departmentLabel);
          setEmailLabel(merged.emailLabel);
          setPhoneLabel(merged.phoneLabel);
          setMessageLabel(merged.messageLabel);
          setPhFirst(merged.placeholders.firstName);
          setPhLast(merged.placeholders.lastName);
          setPhEmail(merged.placeholders.email);
          setPhPhone(merged.placeholders.phone);
          setPhMessage(merged.placeholders.message);
          setYearLines(merged.yearOptions.join("\n"));
          setDeptLines(merged.departmentOptions.join("\n"));
          setCharterLinkText(merged.charterLinkText);
          setCharterLinkHref(merged.charterLinkHref);
          setCharterLinkHrefFr(merged.charterLinkHrefFr ?? "");
          setSubmitNotePrefix(merged.submitNotePrefix);
          setSubmitButtonLabel(merged.submitButtonLabel);
          setSuccessTitle(merged.successTitle);
          setSuccessMessage(merged.successMessage);
          setCommunity(structuredClone(merged.community ?? DEFAULT_COMMUNITY_CONFIG));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load apply section.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const years = yearLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20);
      const depts = deptLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 30);
      if (!years.length) throw new Error("Add at least one education year (one per line).");
      if (!depts.length) throw new Error("Add at least one department (one per line).");

      const rowsClean = contactRows
        .map((r) => ({
          label: safeTrim(r.label),
          value: typeof r.value === "string" ? r.value : "",
          iconKey: r.iconKey,
          tone: r.tone,
        }))
        .filter((r) => r.label && r.value)
        .slice(0, 8);
      if (!rowsClean.length) throw new Error("Add at least one contact row.");

      const socials = normalizeSocials(socialLinks);
      const socialObj: Record<string, string> = {};
      for (const p of ["instagram", "linkedin", "twitter", "youtube"] as const) {
        socialObj[p] = socials.find((s) => s.platform === p)?.url ?? "";
      }

      const contactDocRows = rowsClean.map((r, i) => ({
        id: `row-${i}`,
        label: r.label,
        value: r.value,
        type: r.iconKey,
        accent: r.tone,
        order: i,
      }));

      await Promise.all([
        setDoc(
          doc(db(), "apply", "hero"),
          {
            stepLabel: safeTrim(topLabel) || DEFAULT_APPLY_CONFIG.topLabel,
            titleLine1: safeTrim(heroLine1) || DEFAULT_APPLY_CONFIG.heroLine1,
            titleLine2: safeTrim(heroLine2) || DEFAULT_APPLY_CONFIG.heroLine2,
            subtitle: safeTrim(heroSub) || DEFAULT_APPLY_CONFIG.heroSub,
          },
          { merge: true },
        ),
        setDoc(
          doc(db(), "apply", "leftPanel"),
          {
            badge: safeTrim(infoBadge) || DEFAULT_APPLY_CONFIG.infoBadge,
            title: safeTrim(infoTitle) || DEFAULT_APPLY_CONFIG.infoTitle,
            description: safeTrim(infoDesc) || DEFAULT_APPLY_CONFIG.infoDesc,
          },
          { merge: true },
        ),
        setDoc(doc(db(), "apply", "contactRows"), { rows: contactDocRows }, { merge: true }),
        setDoc(doc(db(), "apply", "socialLinks"), socialObj, { merge: true }),
        setDoc(
          doc(db(), "apply", "form"),
          {
            formTitle: safeTrim(formTitle) || DEFAULT_APPLY_CONFIG.formTitle,
            formSubtitle: safeTrim(formSubtitle) || DEFAULT_APPLY_CONFIG.formSubtitle,
            fieldLabels: {
              firstName: safeTrim(firstNameLabel) || DEFAULT_APPLY_CONFIG.firstNameLabel,
              lastName: safeTrim(lastNameLabel) || DEFAULT_APPLY_CONFIG.lastNameLabel,
              year: safeTrim(yearLabel) || DEFAULT_APPLY_CONFIG.yearLabel,
              department: safeTrim(departmentLabel) || DEFAULT_APPLY_CONFIG.departmentLabel,
              email: safeTrim(emailLabel) || DEFAULT_APPLY_CONFIG.emailLabel,
              phone: safeTrim(phoneLabel) || DEFAULT_APPLY_CONFIG.phoneLabel,
              message: safeTrim(messageLabel) || DEFAULT_APPLY_CONFIG.messageLabel,
            },
            placeholders: {
              firstName: safeTrim(phFirst) || DEFAULT_APPLY_CONFIG.placeholders.firstName,
              lastName: safeTrim(phLast) || DEFAULT_APPLY_CONFIG.placeholders.lastName,
              email: safeTrim(phEmail) || DEFAULT_APPLY_CONFIG.placeholders.email,
              phone: safeTrim(phPhone) || DEFAULT_APPLY_CONFIG.placeholders.phone,
              message: safeTrim(phMessage) || DEFAULT_APPLY_CONFIG.placeholders.message,
            },
            yearOptions: years,
            departmentOptions: depts.map((d) => ({
              label: d,
              value: d.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            })),
          },
          { merge: true },
        ),
        setDoc(
          doc(db(), "apply", "submitBlock"),
          {
            charterText: safeTrim(charterLinkText) || DEFAULT_APPLY_CONFIG.charterLinkText,
            charterUrl: safeTrim(charterLinkHref) || DEFAULT_APPLY_CONFIG.charterLinkHref,
            charterUrlFr: safeTrim(charterLinkHrefFr) || "",
            submitNotePrefix: safeTrim(submitNotePrefix) || DEFAULT_APPLY_CONFIG.submitNotePrefix,
            submitLabel: safeTrim(submitButtonLabel) || DEFAULT_APPLY_CONFIG.submitButtonLabel,
            successTitle: safeTrim(successTitle) || DEFAULT_APPLY_CONFIG.successTitle,
            successMessage: safeTrim(successMessage) || DEFAULT_APPLY_CONFIG.successMessage,
          },
          { merge: true },
        ),
        setDoc(
          doc(db(), "apply", "community"),
          {
            isVisible: community.isVisible,
            eyebrow: safeTrim(community.eyebrow),
            titleLine: safeTrim(community.titleLine) || DEFAULT_COMMUNITY_CONFIG.titleLine,
            titleAccent: safeTrim(community.titleAccent) || DEFAULT_COMMUNITY_CONFIG.titleAccent,
            description: safeTrim(community.description) || DEFAULT_COMMUNITY_CONFIG.description,
            actions: community.actions
              .map((a, idx) => ({
                id: a.id || `${a.platform}-${idx}`,
                platform: a.platform,
                label: safeTrim(a.label),
                url: safeTrim(a.url),
                color: a.color,
                customHex: isValidHex(a.customHex) ? safeTrim(a.customHex) : "",
                isVisible: a.isVisible !== false,
                order: idx,
              }))
              .filter((a) => a.label),
          },
          { merge: true },
        ),
      ]);
      setSuccess("Apply section saved. The homepage updates live for visitors.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function updateContactRow(index: number, patch: Partial<ApplyContactRow>) {
    setContactRows((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (!cur) return prev;
      next[index] = { ...cur, ...patch };
      return next;
    });
  }

  function addContactRow() {
    setContactRows((prev) =>
      prev.length >= 8
        ? prev
        : [
            ...prev,
            {
              label: "New row",
              value: "Details",
              iconKey: "map",
              tone: "blue",
            },
          ],
    );
  }

  function removeContactRow(index: number) {
    setContactRows((prev) => prev.filter((_, i) => i !== index));
  }

  function setSocialUrl(platform: ApplySocialPlatform, url: string) {
    setSocialLinks((prev) =>
      normalizeSocials(prev).map((l) => (l.platform === platform ? { ...l, url } : l)),
    );
  }

  function patchCommunityAction(index: number, patch: Partial<ApplyCommunityAction>) {
    setCommunity((prev) => {
      const next = [...prev.actions];
      const cur = next[index];
      if (!cur) return prev;
      next[index] = { ...cur, ...patch };
      return { ...prev, actions: next };
    });
  }

  function moveCommunityAction(index: number, dir: -1 | 1) {
    setCommunity((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.actions.length) return prev;
      const next = [...prev.actions];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return {
        ...prev,
        actions: next.map((a, i) => ({ ...a, order: i })),
      };
    });
  }

  function addCommunityAction() {
    setCommunity((prev) => {
      if (prev.actions.length >= 8) return prev;
      const id = `action-${Date.now()}`;
      return {
        ...prev,
        actions: [
          ...prev.actions,
          {
            id,
            platform: "generic",
            label: "New link",
            url: "",
            color: "violet",
            isVisible: true,
            order: prev.actions.length,
          },
        ],
      };
    });
  }

  function removeCommunityAction(index: number) {
    setCommunity((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i })),
    }));
  }

  if (loading) {
    return <p className="px-6 py-12 text-sm text-white/60">Loading apply section…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Homepage — Apply</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Edit the full-width apply / contact block (hero, sidebar contact cards, form copy, dropdown
        options, social links, and success message). Submissions are stored in Firestore via{" "}
        <code className="text-white/80">/api/apply</code>.
      </p>

      <div className="mt-8 space-y-8">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/80">Hero</p>
          <label className="block text-sm">
            <span className="text-white/70">Top label</span>
            <input
              value={topLabel}
              onChange={(e) => setTopLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/70">Title line 1</span>
              <input
                value={heroLine1}
                onChange={(e) => setHeroLine1(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Title line 2 (gradient)</span>
              <input
                value={heroLine2}
                onChange={(e) => setHeroLine2(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-white/70">Subtitle</span>
            <textarea
              value={heroSub}
              onChange={(e) => setHeroSub(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/80">Left panel</p>
          <label className="block text-sm">
            <span className="text-white/70">Badge</span>
            <input
              value={infoBadge}
              onChange={(e) => setInfoBadge(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Title</span>
            <input
              value={infoTitle}
              onChange={(e) => setInfoTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Description</span>
            <textarea
              value={infoDesc}
              onChange={(e) => setInfoDesc(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-white/80">Contact rows</p>
            <button
              type="button"
              onClick={addContactRow}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:border-white/30"
            >
              Add row
            </button>
          </div>
          <p className="text-xs text-white/50">
            Use line breaks in the value for multi-line text (address, hours). Max 8 rows.
          </p>
          <div className="space-y-3">
            {contactRows.map((row, idx) => (
              <div
                key={`${row.label}-${row.iconKey}-${idx}`}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:flex-row md:flex-wrap md:items-end"
              >
                <input
                  value={row.label}
                  onChange={(e) => updateContactRow(idx, { label: e.target.value })}
                  placeholder="Label"
                  className="min-w-[140px] flex-1 rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                />
                <textarea
                  value={row.value}
                  onChange={(e) => updateContactRow(idx, { value: e.target.value })}
                  placeholder="Value (use Enter for line breaks)"
                  rows={2}
                  className="min-w-[200px] flex-[2] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                />
                <select
                  value={row.iconKey}
                  onChange={(e) =>
                    updateContactRow(idx, { iconKey: e.target.value as ApplyContactIconKey })
                  }
                  className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                >
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  value={row.tone}
                  onChange={(e) =>
                    updateContactRow(idx, { tone: e.target.value as ApplyContactTone })
                  }
                  className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                >
                  {TONE_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeContactRow(idx)}
                  className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 md:ml-auto"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/80">Social links</p>
          <p className="text-xs text-white/50">
            Leave URL empty to hide that icon on the public site.
          </p>
          {normalizeSocials(socialLinks).map((link) => (
            <label key={link.platform} className="block text-sm capitalize">
              <span className="text-white/70">{link.platform}</span>
              <input
                value={link.url}
                onChange={(e) => setSocialUrl(link.platform, e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/80">Form</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Form title</span>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Form subtitle</span>
              <input
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">First name label</span>
              <input
                value={firstNameLabel}
                onChange={(e) => setFirstNameLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Last name label</span>
              <input
                value={lastNameLabel}
                onChange={(e) => setLastNameLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Year label</span>
              <input
                value={yearLabel}
                onChange={(e) => setYearLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Department label</span>
              <input
                value={departmentLabel}
                onChange={(e) => setDepartmentLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Email label</span>
              <input
                value={emailLabel}
                onChange={(e) => setEmailLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Phone label</span>
              <input
                value={phoneLabel}
                onChange={(e) => setPhoneLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Message label</span>
              <input
                value={messageLabel}
                onChange={(e) => setMessageLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
          </div>
          <p className="text-xs font-medium text-white/60">Placeholders</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={phFirst}
              onChange={(e) => setPhFirst(e.target.value)}
              placeholder="First name placeholder"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <input
              value={phLast}
              onChange={(e) => setPhLast(e.target.value)}
              placeholder="Last name placeholder"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <input
              value={phEmail}
              onChange={(e) => setPhEmail(e.target.value)}
              placeholder="Email placeholder"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <input
              value={phPhone}
              onChange={(e) => setPhPhone(e.target.value)}
              placeholder="Phone placeholder"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={phMessage}
              onChange={(e) => setPhMessage(e.target.value)}
              placeholder="Message placeholder"
              rows={2}
              className="sm:col-span-2 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            />
          </div>
          <label className="block text-sm">
            <span className="text-white/70">Year options (one per line)</span>
            <textarea
              value={yearLines}
              onChange={(e) => setYearLines(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Department options (one per line)</span>
            <textarea
              value={deptLines}
              onChange={(e) => setDeptLines(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none focus:border-white/35"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/80">Submit note & success</p>
          <label className="block text-sm">
            <span className="text-white/70">Note before charter link</span>
            <input
              value={submitNotePrefix}
              onChange={(e) => setSubmitNotePrefix(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/70">Charter link text</span>
              <input
                value={charterLinkText}
                onChange={(e) => setCharterLinkText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Charter URL (English)</span>
              <input
                value={charterLinkHref}
                onChange={(e) => setCharterLinkHref(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-blue-300/80">Charter URL (French)</span>
              <input
                value={charterLinkHrefFr}
                onChange={(e) => setCharterLinkHrefFr(e.target.value)}
                placeholder="Leave empty to use the English URL"
                className="mt-1 w-full rounded-lg border border-blue-500/25 bg-blue-950/20 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-blue-400/40"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-white/70">Submit button label</span>
            <input
              value={submitButtonLabel}
              onChange={(e) => setSubmitButtonLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Success title</span>
            <input
              value={successTitle}
              onChange={(e) => setSuccessTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Success message</span>
            <textarea
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/80">Community card</p>
              <p className="mt-0.5 text-xs text-white/50">
                The &quot;Ready to join this Community?&quot; card below the apply form. Add Discord,
                WhatsApp, Telegram, Slack, or any link with its own color.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                checked={community.isVisible}
                onChange={(e) => setCommunity((prev) => ({ ...prev, isVisible: e.target.checked }))}
              />
              Card visible
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/70">Eyebrow (optional)</span>
              <input
                value={community.eyebrow}
                onChange={(e) => setCommunity((prev) => ({ ...prev, eyebrow: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
                placeholder="e.g. Community"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Title line</span>
              <input
                value={community.titleLine}
                onChange={(e) => setCommunity((prev) => ({ ...prev, titleLine: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
                placeholder="Ready to join this"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Title accent (gradient word)</span>
              <input
                value={community.titleAccent}
                onChange={(e) => setCommunity((prev) => ({ ...prev, titleAccent: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
                placeholder="Community?"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-white/70">Description</span>
            <textarea
              value={community.description}
              onChange={(e) => setCommunity((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              placeholder="Join our vibrant communities! …"
            />
          </label>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-white/80">Actions</p>
              <button
                type="button"
                onClick={addCommunityAction}
                disabled={community.actions.length >= 8}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-3.5" /> Add action
              </button>
            </div>
            {community.actions.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-white/55">
                No actions yet. Add Discord / WhatsApp or any other link button.
              </p>
            ) : (
              <div className="space-y-3">
                {community.actions.map((action, i) => (
                  <div
                    key={action.id}
                    className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveCommunityAction(i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                          className="rounded-md border border-white/20 p-1.5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCommunityAction(i, 1)}
                          disabled={i === community.actions.length - 1}
                          aria-label="Move down"
                          className="rounded-md border border-white/20 p-1.5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white/85">
                        <CommunityPlatformIcon platform={action.platform} className="size-4" />
                      </span>
                      <label className="flex items-center gap-1.5 text-xs text-white/70">
                        <input
                          type="checkbox"
                          checked={action.isVisible}
                          onChange={(e) => patchCommunityAction(i, { isVisible: e.target.checked })}
                        />
                        visible
                      </label>
                      <button
                        type="button"
                        onClick={() => removeCommunityAction(i)}
                        aria-label="Remove action"
                        className="ml-auto rounded-md border border-rose-400/30 p-1.5 text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-white/70">
                        <span>Button label</span>
                        <input
                          value={action.label}
                          onChange={(e) => patchCommunityAction(i, { label: e.target.value })}
                          placeholder="Join Discord"
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-sm text-white"
                        />
                      </label>
                      <label className="block text-xs text-white/70">
                        <span>URL</span>
                        <input
                          value={action.url}
                          onChange={(e) => patchCommunityAction(i, { url: e.target.value })}
                          placeholder="https://discord.gg/…"
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-sm text-white"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
                      <label className="block text-xs text-white/70">
                        <span>Platform (icon)</span>
                        <select
                          value={action.platform}
                          onChange={(e) =>
                            patchCommunityAction(i, {
                              platform: e.target.value as ApplyCommunityPlatform,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                        >
                          {COMMUNITY_PLATFORMS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs text-white/70">
                        <span>Color preset</span>
                        <select
                          value={action.color}
                          onChange={(e) => {
                            const next = e.target.value as ApplyCommunityColor;
                            const patch: Partial<ApplyCommunityAction> = { color: next };
                            if (next !== "custom") patch.customHex = "";
                            patchCommunityAction(i, patch);
                          }}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                        >
                          {COMMUNITY_COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c === "custom" ? "— custom HEX —" : c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="block text-xs text-white/70">
                        <span>Swatch</span>
                        <div
                          className="mt-1 h-[34px] w-full min-w-[44px] rounded-lg border border-white/15"
                          style={{
                            background: getActionPreviewColor(action),
                          }}
                          aria-label="Color preview"
                        />
                      </div>
                      <label className="block text-xs text-white/70">
                        <span>
                          Custom HEX{" "}
                          <span className="text-white/40">
                            {action.color === "custom" ? "(in use)" : "(pick “custom” to use)"}
                          </span>
                        </span>
                        <input
                          value={action.customHex ?? ""}
                          onChange={(e) => {
                            const next = e.target.value.trim();
                            const patch: Partial<ApplyCommunityAction> = { customHex: next };
                            if (next.length > 0) patch.color = "custom";
                            patchCommunityAction(i, patch);
                          }}
                          placeholder="#5865F2"
                          spellCheck={false}
                          className={`mt-1 w-full rounded-lg border bg-black/40 px-2.5 py-1.5 font-mono text-sm ${
                            action.color === "custom"
                              ? isValidHex(action.customHex)
                                ? "border-white/15 text-white"
                                : "border-rose-400/50 text-white"
                              : "border-white/10 text-white/40"
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="mt-6 text-sm text-emerald-300">{success}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl border border-sky-400/40 bg-sky-500/15 px-5 py-2.5 text-sm font-medium text-sky-100 hover:bg-sky-500/25 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save to Firestore"}
        </button>
      </div>
    </div>
  );
}
