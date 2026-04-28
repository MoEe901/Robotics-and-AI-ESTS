"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import type { ProcessStepItem } from "@/lib/firebase/types";
import { DEFAULT_PROCESS_STEPS_CONFIG } from "@/lib/content/process-steps-defaults";
import {
  resolveSectionIcon,
  SECTION_ICON_KEYS,
  SECTION_ICON_OPTIONS,
} from "@/lib/icons/section-icon-pack";

type PartnerLogoRow = {
  imageUrl: string;
  visible: boolean;
  sourceTone: "light" | "dark";
};

type WhyJoinCardRow = {
  title: string;
  description: string;
};

type CelluleCardRow = {
  title: string;
  description: string;
  iconKey: string;
  iconImageUrl: string;
};

const EMPTY_ROW: PartnerLogoRow = {
  imageUrl: "",
  visible: true,
  sourceTone: "light",
};

const WHY_JOIN_DEFAULT = {
  smallHeading: "Shaping the Future with Robotics & AI",
  title: "Why Join the Robotics & AI Club",
  description:
    "Join a community of passionate students exploring robotics and artificial intelligence. Through hands-on projects, mentorship, and collaboration, you'll gain practical skills and turn ideas into real-world solutions.",
  cards: [
    {
      title: "Hands-on Projects",
      description:
        "Build and experiment with real systems, from robotics prototypes to AI-driven applications, and gain practical experience.",
    },
    {
      title: "Skill Development",
      description:
        "Strengthen your technical abilities through structured learning, continuous practice, and real problem-solving.",
    },
    {
      title: "Networking Opportunities",
      description:
        "Connect with peers, mentors, and professionals to grow your network and discover new opportunities.",
    },
    {
      title: "Competitions & Events",
      description:
        "Participate in challenges, workshops, and events to showcase your skills and gain valuable experience.",
    },
  ] as WhyJoinCardRow[],
};

/* Cellules and Process Steps now share the same 50-icon pack. The pack is
   defined once in lib/icons/section-icon-pack.ts so the dropdown options,
   the parser whitelist, and the runtime icon map cannot drift apart. */

function guessIconKeyFromTitle(title: string): string {
  const text = title.toLowerCase();
  if (text.includes("design")) return "palette";
  if (text.includes("media") || text.includes("video")) return "video";
  /* Canonical key is "file-text" since the icon pack consolidation; legacy
     "file" still resolves at render time but new picks emit the canonical key. */
  if (text.includes("secret") || text.includes("doc") || text.includes("record")) return "file-text";
  if (text.includes("treasury") || text.includes("finance") || text.includes("budget")) return "wallet";
  if (text.includes("communic") || text.includes("social") || text.includes("partnership")) return "megaphone";
  return "users";
}

function regenerateIconKey(currentKey: string, title: string): string {
  const guessed = guessIconKeyFromTitle(title);
  if (guessed !== currentKey) return guessed;
  const idx = SECTION_ICON_OPTIONS.findIndex((opt) => opt.key === currentKey);
  const next = idx >= 0 ? SECTION_ICON_OPTIONS[(idx + 1) % SECTION_ICON_OPTIONS.length] : SECTION_ICON_OPTIONS[0];
  return next?.key ?? "users";
}

/* Group options under <optgroup> so 50-entry dropdowns stay scannable. The
   group order is fixed by SECTION_ICON_OPTIONS; we just bucket them into
   an ordered map without re-sorting. */
const SECTION_ICON_GROUPS = (() => {
  const order: Array<SectionIconGroup> = [];
  const buckets = new Map<SectionIconGroup, typeof SECTION_ICON_OPTIONS[number][]>();
  for (const opt of SECTION_ICON_OPTIONS) {
    if (!buckets.has(opt.group)) {
      buckets.set(opt.group, []);
      order.push(opt.group);
    }
    buckets.get(opt.group)!.push(opt);
  }
  return order.map((g) => ({ group: g, options: buckets.get(g)! }));
})();

type SectionIconGroup = (typeof SECTION_ICON_OPTIONS)[number]["group"];

