"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { ProcessStepsConfig } from "@/lib/firebase/types";
import { DEFAULT_PROCESS_STEPS_CONFIG } from "@/lib/content/process-steps-defaults";
import { resolveSectionIcon } from "@/lib/icons/section-icon-pack";
import { useLanguage } from "@/lib/i18n/context";
import { durS, easeLux } from "@/lib/motion";

const EASE_LUX = easeLux as unknown as [number, number, number, number];

const ACCENT = [
  {
    ring: "border-sky-400/40 bg-sky-500/[0.12] text-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]",
    badge: "border-sky-400/25 bg-sky-500/15 text-sky-300",
    glow: "bg-sky-400/[0.06]",
    line: "bg-sky-400",
    node: "bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.55)]",
  },
  {
    ring: "border-violet-400/40 bg-violet-500/[0.12] text-violet-300 shadow-[0_0_0_1px_rgba(167,139,250,0.12)]",
    badge: "border-violet-400/25 bg-violet-500/15 text-violet-200",
    glow: "bg-violet-400/[0.06]",
    line: "bg-violet-400",
    node: "bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.55)]",
  },
  {
    ring: "border-fuchsia-400/40 bg-fuchsia-500/[0.12] text-fuchsia-300 shadow-[0_0_0_1px_rgba(232,121,249,0.12)]",
    badge: "border-fuchsia-400/25 bg-fuchsia-500/15 text-fuchsia-200",
    glow: "bg-fuchsia-400/[0.06]",
    line: "bg-fuchsia-400",
    node: "bg-fuchsia-400 shadow-[0_0_18px_rgba(232,121,249,0.55)]",
  },
  {
    ring: "border-amber-400/40 bg-amber-500/[0.12] text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]",
    badge: "border-amber-400/25 bg-amber-500/15 text-amber-200",
    glow: "bg-amber-400/[0.06]",
    line: "bg-amber-400",
    node: "bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.55)]",
  },
] as const;

type ProcessStepsSectionProps = {
  config: ProcessStepsConfig | null;
};

