"use client";

import {
  Atom,
  Award,
  Badge,
  Blocks,
  Bot,
  Brain,
  Brush,
  Calendar,
  Camera,
  CircleCheck as CheckCircle,
  CirclePlay as PlayCircle,
  CircuitBoard,
  Clipboard,
  Code,
  Cpu,
  Database,
  Dna,
  FileText,
  Flag,
  FlaskConical,
  Folder,
  GitBranch,
  GraduationCap,
  Image,
  Layers,
  Lightbulb,
  Mail,
  Megaphone,
  Mic,
  Microscope,
  Palette,
  PenTool,
  Rocket,
  Send,
  Server,
  Settings,
  Sparkles,
  Star,
  Target,
  Terminal,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wallet,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ProcessStepsConfig } from "@/lib/firebase/types";
import { DEFAULT_PROCESS_STEPS_CONFIG } from "@/lib/content/process-steps-defaults";

const processIcons = {
  // People
  "users":          Users,
  "user":           User,
  "user-plus":      UserPlus,
  "user-check":     UserCheck,
  "graduation-cap": GraduationCap,
  "badge":          Badge,
  // Actions / Progress
  "rocket":         Rocket,
  "target":         Target,
  "award":          Award,
  "trophy":         Trophy,
  "star":           Star,
  "zap":            Zap,
  "flag":           Flag,
  "send":           Send,
  "check-circle":   CheckCircle,
  "play-circle":    PlayCircle,
  // Tech / Build
  "lightbulb":      Lightbulb,
  "sparkles":       Sparkles,
  "cpu":            Cpu,
  "circuit-board":  CircuitBoard,
  "bot":            Bot,
  "code":           Code,
  "terminal":       Terminal,
  "git-branch":     GitBranch,
  "database":       Database,
  "server":         Server,
  "wifi":           Wifi,
  "layers":         Layers,
  "blocks":         Blocks,
  // Creativity / Design
  "palette":        Palette,
  "pen-tool":       PenTool,
  "brush":          Brush,
  "image":          Image,
  "video":          Video,
  "camera":         Camera,
  "mic":            Mic,
  // Organisation / Admin
  "calendar":       Calendar,
  "file-text":      FileText,
  "clipboard":      Clipboard,
  "folder":         Folder,
  "wallet":         Wallet,
  "megaphone":      Megaphone,
  "mail":           Mail,
  // Science / Innovation
  "flask-conical":  FlaskConical,
  "microscope":     Microscope,
  "atom":           Atom,
  "brain":          Brain,
  "dna":            Dna,
  "wrench":         Wrench,
  "settings":       Settings,
} as const;

type IconKey = keyof typeof processIcons;

const ACCENT = [
  {
    ring: "border-sky-400/40 bg-sky-500/[0.12] text-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]",
    badge: "border-sky-400/25 bg-sky-500/15 text-sky-300",
    cardHover: "hover:border-sky-400/25",
    glow: "from-sky-400/[0.09]",
    visWrap: "bg-sky-500/[0.08] ring-1 ring-sky-400/20",
  },
  {
    ring: "border-violet-400/40 bg-violet-500/[0.12] text-violet-300 shadow-[0_0_0_1px_rgba(167,139,250,0.12)]",
    badge: "border-violet-400/25 bg-violet-500/15 text-violet-200",
    cardHover: "hover:border-violet-400/25",
    glow: "from-violet-400/[0.09]",
    visWrap: "bg-violet-500/[0.08] ring-1 ring-violet-400/20",
  },
  {
    ring: "border-fuchsia-400/40 bg-fuchsia-500/[0.12] text-fuchsia-300 shadow-[0_0_0_1px_rgba(232,121,249,0.12)]",
    badge: "border-fuchsia-400/25 bg-fuchsia-500/15 text-fuchsia-200",
    cardHover: "hover:border-fuchsia-400/25",
    glow: "from-fuchsia-400/[0.09]",
    visWrap: "bg-fuchsia-500/[0.08] ring-1 ring-fuchsia-400/20",
  },
  {
    ring: "border-amber-400/40 bg-amber-500/[0.12] text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]",
    badge: "border-amber-400/25 bg-amber-500/15 text-amber-200",
    cardHover: "hover:border-amber-400/25",
    glow: "from-amber-400/[0.09]",
    visWrap: "bg-amber-500/[0.08] ring-1 ring-amber-400/20",
  },
] as const;

