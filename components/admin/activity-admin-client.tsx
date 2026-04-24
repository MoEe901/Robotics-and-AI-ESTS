"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Activity as ActivityIcon,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Code2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";

type ActivityRow = {
  id: string;
  title: string;
  isVisible: boolean;
  createdAt: string;
};

type TechPill = {
  id: string;
  label: string;
  accent: "violet" | "cyan" | "mixed";
  order: number;
  isVisible: boolean;
};

type CardHeader = { isVisible: boolean; eyebrow: string; title: string };

const DEFAULT_ACTIVITY_HEADER: CardHeader = {
  isVisible: true,
  eyebrow: "Live Activity",
  title: "Club Updates",
};
const DEFAULT_TECH_HEADER: CardHeader = {
  isVisible: true,
  eyebrow: "Tech Stack",
  title: "What We Build With",
};
const DEFAULT_GROWTH: {
  isVisible: boolean;
  eyebrow: string;
  title: string;
  months: 3 | 6 | 12;
} = {
  isVisible: true,
  eyebrow: "Growth",
  title: "Club stats",
  months: 6,
};

const DEFAULT_TECH_PILLS: TechPill[] = [
  { id: "python", label: "Python", accent: "cyan", order: 0, isVisible: true },
  { id: "ros2", label: "ROS2", accent: "violet", order: 1, isVisible: true },
  { id: "arduino", label: "Arduino", accent: "mixed", order: 2, isVisible: true },
  { id: "tensorflow", label: "TensorFlow", accent: "violet", order: 3, isVisible: true },
  { id: "opencv", label: "OpenCV", accent: "cyan", order: 4, isVisible: true },
  { id: "matlab", label: "MATLAB", accent: "mixed", order: 5, isVisible: true },
];

const ACCENTS: Array<{ value: TechPill["accent"]; label: string; swatch: string }> = [
  { value: "violet", label: "Violet", swatch: "bg-violet-500" },
  { value: "cyan", label: "Cyan", swatch: "bg-cyan-400" },
  { value: "mixed", label: "Mixed", swatch: "bg-fuchsia-400" },
];

function makePillId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