export function ProcessStepsSection({ config }: ProcessStepsSectionProps) {
  const { t, locale } = useLanguage();
  const reduce = useReducedMotion();
  const isFr = locale !== "en";
  const data = isFr
    ? (t.processSteps as unknown as ProcessStepsConfig)
    : (config ?? DEFAULT_PROCESS_STEPS_CONFIG);
  const steps =
    data.steps.length >= 2 ? data.steps : DEFAULT_PROCESS_STEPS_CONFIG.steps;

  /* ── Drag-to-scroll ── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  /* ── Fade edge hints ── */
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateEdgeHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateEdgeHints();
    el.addEventListener("scroll", updateEdgeHints, { passive: true });
    const ro = new ResizeObserver(updateEdgeHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEdgeHints);
      ro.disconnect();
    };
  }, [updateEdgeHints, steps.length]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragState.current = { startX: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const el = scrollRef.current;
      if (!el) return;
      const dx = e.clientX - dragState.current.startX;
      el.scrollLeft = dragState.current.scrollLeft - dx;
    },
    [isDragging],
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* ── Intersection observer stagger reveal ── */
  const [visible, setVisible] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-step-card]");
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(
            (entry.target as HTMLElement).getAttribute("data-step-index"),
          );
          if (Number.isNaN(idx)) return;
          obs.unobserve(entry.target);
          setVisible((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));
        });
      },
      { root: el, threshold: 0.3 },
    );

    cards.forEach((card) => obs.observe(card));

    // Safety net: reveal everything after 2 s
    const timer = window.setTimeout(() => {
      setVisible((prev) => {
        const next = { ...prev };
        cards.forEach((card) => {
          const idx = Number(card.getAttribute("data-step-index"));
          if (!Number.isNaN(idx)) next[idx] = true;
        });
        return next;
      });
    }, 2000);

    return () => {
      obs.disconnect();
      window.clearTimeout(timer);
    };
  }, [steps.length]);

  /* ── Render ── */

  const scrollCls = [
    "scrollbar-none flex gap-8 overflow-x-auto pb-6 pt-2 sm:gap-10",
    "px-[max(1rem,calc((100vw-1100px)/2))]",
    isDragging ? "cursor-grabbing select-none" : "cursor-grab",
  ].join(" ");

  return (
    <section id="process" className="relative scroll-mt-28 py-2">
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-violet-600/[0.04] blur-[120px]"
        aria-hidden="true"
      />

      <header className="mx-auto mb-12 max-w-2xl px-4 text-center md:mb-16">
        <span className="eyebrow-pill mb-4">
          {"// "}
          {data.eyebrow}
        </span>
        <h2 className="font-heading typo-section-heading font-extrabold tracking-tight text-white">
          {data.titleLine}
          <span className="hero-title-grad">{data.titleAccent}</span>
        </h2>
      </header>

      {/* Horizontal scrollable timeline */}
      <div className="relative">
        {/* Fade edge hints */}
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[var(--background)] to-transparent sm:w-24"
            aria-hidden="true"
          />
        )}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[var(--background)] to-transparent sm:w-24"
            aria-hidden="true"
          />
        )}

        <div
          ref={scrollRef}
          className={scrollCls}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {steps.map((step, i) => (
            <StepCard
              key={`${step.badge}-${i}`}
              step={step}
              index={i}
              total={steps.length}
              accent={ACCENT[i % ACCENT.length] as (typeof ACCENT)[number]}
              show={visible[i] ?? false}
              reduce={reduce}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Step card (extracted to simplify JSX nesting) ── */

type StepCardProps = {
  step: ProcessStepsConfig["steps"][number];
  index: number;
  total: number;
  accent: (typeof ACCENT)[number];
  show: boolean;
  reduce: boolean | null;
};

function StepCard({ step, index, total, accent, show, reduce }: StepCardProps) {
  const Icon = useMemo(() => resolveSectionIcon(step.iconKey), [step.iconKey]);
  const isLast = index === total - 1;
  const i = index;

  const nodeInitial = reduce ? {} : { scale: 0.5, opacity: 0 };
  const nodeAnimate = show
    ? { scale: 1, opacity: 1 }
    : reduce
      ? {}
      : { scale: 0.5, opacity: 0 };

  const contentInitial = reduce ? {} : { opacity: 0, y: 20 };
  const contentAnimate = show
    ? { opacity: 1, y: 0 }
    : reduce
      ? {}
      : { opacity: 0, y: 20 };

  return (
    <div
      data-step-card
      data-step-index={i}
      className="group flex shrink-0 flex-col items-center"
      style={{ width: "clamp(280px, 30vw, 360px)" }}
    >
      {/* Timeline rail */}
      <div className="relative mb-8 flex w-full items-center">
        {/* Connecting line (left half) */}
        {i > 0 && (
          <div className="absolute right-1/2 top-1/2 h-px w-[calc(50%+1.5rem)] -translate-y-1/2 bg-gradient-to-r from-white/[0.06] to-white/[0.12] sm:w-[calc(50%+2rem)]" />
        )}
        {/* Connecting line (right half) */}
        {!isLast && (
          <div className="absolute left-1/2 top-1/2 h-px w-[calc(50%+1.5rem)] -translate-y-1/2 bg-gradient-to-r from-white/[0.12] to-white/[0.06] sm:w-[calc(50%+2rem)]" />
        )}

        {/* Node */}
        <div className="relative mx-auto">
          <motion.div
            className={`flex size-16 items-center justify-center rounded-full border bg-[#0e0e14] transition-[transform,box-shadow] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-spring)] group-hover:scale-110 ${accent.ring}`}
            initial={nodeInitial}
            animate={nodeAnimate}
            transition={{
              duration: durS.slow,
              ease: EASE_LUX,
              delay: i * 0.08,
            }}
          >
            {/* eslint-disable-next-line react-hooks/static-components -- dynamic icon from CMS key */}
            <Icon className="size-7" strokeWidth={1.5} aria-hidden={true} />
          </motion.div>
          {/* Glow dot behind node */}
          <div
            className={`pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full blur-xl ${accent.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Card content */}
      <motion.div
        className="flex flex-1 flex-col items-center px-2 text-center"
        initial={contentInitial}
        animate={contentAnimate}
        transition={{
          duration: durS.slow,
          ease: EASE_LUX,
          delay: i * 0.08 + 0.12,
        }}
      >
        <span className="font-jetbrains mb-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
          {String(i + 1).padStart(2, "0")}
        </span>
        <span
          className={`mb-4 inline-block rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${accent.badge}`}
        >
          {step.badge}
        </span>
        <h3 className="font-syne mb-3 text-lg font-bold tracking-tight text-white md:text-xl">
          {step.title}
        </h3>
        <p className="text-[0.88rem] font-light leading-[1.8] text-slate-400/80">
          {step.description}
        </p>
      </motion.div>
    </div>
  );
}