function resolveIcon(key: string) {
  const k = key.trim().toLowerCase() as IconKey;
  return processIcons[k] ?? Users;
}

type ProcessStepsSectionProps = {
  config: ProcessStepsConfig | null;
};

export function ProcessStepsSection({ config }: ProcessStepsSectionProps) {
  const data = config ?? DEFAULT_PROCESS_STEPS_CONFIG;
  const steps = data.steps.length >= 2 ? data.steps : DEFAULT_PROCESS_STEPS_CONFIG.steps;
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll<HTMLElement>("[data-process-step]");
    if (!els?.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const idx = Number(el.getAttribute("data-step-index"));
          if (Number.isNaN(idx)) return;
          window.setTimeout(() => {
            setVisible((prev) => ({ ...prev, [idx]: true }));
          }, idx * 80);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    els.forEach((el) => obs.observe(el));

    window.setTimeout(() => {
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          const idx = Number(el.getAttribute("data-step-index"));
          if (!Number.isNaN(idx)) setVisible((prev) => ({ ...prev, [idx]: true }));
        }
      });
    }, 80);

    return () => obs.disconnect();
  }, [steps.length]);

  return (
    <section
      ref={rootRef}
      id="process"
      className="relative mx-auto w-[min(94%,1000px)] scroll-mt-28 py-2"
    >
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-10 md:px-10 md:py-14">
        <header className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
          <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
            <span className="size-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] motion-safe:animate-pulse" />
            {data.eyebrow}
          </p>
          <h2 className="font-semibold tracking-tight text-white text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.98]">
            {data.titleLine}
            <span className="bg-gradient-to-br from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {data.titleAccent}
            </span>
          </h2>
        </header>

        <div className="relative">
          {/* center rail — desktop */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.12] to-transparent md:block"
            aria-hidden
          />
          {/* mobile rail */}
          <div
            className="pointer-events-none absolute left-6 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.12] to-transparent md:hidden"
            aria-hidden
          />

          <div className="flex flex-col">
            {steps.map((step, i) => {
              const even = i % 2 === 1;
              const accent = ACCENT[i % ACCENT.length]!;
              const Icon = resolveIcon(step.iconKey);
              const show = visible[i] ?? false;
              return (
                <div
                  key={`${step.badge}-${i}`}
                  data-process-step
                  data-step-index={i}
                  className={`group grid grid-cols-[48px_1fr] items-start gap-x-4 gap-y-1 py-10 transition-all duration-700 ease-out md:grid-cols-[1fr_80px_1fr] md:items-center md:gap-0 md:py-12 ${
                    show ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                >
                  {/* timeline node — col 1 on mobile, center on md */}
                  <div className="relative z-[1] flex flex-col items-center gap-2 md:col-start-2 md:row-start-1">
                    <div
                      className={`flex size-[52px] shrink-0 items-center justify-center rounded-full border bg-[#0e0e14] transition-transform duration-300 group-hover:scale-105 ${accent.ring}`}
                    >
                      <Icon className="size-[22px]" strokeWidth={1.6} aria-hidden />
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* copy card */}
                  <div
                    className={`relative rounded-2xl border border-white/10 bg-[#0e0e14]/90 p-6 shadow-inner md:row-start-1 md:p-8 ${
                      even ? "md:col-start-3" : "md:col-start-1"
                    } ${accent.cardHover} transition-transform duration-300 group-hover:-translate-y-0.5`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accent.glow} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />
                    <span
                      className={`relative z-[1] mb-3 inline-block rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${accent.badge}`}
                    >
                      {step.badge}
                    </span>
                    <h3 className="relative z-[1] text-lg font-medium tracking-tight text-white md:text-xl">
                      {step.title}
                    </h3>
                    <p className="relative z-[1] mt-2 text-sm font-light leading-relaxed text-white/60">
                      {step.description}
                    </p>
                  </div>

                  {/* large icon — desktop */}
                  <div
                    className={`relative hidden items-center justify-center py-2 md:flex md:row-start-1 ${
                      even ? "md:col-start-1" : "md:col-start-3"
                    }`}
                  >
                    <div
                      className={`relative flex size-[140px] items-center justify-center rounded-full transition-transform duration-500 ease-out group-hover:scale-[1.04] group-hover:rotate-[3deg] ${accent.visWrap}`}
                    >
                      <Icon className="relative z-[1] size-[72px]" strokeWidth={1.2} aria-hidden />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