export function ActivityAdminClient() {
  // Live Activity — posts
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [title, setTitle] = useState("");

  // Card headers
  const [activityHeader, setActivityHeader] = useState<CardHeader>(DEFAULT_ACTIVITY_HEADER);
  const [techHeader, setTechHeader] = useState<CardHeader>(DEFAULT_TECH_HEADER);
  const [growth, setGrowth] = useState(DEFAULT_GROWTH);
  const [techPills, setTechPills] = useState<TechPill[]>(DEFAULT_TECH_PILLS);
  const [newPillLabel, setNewPillLabel] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Subscribe to activity posts (same collection as the hero live-activity card).
  useEffect(() => {
    const q = query(collection(db(), "activity"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = data.createdAt as { toDate?: () => Date } | undefined;
          return {
            id: d.id,
            title: typeof data.title === "string" ? data.title : "",
            isVisible: data.isVisible !== false,
            createdAt: ts?.toDate ? ts.toDate().toISOString() : "",
          };
        }),
      );
    });
  }, []);

  // Subscribe to hero doc — single source of truth for the three card configs.
  useEffect(() => {
    return onSnapshot(doc(db(), "siteContent", "hero"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, unknown>;
      const cards =
        data.heroCards && typeof data.heroCards === "object"
          ? (data.heroCards as Record<string, unknown>)
          : {};
      const a = (cards.activity ?? {}) as Record<string, unknown>;
      const t = (cards.techStack ?? {}) as Record<string, unknown>;
      const g = (cards.growth ?? {}) as Record<string, unknown>;
      const growthRaw = (data.growth && typeof data.growth === "object"
        ? (data.growth as Record<string, unknown>)
        : {}) as Record<string, unknown>;

      setActivityHeader({
        isVisible: a.isVisible !== false,
        eyebrow: typeof a.eyebrow === "string" && a.eyebrow ? a.eyebrow : DEFAULT_ACTIVITY_HEADER.eyebrow,
        title: typeof a.title === "string" && a.title ? a.title : DEFAULT_ACTIVITY_HEADER.title,
      });
      setTechHeader({
        isVisible: t.isVisible !== false,
        eyebrow: typeof t.eyebrow === "string" && t.eyebrow ? t.eyebrow : DEFAULT_TECH_HEADER.eyebrow,
        title: typeof t.title === "string" && t.title ? t.title : DEFAULT_TECH_HEADER.title,
      });
      const months = typeof growthRaw.months === "number" && [3, 6, 12].includes(growthRaw.months) ? (growthRaw.months as 3 | 6 | 12) : DEFAULT_GROWTH.months;
      setGrowth({
        isVisible: g.isVisible !== false,
        eyebrow: typeof g.eyebrow === "string" && g.eyebrow ? g.eyebrow : DEFAULT_GROWTH.eyebrow,
        title: typeof growthRaw.title === "string" && growthRaw.title ? growthRaw.title : DEFAULT_GROWTH.title,
        months,
      });

      const rawTech = Array.isArray(data.techStack)
        ? data.techStack
        : data.techStack && typeof data.techStack === "object" && Array.isArray((data.techStack as Record<string, unknown>).items)
          ? ((data.techStack as Record<string, unknown>).items as unknown[])
          : null;
      if (Array.isArray(rawTech) && rawTech.length > 0) {
        const parsed: TechPill[] = [];
        rawTech.forEach((item, idx) => {
          if (!item || typeof item !== "object") return;
          const obj = item as Record<string, unknown>;
          const id = typeof obj.id === "string" && obj.id ? obj.id : makePillId();
          const label = typeof obj.label === "string" ? obj.label.trim() : "";
          if (!label) return;
          const accentRaw = typeof obj.accent === "string" ? obj.accent : "violet";
          const accent: TechPill["accent"] = accentRaw === "cyan" || accentRaw === "mixed" || accentRaw === "violet" ? accentRaw : "violet";
          const order = typeof obj.order === "number" ? obj.order : idx;
          const isVisible = obj.isVisible !== false;
          parsed.push({ id, label, accent, order, isVisible });
        });
        parsed.sort((x, y) => x.order - y.order);
        if (parsed.length) setTechPills(parsed);
      }
    });
  }, []);

  const sortedPills = useMemo(() => [...techPills].sort((a, b) => a.order - b.order), [techPills]);

  async function createPost() {
    const t = title.trim();
    if (!t) return;
    await addDoc(collection(db(), "activity"), {
      title: t,
      isVisible: true,
      createdAt: serverTimestamp(),
    });
    setTitle("");
  }

  function movePill(index: number, dir: -1 | 1) {
    setTechPills((prev) => {
      const arr = [...prev].sort((a, b) => a.order - b.order);
      const j = index + dir;
      if (j < 0 || j >= arr.length) return prev;
      const tmp = arr[index]!;
      arr[index] = arr[j]!;
      arr[j] = tmp;
      return arr.map((p, i) => ({ ...p, order: i }));
    });
  }

  function addPill() {
    const label = newPillLabel.trim();
    if (!label) return;
    setTechPills((prev) => [
      ...prev,
      { id: makePillId(), label, accent: "violet", order: prev.length, isVisible: true },
    ]);
    setNewPillLabel("");
  }

  function removePill(id: string) {
    setTechPills((prev) => prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })));
  }

  async function saveAll() {
    setSaving(true);
    try {
      await setDoc(
        doc(db(), "siteContent", "hero"),
        {
          heroCards: {
            activity: {
              isVisible: activityHeader.isVisible,
              eyebrow: activityHeader.eyebrow.trim() || DEFAULT_ACTIVITY_HEADER.eyebrow,
              title: activityHeader.title.trim() || DEFAULT_ACTIVITY_HEADER.title,
            },
            techStack: {
              isVisible: techHeader.isVisible,
              eyebrow: techHeader.eyebrow.trim() || DEFAULT_TECH_HEADER.eyebrow,
              title: techHeader.title.trim() || DEFAULT_TECH_HEADER.title,
            },
            growth: {
              isVisible: growth.isVisible,
              eyebrow: growth.eyebrow.trim() || DEFAULT_GROWTH.eyebrow,
            },
          },
          growth: {
            title: growth.title.trim() || DEFAULT_GROWTH.title,
            metric: "newMembers",
            months: growth.months,
          },
          techStack: sortedPills.map((p, i) => ({
            id: p.id,
            label: p.label.trim(),
            accent: p.accent,
            order: i,
            isVisible: p.isVisible,
          })),
        },
        { merge: true },
      );
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Hero cards</h1>
      <p className="admin-page-subtitle">
        Control the three floating cards next to the hero: Live Activity, Tech Stack, and
        Growth. Toggle visibility, change headers, manage posts and pills. Changes appear on
        the homepage within ~1 second.
      </p>

      {/* Live Activity */}
      <section className="admin-card mt-8 space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
            <ActivityIcon className="size-4" />
          </div>
          <h2 className="text-base font-semibold text-white">Live Activity card</h2>
          <label className="ml-auto flex items-center gap-2 text-xs text-white/80">
            <input
              type="checkbox"
              checked={activityHeader.isVisible}
              onChange={(e) => setActivityHeader((h) => ({ ...h, isVisible: e.target.checked }))}
            />
            Card visible
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs text-white/70">
            Eyebrow
            <input
              value={activityHeader.eyebrow}
              onChange={(e) => setActivityHeader((h) => ({ ...h, eyebrow: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Live Activity"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/70">
            Title
            <input
              value={activityHeader.title}
              onChange={(e) => setActivityHeader((h) => ({ ...h, title: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Club Updates"
            />
          </label>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold text-white/90">Posts</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Activity title (e.g. 'New workshop announced')"
              onKeyDown={(e) => {
                if (e.key === "Enter") void createPost();
              }}
            />
            <button
              type="button"
              onClick={() => void createPost()}
              className="rounded-lg border border-white/25 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10"
            >
              Post
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <p className="text-sm font-medium text-white/80">No activity posts yet</p>
              <p className="max-w-sm text-xs text-white/55">
                Create a post above; it will appear on the homepage&apos;s Live Activity card within ~1 second.
              </p>
            </div>
          ) : (
            <div className="mt-1 space-y-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{row.title}</p>
                    <p className="text-[11px] text-white/55">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={row.isVisible}
                        onChange={(e) => void updateDoc(doc(db(), "activity", row.id), { isVisible: e.target.checked })}
                      />
                      visible
                    </label>
                    <button
                      type="button"
                      onClick={() => void deleteDoc(doc(db(), "activity", row.id))}
                      className="rounded-md border border-red-400/30 p-1.5 text-red-200 hover:bg-red-500/10"
                      aria-label="Delete post"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="admin-card mt-6 space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
            <Code2 className="size-4" />
          </div>
          <h2 className="text-base font-semibold text-white">Tech Stack card</h2>
          <label className="ml-auto flex items-center gap-2 text-xs text-white/80">
            <input
              type="checkbox"
              checked={techHeader.isVisible}
              onChange={(e) => setTechHeader((h) => ({ ...h, isVisible: e.target.checked }))}
            />
            Card visible
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs text-white/70">
            Eyebrow
            <input
              value={techHeader.eyebrow}
              onChange={(e) => setTechHeader((h) => ({ ...h, eyebrow: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Tech Stack"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/70">
            Title
            <input
              value={techHeader.title}
              onChange={(e) => setTechHeader((h) => ({ ...h, title: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="What We Build With"
            />
          </label>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold text-white/90">Pills</h3>
          <div className="space-y-2.5">
            {sortedPills.map((pill, i) => (
              <div
                key={pill.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => movePill(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded-md border border-white/20 p-1.5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePill(i, 1)}
                    disabled={i === sortedPills.length - 1}
                    aria-label="Move down"
                    className="rounded-md border border-white/20 p-1.5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                </div>

                <input
                  value={pill.label}
                  onChange={(e) =>
                    setTechPills((prev) => prev.map((p) => (p.id === pill.id ? { ...p, label: e.target.value } : p)))
                  }
                  className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  placeholder="Label"
                />

                <div className="flex shrink-0 items-center gap-1.5">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      title={a.label}
                      aria-label={`Accent ${a.label}`}
                      onClick={() =>
                        setTechPills((prev) => prev.map((p) => (p.id === pill.id ? { ...p, accent: a.value } : p)))
                      }
                      className={
                        pill.accent === a.value
                          ? `size-5 rounded-full ${a.swatch} ring-2 ring-white/80 ring-offset-2 ring-offset-[rgba(13,15,26,0.72)]`
                          : `size-5 rounded-full ${a.swatch} opacity-60 hover:opacity-100`
                      }
                    />
                  ))}
                </div>

                <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-white/70">
                  <input
                    type="checkbox"
                    checked={pill.isVisible}
                    onChange={(e) =>
                      setTechPills((prev) => prev.map((p) => (p.id === pill.id ? { ...p, isVisible: e.target.checked } : p)))
                    }
                  />
                  visible
                </label>
                <button
                  type="button"
                  onClick={() => removePill(pill.id)}
                  className="shrink-0 rounded-md border border-red-400/30 p-1.5 text-red-200 hover:bg-red-500/10"
                  aria-label="Remove pill"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <input
              value={newPillLabel}
              onChange={(e) => setNewPillLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addPill();
              }}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Add new pill (e.g. 'Rust')"
            />
            <button
              type="button"
              onClick={addPill}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/25 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
        </div>
      </section>

      {/* Growth */}
      <section className="admin-card mt-6 space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
            <BarChart3 className="size-4" />
          </div>
          <h2 className="text-base font-semibold text-white">Growth card</h2>
          <label className="ml-auto flex items-center gap-2 text-xs text-white/80">
            <input
              type="checkbox"
              checked={growth.isVisible}
              onChange={(e) => setGrowth((g) => ({ ...g, isVisible: e.target.checked }))}
            />
            Card visible
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs text-white/70">
            Eyebrow
            <input
              value={growth.eyebrow}
              onChange={(e) => setGrowth((g) => ({ ...g, eyebrow: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Growth"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/70">
            Title
            <input
              value={growth.title}
              onChange={(e) => setGrowth((g) => ({ ...g, title: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
              placeholder="Club stats"
            />
          </label>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-white/80">Months window:</span>
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setGrowth((g) => ({ ...g, months: m as 3 | 6 | 12 }))}
                className={
                  growth.months === m
                    ? "rounded-full bg-emerald-500/20 px-4 py-1.5 text-emerald-200 ring-1 ring-emerald-500/40"
                    : "rounded-full border border-white/15 px-4 py-1.5 text-white/75 hover:bg-white/10"
                }
              >
                {m} months
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-white/55">
            The bar chart is derived live from <code>teamMembers</code> createdAt timestamps.
            Members need valid createdAt values for the chart to populate.
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={saving}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save hero cards"}
        </button>
        <span className="text-xs text-white/55">
          {savedAt ? "Saved" : "Card headers, pills, and the growth window save together. Posts auto-save instantly."}
        </span>
      </div>
    </div>
  );
}
