"use client";

import { Bebas_Neue, DM_Sans } from "next/font/google";
import { BarChart3, Calendar, ClipboardList, Code2, Zap } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

import { HeroParticleCanvas } from "@/components/hero/hero-particle-canvas";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const fontDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const fontSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

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

  return (
    <section
      id="home"
      ref={sectionRef}
      className={cn(
        "relative min-h-screen overflow-hidden bg-[#05050c] text-[#f2f1f8]",
        fontSans.className,
      )}
    >
      {/* Video under particles + vignette (see public/assets/video after compress script) */}
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
            className="pointer-events-none absolute inset-0 z-[1] bg-[#05050c]/55"
            aria-hidden
          />
        </>
      ) : null}

      <HeroParticleCanvas />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(167,139,250,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(240,86,160,0.04) 0%, transparent 45%)",
        }}
        aria-hidden
      />

      {/* Noise */}
      <div
        className="pointer-events-none absolute inset-0 z-[4] opacity-[0.025]"
        style={{ backgroundImage: NOISE_BG }}
        aria-hidden
      />

      {/* Soft blend into page background (removes hard cut at hero / next section) */}
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
        @keyframes heroGradShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes heroLivePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(62,207,142,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(62,207,142,0); }
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
        .hero-gradient-title {
          background: linear-gradient(135deg, #4f8ef7 0%, #a78bfa 50%, #f056a0 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: heroGradShift 5s ease-in-out infinite;
        }
      `}</style>

      {/* Main column */}
      <div className="relative z-[30] mx-auto flex min-h-screen max-w-[1200px] flex-col justify-center px-6 pb-28 pt-[7.5rem] sm:px-9 lg:px-16 lg:pb-24 lg:pt-[7.5rem]">
        <motion.div style={{ opacity: contentOpacity, y: contentY }} className="relative max-w-[760px]">
          {/* Eyebrow */}
          <div
            className="mb-7 flex flex-wrap items-center gap-4 sm:mb-8"
            style={{ animation: "heroFadeUp 0.7s ease both 0.15s" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              <span
                className="size-1.5 shrink-0 rounded-full bg-emerald-400"
                style={{ animation: "heroLivePulse 1.5s ease-in-out infinite" }}
              />
              University Tech Community
            </div>
            <span className="hidden h-4 w-px shrink-0 bg-white/[0.12] sm:block" />
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#6a6882]">
              EST Safi · Morocco
            </span>
          </div>

          {/* Title */}
          <h1 className={cn("leading-[0.88] tracking-[0.01em]", fontDisplay.className)}>
            <span
              className="block text-[clamp(4rem,11vw,8.75rem)] text-[#f2f1f8]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.28s" }}
            >
              Welcome to the
            </span>
            <span
              className="block overflow-hidden text-[clamp(4rem,11vw,8.75rem)] leading-[0.88]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.34s" }}
            >
              <span className="hero-gradient-title block">Robotics & AI</span>
            </span>
            <span
              className="block text-[clamp(4rem,11vw,8.75rem)] text-[#f2f1f8]"
              style={{ animation: "heroFadeUp 0.8s ease both 0.4s" }}
            >
              Club.
            </span>
          </h1>

          <p
            className="mt-8 max-w-[520px] text-[17px] font-light leading-[1.75] text-[#f2f1f8]/60 lg:mt-7"
            style={{ animation: "heroFadeUp 0.8s ease both 0.42s" }}
          >
            A community of builders, dreamers, and innovators transforming ideas into intelligent
            machines. Join us and shape the future of technology — starting today.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4"
            style={{ animation: "heroFadeUp 0.8s ease both 0.48s" }}
          >
            <Link
              href="/#apply"
              className="inline-flex items-center gap-2.5 rounded-[14px] bg-[#4f8ef7] px-8 py-[15px] text-[15px] font-medium text-white shadow-[0_8px_32px_rgba(79,142,247,0.3)] transition hover:-translate-y-[3px] hover:opacity-95 hover:shadow-[0_14px_44px_rgba(79,142,247,0.38)]"
            >
              <ClipboardList className="size-4 shrink-0" strokeWidth={2} />
              {siteConfig.ctas.primary}
            </Link>
            <Link
              href="/#events"
              className="inline-flex items-center gap-2.5 rounded-[14px] border border-white/[0.12] bg-white/[0.05] px-7 py-[15px] text-[15px] font-normal text-[#f2f1f8] transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
            >
              <Calendar className="size-4 shrink-0" strokeWidth={2} />
              {siteConfig.ctas.secondary}
            </Link>
          </div>

          {/* Stats */}
          <div
            className="mt-14 max-w-[680px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a0a16]/60 backdrop-blur-[16px] max-[680px]:flex-wrap sm:mt-[4.5rem]"
            style={{ animation: "heroFadeUp 0.8s ease both 0.54s" }}
          >
            <div className="flex max-[680px]:flex-wrap">
              {[
                { v: "200+", l: "Members", c: "text-sky-400" },
                { v: "6", l: "Cellules", c: "text-violet-300" },
                { v: "14", l: "Projects", c: "text-emerald-400" },
                { v: "8+", l: "Awards", c: "text-fuchsia-400" },
              ].map((stat, i) => (
                <div
                  key={stat.l}
                  className={cn(
                    "flex min-w-[50%] flex-1 flex-col gap-1 px-6 py-5 transition hover:bg-white/[0.02] max-[680px]:border-b max-[680px]:border-white/[0.06] sm:min-w-0 sm:border-r sm:border-white/[0.06] sm:border-b-0",
                    i === 1 ? "max-[680px]:border-r max-[680px]:border-white/[0.06]" : "",
                    i === 3 ? "border-r-0 max-[680px]:border-b-0 max-[680px]:border-r-0" : "",
                  )}
                >
                  <span className={cn(fontDisplay.className, "text-4xl tracking-[0.04em]", stat.c)}>
                    {stat.v}
                  </span>
                  <span className="text-[11px] font-light uppercase tracking-[0.06em] text-[#6a6882]">
                    {stat.l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Floating cards — desktop */}
        <div className="pointer-events-none absolute right-12 top-1/2 z-[31] hidden min-[1060px]:flex min-[1060px]:-translate-y-1/2 min-[1060px]:flex-col min-[1060px]:gap-3.5 xl:right-16">
          <div
            className="w-[280px] rounded-2xl border border-white/[0.12] bg-[#0a0a16]/75 p-5 backdrop-blur-[20px]"
            style={{ animation: "heroFadeLeft 1s ease both 0.65s" }}
          >
            <div style={{ animation: "heroCardFloat 6s ease-in-out infinite 1s" }}>
            <div className="mb-3.5 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-sky-500/15 text-sky-400">
                <Zap className="size-[17px]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a6882]">
                  Live Activity
                </p>
                <p className="text-sm font-medium text-[#f2f1f8]">Club Updates</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { dot: "#3ecf8e", t: "New workshop announced", time: "2m ago" },
                { dot: "#4f8ef7", t: "Member joined Design Cellule", time: "1h ago" },
                { dot: "#a78bfa", t: "Competition results published", time: "3h ago" },
              ].map((row) => (
                <div key={row.t} className="flex items-center gap-2.5">
                  <span className="size-[7px] shrink-0 rounded-full" style={{ background: row.dot }} />
                  <span className="flex-1 text-[12.5px] font-light text-[#f2f1f8]">{row.t}</span>
                  <span className="text-[10px] text-[#6a6882]">{row.time}</span>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div
            className="w-[280px] rounded-2xl border border-white/[0.12] bg-[#0a0a16]/75 p-5 backdrop-blur-[20px]"
            style={{ animation: "heroFadeLeft 1s ease both 0.72s" }}
          >
            <div style={{ animation: "heroCardFloat 7s ease-in-out infinite 0.5s" }}>
            <div className="mb-3.5 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-violet-500/15 text-violet-300">
                <Code2 className="size-[17px]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a6882]">
                  Tech Stack
                </p>
                <p className="text-sm font-medium text-[#f2f1f8]">What We Build With</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["#4f8ef7", "Python"],
                ["#3ecf8e", "ROS2"],
                ["#f5a623", "Arduino"],
                ["#a78bfa", "TensorFlow"],
                ["#f056a0", "OpenCV"],
                ["#38bdf8", "MATLAB"],
              ].map(([color, label]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-[11px] text-[#f2f1f8]"
                >
                  <span className="size-[5px] rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
            </div>
          </div>

          <div
            className="w-[280px] rounded-2xl border border-white/[0.12] bg-[#0a0a16]/75 p-5 backdrop-blur-[20px]"
            style={{ animation: "heroFadeLeft 1s ease both 0.78s" }}
          >
            <div style={{ animation: "heroCardFloat 5.5s ease-in-out infinite 1s" }}>
            <div className="mb-3.5 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-500/15 text-emerald-400">
                <BarChart3 className="size-[17px]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a6882]">
                  Growth
                </p>
                <p className="text-sm font-medium text-[#f2f1f8]">Members 2025–2026</p>
              </div>
            </div>
            <div className="flex h-10 items-end gap-1.5">
              {[30, 45, 40, 60, 55, 75, 70, 100].map((h, i) => (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-t bg-sky-500/40"
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

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 z-[31] flex -translate-x-1/2 flex-col items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[#6a6882]"
          style={{ animation: "heroFadeUp 0.8s ease both 1s" }}
        >
          <span>Scroll</span>
          <div
            className="h-9 w-px bg-gradient-to-b from-[#6a6882] to-transparent"
            style={{ animation: "heroScrollLine 2.4s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}
