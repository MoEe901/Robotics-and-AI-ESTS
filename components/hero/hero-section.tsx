"use client";

import { BarChart3, Calendar, ClipboardList, Code2, Zap } from "lucide-react";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useCallback, useRef, useState } from "react";

import { HeroParticleCanvas } from "@/components/hero/hero-particle-canvas";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
  const showHeroVideo = !siteConfig.heroVideoDisabled && !heroVideoFailed;

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

  return (
    <section
      id="home"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-x-clip overflow-y-hidden bg-[#07080f] text-[#e2e8f0]"
    >
      {showHeroVideo ? (
        <>
          <video
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            onError={() => setHeroVideoFailed(true)}
          >
            {siteConfig.heroVideoUrl ? (
              <source src={siteConfig.heroVideoUrl} />
            ) : (
              <>
                <source src={siteConfig.heroVideo.webm} type="video/webm" />
                <source src={siteConfig.heroVideo.mp4} type="video/mp4" />
              </>
            )}
          </video>
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-[#07080f]/60"
            aria-hidden
          />
        </>
      ) : null}

      <HeroParticleCanvas />

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
          <div className="min-w-0">
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
              University Tech Community
            </div>
            <span className="hidden h-4 w-px shrink-0 bg-white/[0.08] sm:block" />
            <span className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-slate-400/80 sm:text-[11px] sm:tracking-[0.2em]">
              EST Safi · Morocco
            </span>
          </div>

          <h1
            className={cn(
              "font-syne max-w-full font-extrabold uppercase leading-[0.9] tracking-tight [hyphens:none] [word-break:normal]",
              /* clamp(1.75rem,9vw,8rem): smaller vw + floor so "ROBOTICS" stays one line on ~360px; no overflow-wrap to avoid mid-word breaks */
              "text-[clamp(1.75rem,9vw,8rem)]",
            )}
          >
            <span
              className="block text-white uppercase tracking-[0.035em] sm:tracking-[0.05em]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.28s" }}
            >
              Welcome
            </span>
            <span
              className="block text-white uppercase tracking-[0.035em] sm:tracking-[0.05em]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.3s" }}
            >
              to the
            </span>
            <span
              className="hero-title-grad block uppercase tracking-[-0.02em]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.34s" }}
            >
              Robotics
            </span>
            <span
              className="hero-title-grad block uppercase tracking-[-0.02em]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.36s" }}
            >
              {"& AI"}
            </span>
            <span
              className="block text-white uppercase tracking-[0.035em] sm:tracking-[0.05em]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.4s" }}
            >
              Club.
            </span>
          </h1>

          <p
            className="mt-6 max-w-[min(96vw,520px)] text-[clamp(1rem,3.4vw,1.05rem)] font-light leading-[1.65] text-slate-400/90 sm:mt-7 sm:leading-[1.8] lg:mt-7 lg:leading-[1.85]"
            style={{ animation: "heroFadeUp 0.8s ease both 0.42s" }}
          >
            A community of builders, dreamers, and innovators transforming ideas into intelligent
            machines. Join us and shape the future of technology — starting today.
          </p>

          <div
            className="mt-8 flex flex-col items-stretch gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            style={{ animation: "heroFadeUp 0.8s ease both 0.48s" }}
          >
            <Link
              href="/#apply"
              className="btn-shine font-jetbrains inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.08em] text-white shadow-[0_0_30px_rgba(124,58,237,0.45)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(124,58,237,0.65)] sm:min-h-0 sm:w-auto sm:justify-start sm:px-8"
            >
              <ClipboardList className="size-4 shrink-0" strokeWidth={2} />
              {siteConfig.ctas.primary}
            </Link>
            <Link
              href="/#events"
              className="font-jetbrains inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/[0.15] bg-transparent px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.08em] text-slate-300 transition hover:border-violet-500/50 hover:text-white sm:min-h-0 sm:w-auto sm:justify-start sm:px-7"
            >
              <Calendar className="size-4 shrink-0" strokeWidth={2} />
              {siteConfig.ctas.secondary}
            </Link>
          </div>
        </motion.div>
          </div>

        <motion.aside
          style={{ x: cardOffsetX, y: cardOffsetY }}
          className="pointer-events-none relative z-[31] hidden min-w-0 w-full lg:flex lg:flex-col lg:w-auto lg:justify-center lg:self-center"
        >
        <div className="mx-auto flex w-full max-w-[300px] flex-col gap-4 lg:mx-0">
          <div
            className="w-full max-w-[300px] rounded-2xl border border-violet-500/20 bg-[rgba(13,15,26,0.85)] p-5 backdrop-blur-[20px] transition hover:-translate-x-1 hover:border-violet-500/40"
            style={{ animation: "heroFadeLeft 1s ease both 0.65s" }}
          >
            <div style={{ animation: "heroCardFloat 6s ease-in-out infinite 1s" }}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <Zap className="size-[17px]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-jetbrains text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Live Activity
                  </p>
                  <p className="text-sm font-semibold text-white">Club Updates</p>
                </div>
                <span
                  className="size-[5px] shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  aria-hidden
                />
              </div>
              <div className="flex flex-col">
                {[
                  { t: "New workshop announced", time: "2m ago" },
                  { t: "Member joined Design Cellule", time: "1h ago" },
                  { t: "Competition results published", time: "3h ago" },
                ].map((row) => (
                  <div
                    key={row.t}
                    className="flex items-center justify-between gap-2 border-b border-white/[0.04] py-2.5 last:border-b-0"
                  >
                    <span className="text-[12px] font-light text-slate-300">{row.t}</span>
                    <span className="font-jetbrains shrink-0 text-[10px] text-slate-500">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="w-full max-w-[300px] rounded-2xl border border-violet-500/20 bg-[rgba(13,15,26,0.85)] p-5 backdrop-blur-[20px] transition hover:-translate-x-1 hover:border-violet-500/40"
            style={{ animation: "heroFadeLeft 1s ease both 0.72s" }}
          >
            <div style={{ animation: "heroCardFloat 7s ease-in-out infinite 0.5s" }}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-400">
                  <Code2 className="size-[17px]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-jetbrains text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Tech Stack
                  </p>
                  <p className="text-sm font-semibold text-white">What We Build With</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { cls: "border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-400", label: "Python" },
                  { cls: "border-violet-500/25 bg-violet-500/[0.08] text-violet-300", label: "ROS2" },
                  { cls: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400", label: "Arduino" },
                  { cls: "border-fuchsia-400/25 bg-fuchsia-400/[0.08] text-fuchsia-300", label: "TensorFlow" },
                  { cls: "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400", label: "OpenCV" },
                  { cls: "border-violet-500/20 bg-violet-500/[0.08] text-violet-300", label: "MATLAB" },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    className={cn(
                      "font-jetbrains inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium",
                      pill.cls,
                    )}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            className="w-full max-w-[300px] rounded-2xl border border-violet-500/20 bg-[rgba(13,15,26,0.85)] p-5 backdrop-blur-[20px] transition hover:-translate-x-1 hover:border-violet-500/40"
            style={{ animation: "heroFadeLeft 1s ease both 0.78s" }}
          >
            <div style={{ animation: "heroCardFloat 5.5s ease-in-out infinite 1s" }}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <BarChart3 className="size-[17px]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-jetbrains text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Growth
                  </p>
                  <p className="text-sm font-semibold text-white">Members 2025–2026</p>
                </div>
              </div>
              <div className="flex h-10 items-end gap-[3px]">
                {[30, 45, 40, 60, 55, 75, 70, 100].map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "min-w-0 flex-1 rounded-t-[3px] bg-violet-500/25 transition-all",
                      h === 100 && "bg-gradient-to-t from-violet-600 to-cyan-500",
                    )}
                    style={{
                      height: `${h}%`,
                      animation: `heroBarGrow 1.2s cubic-bezier(0.22,1,0.36,1) both`,
                      animationDelay: `${0.8 + i * 0.05}s`,
                      opacity: h === 100 ? 1 : 0.25 + (h / 100) * 0.35,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        </motion.aside>
        </div>

        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative z-[30] mt-10 w-full max-w-none sm:mt-14"
        >
          <div
            className="relative left-1/2 grid grid-cols-2 gap-4 sm:flex sm:flex-row w-screen max-w-none -translate-x-1/2 sm:overflow-hidden border-y border-violet-500/10 bg-violet-500/[0.02]"
            style={{ animation: "heroFadeUp 0.8s ease both 0.54s" }}
          >
            {[
              { v: "200+", l: "Members", c: "text-violet-500" },
              { v: "6", l: "Cellules", c: "text-cyan-400" },
              { v: "14", l: "Projects", c: "text-emerald-400" },
              { v: "8+", l: "Awards", c: "text-fuchsia-400" },
            ].map((stat, i) => (
              <div
                key={stat.l}
                className={cn(
                  "group relative flex w-full sm:w-auto min-w-[50%] flex-1 flex-col items-center gap-1 border-r border-violet-500/[0.08] px-3 py-7 text-center transition-colors last:border-r-0 hover:bg-violet-500/[0.04] sm:min-w-0 sm:px-4 sm:py-10 max-[639px]:border-b max-[639px]:border-violet-500/[0.08] max-[639px]:py-7",
                  i === 1 ? "max-[639px]:border-r max-[639px]:border-violet-500/[0.08]" : "",
                  i === 2 ? "max-[639px]:border-b-0" : "",
                  i === 3 ? "max-[639px]:border-r-0" : "",
                )}
              >
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-violet-600 to-cyan-400 transition-transform duration-500 ease-out group-hover:scale-x-100"
                  aria-hidden
                />
                <span className={cn("font-syne text-[clamp(1.65rem,8vw,2.8rem)] font-extrabold leading-none", stat.c)}>
                  {stat.v}
                </span>
                <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:text-[11px] sm:tracking-[0.25em]">
                  {stat.l}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div
          className="absolute bottom-6 left-1/2 z-[31] hidden -translate-x-1/2 flex-col items-center gap-2 font-jetbrains text-[9px] uppercase tracking-[0.18em] text-slate-500 sm:flex"
          style={{ animation: "heroFadeUp 0.8s ease both 1s" }}
        >
          <span>Scroll</span>
          <div
            className="h-9 w-px bg-gradient-to-b from-slate-500 to-transparent"
            style={{ animation: "heroScrollLine 2.4s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}