function SectionIconOptionList() {
  return (
    <>
      {SECTION_ICON_GROUPS.map(({ group, options }) => (
        <optgroup key={group} label={group}>
          {options.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const CELLULES_DEFAULT = {
  eyebrow: "Robotics & AI Club",
  title: "Our Cellules",
  subtitle:
    "Six specialized teams. One shared mission. Together, we handle everything that keeps our club running — from creative vision to operations and beyond.",
  cards: [
    {
      title: "Organization Cellule",
      description:
        "The backbone of everything we do. Plans events, aligns our teams, and keeps the entire club moving in sync.",
      iconKey: "users",
      iconImageUrl: "",
    },
    {
      title: "Design Cellule",
      description:
        "Where ideas become visuals. From eye-catching posters to our full brand identity — this team shapes how the world sees us.",
      iconKey: "palette",
      iconImageUrl: "",
    },
    {
      title: "Media Cellule",
      description:
        "Every moment, documented. We capture the energy of our events and craft content that keeps our community inspired.",
      iconKey: "video",
      iconImageUrl: "",
    },
    {
      title: "Secretary Cellule",
      description:
        "Nothing gets lost here. Meeting minutes, official records, and every document — organized, accessible, always up to date.",
      iconKey: "file",
      iconImageUrl: "",
    },
    {
      title: "Treasury Cellule",
      description:
        "Smart with every dirham. We manage the budget, track every transaction, and ensure our projects always have the resources they need.",
      iconKey: "wallet",
      iconImageUrl: "",
    },
    {
      title: "Communication Cellule",
      description:
        "Our voice to the world. We manage social media, build partnerships, and make sure our message reaches the right people at the right time.",
      iconKey: "megaphone",
      iconImageUrl: "",
    },
  ] as CelluleCardRow[],
};

export function KnowUsConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [logos, setLogos] = useState<PartnerLogoRow[]>([EMPTY_ROW]);
  const [whyJoinSmallHeading, setWhyJoinSmallHeading] = useState(WHY_JOIN_DEFAULT.smallHeading);
  const [whyJoinTitle, setWhyJoinTitle] = useState(WHY_JOIN_DEFAULT.title);
  const [whyJoinDescription, setWhyJoinDescription] = useState(WHY_JOIN_DEFAULT.description);
  const [whyJoinCards, setWhyJoinCards] = useState<WhyJoinCardRow[]>(WHY_JOIN_DEFAULT.cards);
  const [cellulesEyebrow, setCellulesEyebrow] = useState(CELLULES_DEFAULT.eyebrow);
  const [cellulesTitle, setCellulesTitle] = useState(CELLULES_DEFAULT.title);
  const [cellulesSubtitle, setCellulesSubtitle] = useState(CELLULES_DEFAULT.subtitle);
  const [cellulesCards, setCellulesCards] = useState<CelluleCardRow[]>(CELLULES_DEFAULT.cards);
  const [processEyebrow, setProcessEyebrow] = useState(DEFAULT_PROCESS_STEPS_CONFIG.eyebrow);
  const [processTitleLine, setProcessTitleLine] = useState(DEFAULT_PROCESS_STEPS_CONFIG.titleLine);
  const [processTitleAccent, setProcessTitleAccent] = useState(DEFAULT_PROCESS_STEPS_CONFIG.titleAccent);
  const [processSteps, setProcessSteps] = useState<ProcessStepItem[]>(() =>
    DEFAULT_PROCESS_STEPS_CONFIG.steps.map((s) => ({ ...s })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "siteContent", "partners"));
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          const logosRaw = Array.isArray(data.logos) ? data.logos : [];
          const nextRows = logosRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
              if (!imageUrl) return null;
              const visible = o.visible === undefined ? true : o.visible === true;
              const sourceTone = o.sourceTone === "dark" ? "dark" : "light";
              return { imageUrl, visible, sourceTone };
            })
            .filter((row): row is PartnerLogoRow => Boolean(row))
            .slice(0, 30);
          if (!cancelled) setLogos(nextRows.length ? nextRows : [EMPTY_ROW]);
        }

        const whyJoinSnap = await getDoc(doc(db(), "siteContent", "whyJoin"));
        if (whyJoinSnap.exists()) {
          const whyJoin = whyJoinSnap.data() as Record<string, unknown>;
          const smallHeading =
            typeof whyJoin.smallHeading === "string" && whyJoin.smallHeading.trim()
              ? whyJoin.smallHeading.trim()
              : WHY_JOIN_DEFAULT.smallHeading;
          const title =
            typeof whyJoin.title === "string" && whyJoin.title.trim()
              ? whyJoin.title.trim()
              : WHY_JOIN_DEFAULT.title;
          const description =
            typeof whyJoin.description === "string" && whyJoin.description.trim()
              ? whyJoin.description.trim()
              : WHY_JOIN_DEFAULT.description;
          const cardsRaw = Array.isArray(whyJoin.cards) ? whyJoin.cards : [];
          const cards = cardsRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const cardTitle = typeof o.title === "string" ? o.title.trim() : "";
              const cardDescription = typeof o.description === "string" ? o.description.trim() : "";
              if (!cardTitle || !cardDescription) return null;
              return { title: cardTitle, description: cardDescription };
            })
            .filter((row): row is WhyJoinCardRow => Boolean(row))
            .slice(0, 4);
          if (!cancelled) {
            setWhyJoinSmallHeading(smallHeading);
            setWhyJoinTitle(title);
            setWhyJoinDescription(description);
            setWhyJoinCards(cards.length ? cards : WHY_JOIN_DEFAULT.cards);
          }
        }

        const cellulesSnap = await getDoc(doc(db(), "siteContent", "cellules"));
        if (cellulesSnap.exists()) {
          const cellules = cellulesSnap.data() as Record<string, unknown>;
          const eyebrow =
            typeof cellules.eyebrow === "string" && cellules.eyebrow.trim()
              ? cellules.eyebrow.trim()
              : CELLULES_DEFAULT.eyebrow;
          const title =
            typeof cellules.title === "string" && cellules.title.trim()
              ? cellules.title.trim()
              : CELLULES_DEFAULT.title;
          const subtitle =
            typeof cellules.subtitle === "string" && cellules.subtitle.trim()
              ? cellules.subtitle.trim()
              : CELLULES_DEFAULT.subtitle;
          const cardsRaw = Array.isArray(cellules.cards) ? cellules.cards : [];
          const cards = cardsRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const cardTitle = typeof o.title === "string" ? o.title.trim() : "";
              const cardDescription = typeof o.description === "string" ? o.description.trim() : "";
              if (!cardTitle || !cardDescription) return null;
              const iconRaw = typeof o.iconKey === "string" ? o.iconKey.trim().toLowerCase() : "";
              /* Accept legacy "file" alias even though it's not in the dropdown
                 — the render side resolves it via resolveSectionIcon. */
              const iconKey =
                SECTION_ICON_KEYS.has(iconRaw) || iconRaw === "file"
                  ? iconRaw
                  : guessIconKeyFromTitle(cardTitle);
              const iconImageUrl =
                typeof o.iconImageUrl === "string" && o.iconImageUrl.trim() ? o.iconImageUrl.trim() : "";
              return { title: cardTitle, description: cardDescription, iconKey, iconImageUrl };
            })
            .filter((row): row is CelluleCardRow => Boolean(row))
            .slice(0, 12);
          if (!cancelled) {
            setCellulesEyebrow(eyebrow);
            setCellulesTitle(title);
            setCellulesSubtitle(subtitle);
            setCellulesCards(cards.length ? cards : CELLULES_DEFAULT.cards);
          }
        }

        const processSnap = await getDoc(doc(db(), "siteContent", "processSteps"));
        if (processSnap.exists()) {
          const proc = processSnap.data() as Record<string, unknown>;
          const pe = typeof proc.eyebrow === "string" ? proc.eyebrow.trim() : "";
          const ptLine = typeof proc.titleLine === "string" ? proc.titleLine : "";
          const ptAccent = typeof proc.titleAccent === "string" ? proc.titleAccent.trim() : "";
          const stepsRaw = Array.isArray(proc.steps) ? proc.steps : [];
          const parsed = stepsRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const o = row as Record<string, unknown>;
              const badge = typeof o.badge === "string" ? o.badge.trim() : "";
              const title = typeof o.title === "string" ? o.title.trim() : "";
              const description = typeof o.description === "string" ? o.description.trim() : "";
              const ik = typeof o.iconKey === "string" ? o.iconKey.trim().toLowerCase() : "";
              const iconKey = SECTION_ICON_KEYS.has(ik) ? ik : "users";
              if (!badge || !title || !description) return null;
              return { badge, title, description, iconKey };
            })
            .filter((s): s is ProcessStepItem => Boolean(s))
            .slice(0, 8);
          if (!cancelled && parsed.length >= 2) {
            setProcessEyebrow(pe || DEFAULT_PROCESS_STEPS_CONFIG.eyebrow);
            setProcessTitleLine(ptLine || DEFAULT_PROCESS_STEPS_CONFIG.titleLine);
            setProcessTitleAccent(ptAccent || DEFAULT_PROCESS_STEPS_CONFIG.titleAccent);
            setProcessSteps(parsed);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load partners config.");
        }
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
      const cleaned = logos
        .map((row) => ({
          imageUrl: safeTrim(row?.imageUrl),
          alt: "Partner logo",
          visible: row.visible !== false,
          sourceTone: row.sourceTone === "dark" ? "dark" : "light",
        }))
        .filter((row) => Boolean(row.imageUrl))
        .slice(0, 30);

      if (!cleaned.length) {
        throw new Error("Add at least one partner logo URL.");
      }

      const whyJoinCardsClean = whyJoinCards
        .map((row) => ({ title: safeTrim(row?.title), description: safeTrim(row?.description) }))
        .filter((row) => row.title && row.description)
        .slice(0, 12);
      if (!whyJoinCardsClean.length) {
        throw new Error("Please add at least one Why Join card.");
      }

      const cellulesCardsClean = cellulesCards
        .map((row) => ({
          title: safeTrim(row?.title),
          description: safeTrim(row?.description),
          iconKey:
            SECTION_ICON_KEYS.has(row?.iconKey ?? "") || row?.iconKey === "file"
              ? row.iconKey
              : guessIconKeyFromTitle(safeTrim(row?.title)),
          iconImageUrl: safeTrim(row?.iconImageUrl),
        }))
        .filter((row) => row.title && row.description)
        .slice(0, 12);
      if (!cellulesCardsClean.length) {
        throw new Error("Please add at least one Cellule card.");
      }

      const processStepsClean = processSteps
        .map((row) => ({
          badge: safeTrim(row?.badge),
          title: safeTrim(row?.title),
          description: safeTrim(row?.description),
          iconKey: SECTION_ICON_KEYS.has(row?.iconKey ?? "") ? row.iconKey : "users",
        }))
        .filter((row) => row.badge && row.title && row.description)
        .slice(0, 8);
      if (processStepsClean.length < 2) {
        throw new Error("Step-by-step process needs at least two complete steps (badge, title, description).");
      }

      await setDoc(
        doc(db(), "siteContent", "partners"),
        {
          title: "Our Partners & Collaborators All The Time",
          logos: cleaned,
        },
        { merge: true },
      );
      await setDoc(
        doc(db(), "siteContent", "whyJoin"),
        {
          smallHeading: safeTrim(whyJoinSmallHeading) || WHY_JOIN_DEFAULT.smallHeading,
          title: safeTrim(whyJoinTitle) || WHY_JOIN_DEFAULT.title,
          description: safeTrim(whyJoinDescription) || WHY_JOIN_DEFAULT.description,
          cards: whyJoinCardsClean,
        },
        { merge: true },
      );
      await setDoc(
        doc(db(), "siteContent", "cellules"),
        {
          eyebrow: safeTrim(cellulesEyebrow) || CELLULES_DEFAULT.eyebrow,
          title: safeTrim(cellulesTitle) || CELLULES_DEFAULT.title,
          subtitle: safeTrim(cellulesSubtitle) || CELLULES_DEFAULT.subtitle,
          cards: cellulesCardsClean,
        },
        { merge: true },
      );
      await setDoc(
        doc(db(), "siteContent", "processSteps"),
        {
          eyebrow: safeTrim(processEyebrow) || DEFAULT_PROCESS_STEPS_CONFIG.eyebrow,
          titleLine:
            processTitleLine !== "" ? processTitleLine : DEFAULT_PROCESS_STEPS_CONFIG.titleLine,
          titleAccent: safeTrim(processTitleAccent) || DEFAULT_PROCESS_STEPS_CONFIG.titleAccent,
          steps: processStepsClean,
        },
        { merge: true },
      );
      setSuccess("Saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save partners config.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="px-6 py-12 text-sm text-white/60">Loading partners configuration...</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Know us configuration</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Manage the <span className="text-white/80">Our Partners &amp; Collaborators All The Time</span> loop section.
      </p>

      <div className="mt-8 space-y-4">
        <p className="text-sm font-medium text-white/80">Our Partners &amp; Collaborators All The Time</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 px-2 text-[11px] uppercase tracking-[0.12em] text-white/45 md:grid">
            <span>Logo image URL</span>
            <span>Visible</span>
            <span>Type</span>
            <span>Action</span>
          </div>
          <div className="space-y-2">
          {logos.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
            >
              <label className="block text-xs md:text-sm">
                <span className="mb-1 block text-white/45 md:hidden">Logo #{i + 1}</span>
                <input
                  value={row.imageUrl}
                  onChange={(e) => {
                    const next = [...logos];
                    next[i] = { ...next[i], imageUrl: e.target.value };
                    setLogos(next);
                  }}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={row.visible}
                  onChange={(e) => {
                    const next = [...logos];
                    next[i] = { ...next[i], visible: e.target.checked };
                    setLogos(next);
                  }}
                  className="size-4 rounded border border-white/20 bg-black/20"
                />
                <span className="md:hidden">Visible on site</span>
              </label>

              <select
                value={row.sourceTone}
                onChange={(e) => {
                  const next = [...logos];
                  next[i] = { ...next[i], sourceTone: e.target.value === "dark" ? "dark" : "light" };
                  setLogos(next);
                }}
                className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-white/35"
              >
                <option value="light">White (light bg)</option>
                <option value="dark">Dark (dark bg)</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  const next = logos.filter((_, idx) => idx !== i);
                  setLogos(next.length ? next : [EMPTY_ROW]);
                }}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20"
              >
                Remove
              </button>
            </div>
          ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLogos((prev) => [...prev, EMPTY_ROW])}
          className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35"
        >
          Add logo
        </button>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-sm font-medium text-white/80">Why Join the Robotics &amp; AI Club</p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <label className="block text-sm">
            <span className="text-white/70">Small heading</span>
            <input
              value={whyJoinSmallHeading}
              onChange={(e) => setWhyJoinSmallHeading(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Main title</span>
            <input
              value={whyJoinTitle}
              onChange={(e) => setWhyJoinTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Description</span>
            <textarea
              rows={3}
              value={whyJoinDescription}
              onChange={(e) => setWhyJoinDescription(e.target.value)}
              className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <div className="space-y-3">
            {whyJoinCards.map((row, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-white/60">Card {String(i + 1).padStart(2, "0")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const next = whyJoinCards.filter((_, idx) => idx !== i);
                      setWhyJoinCards(next.length ? next : [{ title: "", description: "" }]);
                    }}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={row.title}
                  onChange={(e) => {
                    const next = [...whyJoinCards];
                    next[i] = { ...next[i], title: e.target.value };
                    setWhyJoinCards(next);
                  }}
                  placeholder="Card title"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
                <textarea
                  rows={2}
                  value={row.description}
                  onChange={(e) => {
                    const next = [...whyJoinCards];
                    next[i] = { ...next[i], description: e.target.value };
                    setWhyJoinCards(next);
                  }}
                  placeholder="Card description"
                  className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setWhyJoinCards((prev) => [...prev, { title: "", description: "" }])
                }
                className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => setWhyJoinCards([{ title: "", description: "" }])}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
              >
                Remove all form
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-sm font-medium text-white/80">Our Cellules</p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <label className="block text-sm">
            <span className="text-white/70">Eyebrow</span>
            <input
              value={cellulesEyebrow}
              onChange={(e) => setCellulesEyebrow(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Title</span>
            <input
              value={cellulesTitle}
              onChange={(e) => setCellulesTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Subtitle</span>
            <textarea
              rows={3}
              value={cellulesSubtitle}
              onChange={(e) => setCellulesSubtitle(e.target.value)}
              className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>

          <div className="space-y-3">
            {cellulesCards.map((row, i) => {
              const OptionIcon = resolveSectionIcon(row.iconKey);
              return (
                <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-white/60">Card {String(i + 1).padStart(2, "0")}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const next = cellulesCards.filter((_, idx) => idx !== i);
                        setCellulesCards(
                          next.length ? next : [{ title: "", description: "", iconKey: "users", iconImageUrl: "" }],
                        );
                      }}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    value={row.title}
                    onChange={(e) => {
                      const next = [...cellulesCards];
                      next[i] = { ...next[i], title: e.target.value };
                      setCellulesCards(next);
                    }}
                    placeholder="Card title"
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                  />
                  <textarea
                    rows={2}
                    value={row.description}
                    onChange={(e) => {
                      const next = [...cellulesCards];
                      next[i] = { ...next[i], description: e.target.value };
                      setCellulesCards(next);
                    }}
                    placeholder="Card description"
                    className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                  />
                  <details className="mt-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
                    <summary className="cursor-pointer select-none text-xs text-white/50 hover:text-white/70">
                      Icon (image URL or preset)
                    </summary>
                    <div className="mt-3 space-y-2">
                      <input
                        value={row.iconImageUrl}
                        onChange={(e) => {
                          const next = [...cellulesCards];
                          next[i] = { ...next[i], iconImageUrl: e.target.value };
                          setCellulesCards(next);
                        }}
                        placeholder="Custom icon image URL (optional; overrides preset on site)"
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                          <OptionIcon className="size-4 text-white/70" />
                          <span className="text-xs text-white/60">Preset</span>
                        </div>
                        <select
                          value={row.iconKey}
                          onChange={(e) => {
                            const next = [...cellulesCards];
                            next[i] = { ...next[i], iconKey: e.target.value };
                            setCellulesCards(next);
                          }}
                          className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-white/35"
                        >
                          <SectionIconOptionList />
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...cellulesCards];
                            next[i] = {
                              ...next[i],
                              iconKey: regenerateIconKey(next[i]?.iconKey ?? "users", next[i]?.title ?? ""),
                              iconImageUrl: "",
                            };
                            setCellulesCards(next);
                          }}
                          className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-xs font-medium text-white hover:border-white/35"
                        >
                          Regenerate icon
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCellulesCards((prev) => [...prev, { title: "", description: "", iconKey: "users", iconImageUrl: "" }])
              }
              className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => setCellulesCards([{ title: "", description: "", iconKey: "users", iconImageUrl: "" }])}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
            >
              Remove all form
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-sm font-medium text-white/80">Step-by-step process</p>
        <p className="max-w-2xl text-xs text-white/50">
          Shown on the homepage under <span className="text-white/70">Our Cellules</span> (timeline layout). Uses the
          same shell as the rest of this page.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <label className="block text-sm">
            <span className="text-white/70">Eyebrow</span>
            <input
              value={processEyebrow}
              onChange={(e) => setProcessEyebrow(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/70">Title (before accent)</span>
              <input
                value={processTitleLine}
                onChange={(e) => setProcessTitleLine(e.target.value)}
                placeholder="Step-by-Step "
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Accent word (gradient)</span>
              <input
                value={processTitleAccent}
                onChange={(e) => setProcessTitleAccent(e.target.value)}
                placeholder="Process"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"
              />
            </label>
          </div>

          <div className="space-y-3">
            {processSteps.map((row, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-white/60">Step {String(i + 1).padStart(2, "0")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const next = processSteps.filter((_, idx) => idx !== i);
                      setProcessSteps(
                        next.length >= 2
                          ? next
                          : [
                              { badge: "", title: "", description: "", iconKey: "users" },
                              { badge: "", title: "", description: "", iconKey: "users" },
                            ],
                      );
                    }}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={row.badge}
                  onChange={(e) => {
                    const next = [...processSteps];
                    next[i] = { ...next[i], badge: e.target.value };
                    setProcessSteps(next);
                  }}
                  placeholder="Badge (e.g. Integration)"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
                <input
                  value={row.title}
                  onChange={(e) => {
                    const next = [...processSteps];
                    next[i] = { ...next[i], title: e.target.value };
                    setProcessSteps(next);
                  }}
                  placeholder="Step title"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
                <textarea
                  rows={2}
                  value={row.description}
                  onChange={(e) => {
                    const next = [...processSteps];
                    next[i] = { ...next[i], description: e.target.value };
                    setProcessSteps(next);
                  }}
                  placeholder="Description"
                  className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
                <label className="mt-2 block text-xs text-white/55">
                  <span className="mb-1 block">Icon</span>
                  <select
                    value={row.iconKey}
                    onChange={(e) => {
                      const next = [...processSteps];
                      next[i] = { ...next[i], iconKey: e.target.value };
                      setProcessSteps(next);
                    }}
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
                  >
                    <SectionIconOptionList />
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setProcessSteps((prev) => [
                  ...prev,
                  { badge: "", title: "", description: "", iconKey: "users" },
                ])
              }
              disabled={processSteps.length >= 8}
              className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add step
            </button>
            <button
              type="button"
              onClick={() =>
                setProcessSteps(DEFAULT_PROCESS_STEPS_CONFIG.steps.map((s) => ({ ...s })))
              }
              className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-white/35"
            >
              Reset to defaults
            </button>
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

      <div className="mt-8">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-full border border-white/20 bg-white/[0.1] px-5 py-2 text-sm font-medium text-white hover:border-white/35 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
