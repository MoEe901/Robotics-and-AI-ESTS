"use client";

import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import type { FaqCategory, FaqItem, FaqItemColor } from "@/lib/firebase/types";
import { DEFAULT_FAQ_CONFIG } from "@/lib/content/faq-defaults";

const FAQ_ICON_OPTIONS = [
  { key: "circle-dollar-sign", label: "Circle dollar" },
  { key: "calendar", label: "Calendar" },
  { key: "lightbulb", label: "Lightbulb" },
  { key: "trending-up", label: "Trending up" },
  { key: "users", label: "Users" },
  { key: "code", label: "Code" },
  { key: "award", label: "Award" },
  { key: "clock", label: "Clock" },
  { key: "help-circle", label: "Help" },
  { key: "message-circle", label: "Message" },
  { key: "sparkles", label: "Sparkles" },
  { key: "target", label: "Target" },
] as const;

const FAQ_COLOR_OPTIONS: { key: FaqItemColor; label: string }[] = [
  { key: "blue", label: "Blue" },
  { key: "violet", label: "Violet" },
  { key: "pink", label: "Pink" },
  { key: "amber", label: "Amber" },
  { key: "green", label: "Green" },
];

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugifyId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

export function FaqConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [eyebrow, setEyebrow] = useState(DEFAULT_FAQ_CONFIG.eyebrow);
  const [titleLine, setTitleLine] = useState(DEFAULT_FAQ_CONFIG.titleLine);
  const [titleAccent, setTitleAccent] = useState(DEFAULT_FAQ_CONFIG.titleAccent);
  const [subtitle, setSubtitle] = useState(DEFAULT_FAQ_CONFIG.subtitle);
  const [categories, setCategories] = useState<FaqCategory[]>(() =>
    DEFAULT_FAQ_CONFIG.categories.map((c) => ({ ...c })),
  );
  const [items, setItems] = useState<FaqItem[]>(() => DEFAULT_FAQ_CONFIG.items.map((i) => ({ ...i })));
  const [ctaTitle, setCtaTitle] = useState(DEFAULT_FAQ_CONFIG.ctaTitle);
  const [ctaSubtitle, setCtaSubtitle] = useState(DEFAULT_FAQ_CONFIG.ctaSubtitle);
  const [ctaButtonLabel, setCtaButtonLabel] = useState(DEFAULT_FAQ_CONFIG.ctaButtonLabel);
  const [ctaButtonHref, setCtaButtonHref] = useState(DEFAULT_FAQ_CONFIG.ctaButtonHref);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "faq", "config"));
        const qSnap = await getDocs(collection(db(), "faq", "config", "questions"));
        if (snap.exists() && !cancelled) {
          const raw = snap.data() as Record<string, unknown>;
          const e = typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "";
          const tl = typeof raw.titleLine === "string" ? raw.titleLine : "";
          const ta = typeof raw.titleAccent === "string" ? raw.titleAccent.trim() : "";
          const st = typeof raw.subtitle === "string" ? raw.subtitle.trim() : "";
          const catRaw = Array.isArray(raw.categories) ? raw.categories : [];
          const parsedCats = catRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const id = typeof o.id === "string" ? slugifyId(o.id) : "";
              const label = typeof o.label === "string" ? o.label.trim() : "";
              if (!id || !label) return null;
              return { id, label };
            })
            .filter((c): c is FaqCategory => Boolean(c));
          const itRaw =
            !qSnap.empty
              ? qSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
              : Array.isArray(raw.items)
                ? raw.items
                : [];
          const parsedItems = itRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const categoryId = typeof o.categoryId === "string" ? slugifyId(o.categoryId) : "";
              const question = typeof o.question === "string" ? o.question.trim() : "";
              const answer = typeof o.answer === "string" ? o.answer.trim() : "";
              const color = (
                typeof o.accentColor === "string"
                  ? o.accentColor
                  : typeof o.color === "string"
                    ? o.color
                    : "blue"
              )
                .trim()
                .toLowerCase() as FaqItemColor;
              const iconKeyRaw =
                typeof o.icon === "string" ? o.icon : typeof o.iconKey === "string" ? o.iconKey : "help-circle";
              const iconKey = iconKeyRaw.trim().toLowerCase();
              if (!categoryId || !question || !answer) return null;
              return {
                categoryId,
                question,
                answer,
                color: FAQ_COLOR_OPTIONS.some((c) => c.key === color) ? color : "blue",
                iconKey: FAQ_ICON_OPTIONS.some((x) => x.key === iconKey) ? iconKey : "help-circle",
              } satisfies FaqItem;
            })
            .filter((it): it is FaqItem => Boolean(it));
          if (parsedCats.length && parsedItems.length) {
            setEyebrow(e || DEFAULT_FAQ_CONFIG.eyebrow);
            const titleFromDoc = typeof raw.title === "string" ? raw.title.trim() : "";
            const accentFromDoc = typeof raw.accent === "string" ? raw.accent.trim() : "";
            setTitleLine(titleFromDoc || tl || DEFAULT_FAQ_CONFIG.titleLine);
            setTitleAccent(accentFromDoc || ta || DEFAULT_FAQ_CONFIG.titleAccent);
            setSubtitle(st || DEFAULT_FAQ_CONFIG.subtitle);
            setCategories(parsedCats);
            setItems(parsedItems);
            setCtaTitle(safeTrim(raw.ctaTitle) || DEFAULT_FAQ_CONFIG.ctaTitle);
            setCtaSubtitle(safeTrim(raw.ctaSubtitle) || DEFAULT_FAQ_CONFIG.ctaSubtitle);
            setCtaButtonLabel(safeTrim(raw.ctaButtonLabel) || DEFAULT_FAQ_CONFIG.ctaButtonLabel);
            setCtaButtonHref(safeTrim(raw.ctaButtonHref) || DEFAULT_FAQ_CONFIG.ctaButtonHref);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load FAQ.");
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
      const catsClean = categories
        .map((c) => ({ id: slugifyId(c.id), label: safeTrim(c.label) }))
        .filter((c) => c.id && c.label)
        .slice(0, 12);
      const seen = new Set<string>();
      for (const c of catsClean) {
        if (seen.has(c.id)) throw new Error(`Duplicate category id: ${c.id}`);
        seen.add(c.id);
      }
      if (!catsClean.length) throw new Error("Add at least one FAQ category.");

      const itemsClean = items
        .map((it) => ({
          categoryId: slugifyId(it.categoryId),
          question: safeTrim(it.question),
          answer: safeTrim(it.answer),
          color: (FAQ_COLOR_OPTIONS.some((c) => c.key === it.color) ? it.color : "blue") as FaqItemColor,
          iconKey: FAQ_ICON_OPTIONS.some((x) => x.key === it.iconKey) ? it.iconKey : "help-circle",
        }))
        .filter((it) => it.question && it.answer && it.categoryId)
        .slice(0, 24);
      if (!itemsClean.length) throw new Error("Add at least one FAQ item.");

      const catSet = new Set(catsClean.map((c) => c.id));
      for (const it of itemsClean) {
        if (!catSet.has(it.categoryId)) {
          throw new Error(`FAQ item "${it.question.slice(0, 40)}…" uses unknown category "${it.categoryId}".`);
        }
      }

      await setDoc(
        doc(db(), "faq", "config"),
        {
          eyebrow: safeTrim(eyebrow) || DEFAULT_FAQ_CONFIG.eyebrow,
          title: titleLine !== "" ? titleLine : DEFAULT_FAQ_CONFIG.titleLine,
          accent: safeTrim(titleAccent) || DEFAULT_FAQ_CONFIG.titleAccent,
          titleLine: titleLine !== "" ? titleLine : DEFAULT_FAQ_CONFIG.titleLine,
          titleAccent: safeTrim(titleAccent) || DEFAULT_FAQ_CONFIG.titleAccent,
          subtitle: safeTrim(subtitle) || DEFAULT_FAQ_CONFIG.subtitle,
          categories: catsClean,
          ctaTitle: safeTrim(ctaTitle) || DEFAULT_FAQ_CONFIG.ctaTitle,
          ctaSubtitle: safeTrim(ctaSubtitle) || DEFAULT_FAQ_CONFIG.ctaSubtitle,
          ctaButtonLabel: safeTrim(ctaButtonLabel) || DEFAULT_FAQ_CONFIG.ctaButtonLabel,
          ctaButtonHref: safeTrim(ctaButtonHref) || DEFAULT_FAQ_CONFIG.ctaButtonHref,
        },
        { merge: true },
      );

      const qCol = collection(db(), "faq", "config", "questions");
      const existing = await getDocs(qCol);
      for (const d of existing.docs) {
        await deleteDoc(d.ref);
      }
      for (let idx = 0; idx < itemsClean.length; idx++) {
        const it = itemsClean[idx]!;
        await setDoc(doc(qCol), {
          categoryId: it.categoryId,
          question: it.question,
          answer: it.answer,
          accentColor: it.color,
          icon: it.iconKey,
          order: idx,
          isVisible: true,
        });
      }
      setSuccess("FAQ saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save FAQ.");
    } finally {
      setSaving(false);
    }
  }

  const firstCatId = slugifyId(categories[0]?.id ?? "") || "general";

  if (loading) {
    return <p className="px-6 py-12 text-sm text-white/60">Loading FAQ configuration…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-white">FAQ</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Homepage FAQ below the team section: topics filter, accordion answers, and contact CTA.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white/80">Section header</p>
        <label className="block text-sm">
          <span className="text-white/70">Eyebrow</span>
          <input
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-white/70">Title (before accent)</span>
            <input
              value={titleLine}
              onChange={(e) => setTitleLine(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Accent word</span>
            <input
              value={titleAccent}
              onChange={(e) => setTitleAccent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-white/70">Subtitle</span>
          <textarea
            rows={2}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
          />
        </label>
      </div>

      <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white/80">Categories (sidebar filters)</p>
        {categories.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-end">
            <label className="block min-w-0 flex-1 text-xs text-white/60">
              ID (slug)
              <input
                value={c.id}
                onChange={(e) => {
                  const next = [...categories];
                  next[i] = { ...next[i], id: e.target.value };
                  setCategories(next);
                }}
                placeholder="membership"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block min-w-0 flex-1 text-xs text-white/60">
              Label
              <input
                value={c.label}
                onChange={(e) => {
                  const next = [...categories];
                  next[i] = { ...next[i], label: e.target.value };
                  setCategories(next);
                }}
                placeholder="Membership"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const id = categories[i]?.id;
                if (id && items.some((it) => it.categoryId === slugifyId(id))) {
                  setError("Remove or reassign FAQ items using this category before deleting it.");
                  return;
                }
                setError(null);
                setCategories((prev) => prev.filter((_, idx) => idx !== i));
              }}
              className="shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setCategories((prev) => [...prev, { id: `topic-${prev.length + 1}`, label: "New topic" }])
          }
          disabled={categories.length >= 12}
          className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:opacity-40"
        >
          Add category
        </button>
      </div>

      <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white/80">Questions</p>
        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/50">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
              >
                Remove
              </button>
            </div>
            <label className="block text-xs text-white/60">
              Category
              <select
                value={it.categoryId}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], categoryId: e.target.value };
                  setItems(next);
                }}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
              >
                {categories.map((c) => (
                  <option key={c.id} value={slugifyId(c.id)}>
                    {c.label || c.id}
                  </option>
                ))}
              </select>
            </label>
            <input
              value={it.question}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], question: e.target.value };
                setItems(next);
              }}
              placeholder="Question"
              className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
            />
            <textarea
              rows={3}
              value={it.answer}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], answer: e.target.value };
                setItems(next);
              }}
              placeholder="Answer"
              className="w-full resize-y rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-white/60">
                Accent color
                <select
                  value={it.color}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], color: e.target.value as FaqItemColor };
                    setItems(next);
                  }}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
                >
                  {FAQ_COLOR_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-white/60">
                Icon
                <select
                  value={it.iconKey}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], iconKey: e.target.value };
                    setItems(next);
                  }}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
                >
                  {FAQ_ICON_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              {
                categoryId: firstCatId,
                question: "",
                answer: "",
                color: "blue",
                iconKey: "help-circle",
              },
            ])
          }
          disabled={items.length >= 24}
          className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:opacity-40"
        >
          Add question
        </button>
      </div>

      <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white/80">Bottom CTA</p>
        <label className="block text-sm">
          <span className="text-white/70">Title</span>
          <input
            value={ctaTitle}
            onChange={(e) => setCtaTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
          />
        </label>
        <label className="block text-sm">
          <span className="text-white/70">Subtitle</span>
          <input
            value={ctaSubtitle}
            onChange={(e) => setCtaSubtitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-white/70">Button label</span>
            <input
              value={ctaButtonLabel}
              onChange={(e) => setCtaButtonLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Button link</span>
            <input
              value={ctaButtonHref}
              onChange={(e) => setCtaButtonHref(e.target.value)}
              placeholder="/#apply or mailto:…"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
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

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-full border border-white/20 bg-white/[0.1] px-5 py-2 text-sm font-medium text-white hover:border-white/35 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEyebrow(DEFAULT_FAQ_CONFIG.eyebrow);
            setTitleLine(DEFAULT_FAQ_CONFIG.titleLine);
            setTitleAccent(DEFAULT_FAQ_CONFIG.titleAccent);
            setSubtitle(DEFAULT_FAQ_CONFIG.subtitle);
            setCategories(DEFAULT_FAQ_CONFIG.categories.map((c) => ({ ...c })));
            setItems(DEFAULT_FAQ_CONFIG.items.map((x) => ({ ...x })));
            setCtaTitle(DEFAULT_FAQ_CONFIG.ctaTitle);
            setCtaSubtitle(DEFAULT_FAQ_CONFIG.ctaSubtitle);
            setCtaButtonLabel(DEFAULT_FAQ_CONFIG.ctaButtonLabel);
            setCtaButtonHref(DEFAULT_FAQ_CONFIG.ctaButtonHref);
            setError(null);
            setSuccess(null);
          }}
          className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 hover:border-white/25 hover:text-white"
        >
          Reset form to defaults
        </button>
      </div>
    </div>
  );
}
