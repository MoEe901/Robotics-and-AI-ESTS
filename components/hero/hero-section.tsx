"use client";

import { BarChart3, Calendar, ClipboardList, Code2, Zap } from "lucide-react";
import { collection, limit, orderBy, query, where, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";

import { HeroParticleCanvas } from "@/components/hero/hero-particle-canvas";
import { HeroFloatingShapes } from "@/components/hero/hero-floating-shapes";
import { HeroStatsStrip } from "@/components/hero/hero-stats-strip";
import { DEFAULT_HERO_PUBLIC } from "@/lib/content/site-content-parser";
import { db } from "@/lib/firebase";
import { useFirestoreCollection } from "@/lib/hooks/use-firestore-collection";
import { siteConfig } from "@/lib/site-config";
import {
  academicYearMatchesStrict,
  getCurrentAcademicYearLabel,
} from "@/lib/team/academic-year";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useHomeContentStore } from "@/store/homeContentStore";
import { useLanguage } from "@/lib/i18n/context";

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function HeroSection() {
  const { t, locale } = useLanguage();
  const publicHero = useHomeContentStore((s) => s.publicHero);
  const cellulesConfig = useHomeContentStore((s) => s.cellulesConfig);
  const partnersConfig = useHomeContentStore((s) => s.partnersConfig);
  const events = useHomeContentStore((s) => s.events);
  const faqConfig = useHomeContentStore((s) => s.faqConfig);
  const heroCms = publicHero ?? DEFAULT_HERO_PUBLIC;
  // When locale is not EN, overlay CMS values with translated strings
  const isFr = locale !== "en";
  const hero = isFr
    ? {
        ...heroCms,
        eyebrow: t.hero.eyebrow,
        location: t.hero.location,
        titleLines: t.hero.titleLines,
        description: t.hero.description,
        primaryCta: { ...heroCms.primaryCta, label: t.hero.primaryCta },
        secondaryCta: { ...heroCms.secondaryCta, label: t.hero.secondaryCta },
        heroCards: {
          ...heroCms.heroCards,
          activity: {
            ...heroCms.heroCards.activity,
            eyebrow: t.hero.activityEyebrow,
            title: t.hero.activityTitle,
          },
          techStack: {
            ...heroCms.heroCards.techStack,
            eyebrow: t.hero.techStackEyebrow,
            title: t.hero.techStackTitle,
          },
          growth: {
            ...heroCms.heroCards.growth,
            eyebrow: t.hero.growthEyebrow,
          },
        },
        growth: { ...heroCms.growth, title: t.hero.growthTitle },
      }
    : heroCms;
  const sectionRef = useRef<HTMLElement>(null);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);

  const bm = hero.backgroundMedia;
  const bmType = bm.type;
  const legacyPath = bmType === "none";

  // Legacy path (backgroundMedia.type == "none"): use hero.videoUrl + siteConfig fallback
  const legacyVideoSrc = hero.videoUrl?.trim() || siteConfig.heroVideoUrl || null;
  const showLegacyVideo =
    legacyPath &&
    !siteConfig.heroVideoDisabled &&
    !heroVideoFailed &&
    Boolean(legacyVideoSrc || siteConfig.heroVideo.mp4);

  // New backgroundMedia paths
  const showBmVideo = bmType === "video" && !heroVideoFailed && Boolean(bm.videoUrl?.trim());
  const showBmImage = bmType === "image" && Boolean(bm.imageUrl?.trim());
  const showAnyVideo = showBmVideo || showLegacyVideo;
  const resolvedVideoSrc = showBmVideo
    ? bm.videoUrl!.trim()
    : legacyPath
      ? legacyVideoSrc
      : null;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.45], [0, -48]);

  // Mouse parallax for floating cards
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const springX = useSpring(rawX, { stiffness: 40, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 40, damping: 22 });
  const cardOffsetX = useTransform(springX, [0, 1], [16, -16]);
  const cardOffsetY = useTransform(springY, [0, 1], [10, -10]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  }, [rawX, rawY]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0.5);
    rawY.set(0.5);
  }, [rawX, rawY]);

  const activityQuery = useMemo(
    () => query(collection(db(), "activity"), where("isVisible", "==", true), orderBy("createdAt", "desc"), limit(3)),
    [],
  );
  const { data: activityRows, loading: activityLoading, error: activityError } = useFirestoreCollection(
    activityQuery,
    (raw, id) => {
      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      if (!title) return null;
      const created = raw.createdAt;
      const createdAt =
        created && typeof created === "object" && "toDate" in created && typeof (created as Timestamp).toDate === "function"
          ? (created as Timestamp).toDate()
          : null;
      return { id, title, timeAgo: relativeTime(createdAt) };
    },
    "hero activity",
  );

  const membersQuery = useMemo(
    () => query(collection(db(), "teamMembers"), where("isVisible", "==", true), where("isActive", "==", true), limit(500)),
    [],
  );
  const { data: teamRows, loading: membersLoading, error: membersError } = useFirestoreCollection(
    membersQuery,
    (raw, id) => {
      const academicYear = typeof raw.academicYear === "string" ? raw.academicYear.trim() : "";
      const created = (raw.joinedAt ?? raw.createdAt) as unknown;
      const createdAt =
        created && typeof created === "object" && "toDate" in created && typeof (created as Timestamp).toDate === "function"
          ? (created as Timestamp).toDate()
          : null;
      return { id, academicYear, createdAt };
    },
    "hero teamMembers",
  );

  const displayedTech = hero.techStack.filter((item) => item.isVisible).sort((a, b) => a.order - b.order);
  /* The members tile must always reflect *this* academic year, never an
     aggregate. We anchor on today's date (Sep–Aug rollover) instead of the
     latest year present in the data so a stray future-year row doesn't shift
     the count, and a missing current-year row doesn't silently fall back. */
  const currentAcademicYear = getCurrentAcademicYearLabel();
  const membersCount = teamRows.filter((row) =>
    academicYearMatchesStrict(row.academicYear, currentAcademicYear),
  ).length;
  const cellulesCount = cellulesConfig?.cards?.length ?? 0;
  const partnersCount = partnersConfig?.logos?.filter((l) => l.visible !== false).length ?? 0;
  const eventsAllCount = events.length;
  const todayStartIso = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const eventsUpcomingCount = events.filter((ev) => typeof ev.date === "string" && ev.date && ev.date >= todayStartIso).length;
  const eventsPastCount = events.filter((ev) => typeof ev.date === "string" && ev.date && ev.date < todayStartIso).length;
  const faqQuestionsCount = faqConfig?.items?.length ?? 0;
  const membersReady = !membersLoading && !membersError;
  const heroStatsCounts = {
    membersLive: membersReady ? membersCount : undefined,
    cellulesLive: cellulesConfig ? cellulesCount : undefined,
    eventsLive: eventsAllCount,
    eventsUpcoming: eventsUpcomingCount,
    eventsPast: eventsPastCount,
    partnersLive: partnersConfig ? partnersCount : undefined,
    faqLive: faqConfig ? faqQuestionsCount : undefined,
    // team-alumni intentionally left undefined: it would require a dedicated
    // listener (teamMembers where status=="alumni"), which we don't spin up
    // on the homepage. Tile falls back to its manualValue.
  } as const;

  const growthMonths = hero.growth.months;
  const growthMap = new Map<string, number>();
  const now = new Date();
  for (let i = growthMonths - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    growthMap.set(`${d.getFullYear()}-${d.getMonth() + 1}`, 0);
  }
  for (const member of teamRows) {
    if (!member.createdAt) continue;
    const key = `${member.createdAt.getFullYear()}-${member.createdAt.getMonth() + 1}`;
    if (growthMap.has(key)) growthMap.set(key, (growthMap.get(key) ?? 0) + 1);
  }
  const growthSeries = Array.from(growthMap.entries()).map(([key, count]) => {
    const [y, m] = key.split("-").map((v) => Number(v));
    return { label: new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" }), count };
  });
  const totalGrowthMembers = growthSeries.reduce((sum, x) => sum + x.count, 0);
  const growthMax = Math.max(1, ...growthSeries.map((x) => x.count));

  return (
    <section
      id="home"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-x-clip overflow-y-hidden bg-[#07080f] text-[#e2e8f0]"
    >
      {showAnyVideo ? (
        <video
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay={!legacyPath ? bm.autoplay : true}
          muted
          loop={!legacyPath ? bm.loop : true}
          playsInline
          preload="metadata"
          aria-hidden
          poster={showBmVideo && bm.videoPosterUrl?.trim() ? bm.videoPosterUrl.trim() : undefined}
          onError={() => setHeroVideoFailed(true)}
        >
          {resolvedVideoSrc ? (
            <source src={resolvedVideoSrc} />
          ) : (
            <>
              <source src={siteConfig.heroVideo.webm} type="video/webm" />
              <source src={siteConfig.heroVideo.mp4} type="video/mp4" />
            </>
          )}
        </video>
      ) : showBmImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bm.imageUrl!.trim()}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        />
      ) : null}

      {/* Mask overlay: legacy path keeps original 60% dark scrim; new paths use admin mask settings */}
      {(showAnyVideo || showBmImage) ? (
        legacyPath ? (
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[#07080f]/60" aria-hidden />
        ) : hero.mask.enabled ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={(() => {
              const alpha = Math.round(hero.mask.opacity * 255).toString(16).padStart(2, "0");
              const c = `${hero.mask.color}${alpha}`;
              if (hero.mask.gradient === "radial") return { background: `radial-gradient(ellipse at center, transparent 20%, ${c} 100%)` };
              if (hero.mask.gradient === "linear-bottom") return { background: `linear-gradient(to bottom, transparent 0%, ${c} 100%)` };
              if (hero.mask.gradient === "linear-top") return { background: `linear-gradient(to top, transparent 0%, ${c} 100%)` };
              return { background: c };
            })()}
            aria-hidden
          />
        ) : null
      ) : null}

      {/* Datashow overlay: above mask, below text */}
      {hero.datashow.enabled && hero.datashow.imageUrl ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[2] flex items-center",
            hero.datashow.position === "left"
              ? "justify-start pl-12"
              : hero.datashow.position === "right"
                ? "justify-end pr-12"
                : "justify-center",
          )}
          aria-hidden
        >
          <figure className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.datashow.imageUrl}
              alt=""
              className="max-h-64 max-w-sm object-contain opacity-90"
            />
            {hero.datashow.caption ? (
              <figcaption className="text-xs font-light text-white/60">{hero.datashow.caption}</figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}

      <HeroParticleCanvas />

      {/* 3-D floating geometric shapes — mouse-reactive, pause when off-screen */}
      <HeroFloatingShapes />

      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(244,114,182,0.04) 0%, transparent 45%)",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-[4] opacity-[0.03]"
        style={{ backgroundImage: NOISE_BG }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[clamp(120px,28vh,380px)]"
        style={{
          background:
            "linear-gradient(to top, var(--background) 0%, color-mix(in srgb, var(--background) 72%, transparent) 28%, color-mix(in srgb, var(--background) 22%, transparent) 58%, transparent 100%)",
        }}
        aria-hidden
      />

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroLivePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.45); }
          50% { box-shadow: 0 0 0 5px rgba(6,182,212,0); }
        }
        @keyframes heroCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes heroBarGrow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes heroScrollLine {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.3); opacity: 0.3; }
        }
        @keyframes heroFadeLeft {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="relative z-[30] mx-auto flex min-h-screen w-full max-w-[1300px] flex-col justify-center px-5 pb-8 pt-[6.5rem] sm:px-8 sm:pt-[7.25rem] lg:px-16 lg:pb-12 lg:pt-[7.5rem]">
        {/* lg grid: reserves right column for cards so headline never draws under them; min-w-0 lets long words shrink inside the track */}
        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-x-12 lg:gap-y-0">
          <div className="min-w-0 [container-type:inline-size]">
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative w-full max-w-full"
        >
          <div
            className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:gap-4"
            style={{ animation: "heroFadeUp 0.7s ease both 0.15s" }}
          >
            <div className="font-jetbrains inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/[0.1] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-cyan-400 sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-[10px] sm:tracking-[0.2em]">
              <span
                className="size-1.5 shrink-0 rounded-full bg-cyan-400"
                style={{ animation: "heroLivePulse 1.5s ease-in-out infinite" }}
              />
              {hero.eyebrow}
            </div>
            <span className="hidden h-4 w-px shrink-0 bg-white/[0.08] sm:block" />
            <span className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-slate-400/80 sm:text-[11px] sm:tracking-[0.2em]">
              {hero.location}
            </span>
          </div>

          <h1
            className="font-heading typo-hero-title max-w-full font-extrabold uppercase tracking-tight [hyphens:none]"
          >
            {hero.titleLines.map((line, idx) => {
              const accent = hero.accentIndices.includes(idx);
              const delay = 0.28 + idx * 0.02;
              return (
                <span
                  key={`${line}-${idx}`}
                  className={cn(
                    "block uppercase",
                    accent
                      ? /* Bebas Neue accent lines:
                           – font-bebas: condensed display face, all-caps by design
                           – tracking-[0.04em] / sm:tracking-[0.06em]: slightly wider than
                             Syne's default so the gradient reads cleanly between strokes
                           – font-normal: Bebas Neue is a display-weight 400; keeps the
                             browser from applying faux-bold over the letterforms */
                        "font-bebas font-normal hero-title-grad"
                      : /* Non-accent lines stay in Syne ExtraBold — structural, geometric, white */
                        "font-heading text-white tracking-[0.035em] sm:tracking-[0.05em]",
                  )}
                  style={{ animation: `heroFadeUp 0.8s ease both ${delay}s` }}
                >
                  {line}
                </span>
              );
            })}
          </h1>

          <p
            className="mt-6 max-w-[min(96vw,580px)] text-[clamp(1.05rem,3.6vw,1.2rem)] font-light leading-[1.7] text-slate-400/90 sm:mt-8 sm:leading-[1.8] lg:mt-8 lg:leading-[1.85]"
            style={{ animation: "heroFadeUp 0.8s ease both 0.42s" }}
          >
            {hero.description}
          </p>

          <div
            className="mt-8 flex flex-col items-stretch gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            style={{ animation: "heroFadeUp 0.8s ease both 0.48s" }}
          >
            <Link
              href={hero.primaryCta.href || "/#apply"}
              className="btn-shine font-jetbrains inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_0_30px_rgba(124,58,237,0.45)] transition-[transform,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(124,58,237,0.65)] active:scale-[0.975] active:translate-y-0 sm:min-h-0 sm:w-auto sm:justify-start sm:px-10 sm:py-4"
            >
              <ClipboardList className="size-4 shrink-0" strokeWidth={2} />
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href || "/#events"}
              className="font-jetbrains inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-white/[0.15] bg-transparent px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-300 transition-[transform,border-color,color,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:-translate-y-px hover:border-violet-500/50 hover:text-white hover:shadow-[0_0_22px_rgba(124,58,237,0.2)] active:scale-[0.975] active:translate-y-0 sm:min-h-0 sm:w-auto sm:justify-start sm:px-9 sm:py-4"
            >
              <Calendar className="size-4 shrink-0" strokeWidth={2} />
              {hero.secondaryCta.label}
            </Link>
          </div>
        </motion.div>
          </div>

        <motion.aside
          style={{ x: cardOffsetX, y: cardOffsetY }}
          className="pointer-events-none relative z-[31] hidden min-w-0 w-full lg:flex lg:flex-col lg:w-auto lg:justify-center lg:self-center"
        >
        <div className="mx-auto flex w-full max-w-[300px] flex-col gap-4 lg:ml-auto lg:mr-0">
          {hero.heroCards.activity.isVisible && !activityError && (activityLoading || activityRows.length > 0) ? (
          <div
            className="glass-strong glass-prism card-spotlight w-full max-w-[300px] rounded-2xl p-5 transition-[transform,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:-translate-x-1.5"
            style={{ animation: "heroFadeLeft 1s ease both 0.65s" }}
          >
            <div style={{ animation: "heroCardFloat 6s ease-in-out infinite 1s" }}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  <Zap className="size-[17px]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-jetbrains text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    {hero.heroCards.activity.eyebrow}
                  </p>
                  <p className="text-sm font-semibold text-white">{hero.heroCards.activity.title}</p>
                </div>
                <span
                  className="size-[5px] shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  aria-hidden
                />
              </div>
              <div className="flex flex-col">
                {(activityLoading ? hero.liveActivity : activityRows).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 border-b border-white/[0.04] py-2.5 last:border-b-0"
                  >
                    <span className="text-[12px] font-light text-slate-300">{row.title}</span>
                    <span className="font-jetbrains shrink-0 text-[10px] text-slate-500">{row.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : null}

          {hero.heroCards.techStack.isVisible ? (
          <div
            className="glass-strong glass-prism card-spotlight w-full max-w-[300px] rounded-2xl p-5 transition-[transform,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:-translate-x-1.5"
            style={{ animation: "heroFadeLeft 1s ease both 0.72s" }}
          >
            <div style={{ animation: "heroCardFloat 7s ease-in-out infinite 0.5s" }}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-400">
                  <Code2 className="size-[17px]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-jetbrains text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    {hero.heroCards.techStack.eyebrow}
                  </p>
                  <p className="text-sm font-semibold text-white">{hero.heroCards.techStack.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displayedTech.map((item) => {
                  const cls =
                    item.accent === "cyan"
                      ? "border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-400"
                      : item.accent === "violet"
                        ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                        : "border-fuchsia-400/25 bg-fuchsia-400/[0.08] text-fuchsia-300";
                  return (
                    <span
                      key={item.id}
                      className={cn(
                        "font-jetbrains inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium",
                        cls,
                      )}
                    >
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          ) : null}

          {hero.heroCards.growth.isVisible ? (
          <div
            className="glass-strong glass-prism card-spotlight w-full max-w-[300px] rounded-2xl p-5 transition-[transform,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:-translate-x-1.5"
            style={{ animation: "heroFadeLeft 1s ease both 0.78s" }}
          >
            <div style={{ animation: "heroCardFloat 5.5s ease-in-out infinite 1s" }}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <BarChart3 className="size-[17px]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-jetbrains text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    {hero.heroCards.growth.eyebrow}
                  </p>
                  <p className="text-sm font-semibold text-white">{hero.growth.title}</p>
                </div>
              </div>
              {totalGrowthMembers < 2 ? (
                <p className="text-xs text-slate-400">{t.hero.notEnoughData}</p>
              ) : (
                <div className="flex h-10 items-end gap-[3px]">
                {growthSeries.map((stat, i) => {
                  const h = Math.max(8, Math.round((stat.count / growthMax) * 100));
                  const isLast = i === growthSeries.length - 1;
                  return (
                    <div
                      key={stat.label}
                      title={`${stat.label} - ${stat.count} new members`}
                      className={cn(
                        "min-w-0 flex-1 rounded-t-[3px] bg-violet-500/25 transition-all",
                        isLast && "bg-gradient-to-t from-violet-600 to-cyan-500",
                      )}
                      style={{
                        height: `${h}%`,
                        animation: `heroBarGrow 1.2s cubic-bezier(0.22,1,0.36,1) both`,
                        animationDelay: `${0.8 + i * 0.05}s`,
                        opacity: isLast ? 1 : 0.25 + (h / 100) * 0.35,
                      }}
                    />
                  );
                })}
              </div>
              )}
            </div>
          </div>
          ) : null}
        </div>
        </motion.aside>
        </div>

        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative z-[30] mt-10 w-full max-w-none sm:mt-14"
        >
          <div
            className="relative left-1/2 w-screen max-w-none -translate-x-1/2 sm:overflow-hidden"
            style={{ animation: "heroFadeUp 0.8s ease both 0.54s" }}
          >
            <HeroStatsStrip
              config={hero.statsStrip}
              tiles={hero.stats.tiles}
              counts={heroStatsCounts}
              foundedYear={hero.foundedYear}
              roundDerivedTo={hero.stats.roundDerivedTo}
            />
          </div>
        </motion.div>

        <div
          className="absolute bottom-6 left-1/2 z-[31] hidden -translate-x-1/2 flex-col items-center gap-2 font-jetbrains text-[9px] uppercase tracking-[0.18em] text-slate-500 sm:flex"
          style={{ animation: "heroFadeUp 0.8s ease both 1s" }}
        >
          <span>{t.hero.scroll}</span>
          <div
            className="h-9 w-px bg-gradient-to-b from-slate-500 to-transparent"
            style={{ animation: "heroScrollLine 2.4s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}
