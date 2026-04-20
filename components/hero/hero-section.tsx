"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

import { Button } from "@/components/ui/button";
import { HeroScene } from "@/components/hero/hero-scene";
import { siteConfig } from "@/lib/site-config";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.55], [0, -80]);
  const contentScale = useTransform(scrollYProgress, [0, 0.55], [1, 0.95]);

  const videoY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 z-0 will-change-transform"
        style={{ y: videoY, scale: videoScale }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.55]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/assets/video/hero-video.webm" type="video/webm" />
          <source src="/assets/video/hero-video.mp4" type="video/mp4" />
        </video>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(81,65,180,0.35),transparent_55%),linear-gradient(180deg,rgba(12,10,9,0.72)_0%,rgba(12,10,9,0.35)_45%,rgba(12,10,9,0.92)_100%)]" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-36 sm:h-44 md:h-52"
        style={{
          background:
            "linear-gradient(to bottom, rgba(12,10,9,0) 0%, rgba(12,10,9,0.38) 45%, var(--background) 100%)",
        }}
      />

      <HeroScene />

      <div className="relative z-30 flex min-h-screen items-center px-4 pb-24 pt-28 md:px-6">
        <motion.div
          style={{
            opacity: contentOpacity,
            y: contentY,
            scale: contentScale,
          }}
          className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 will-change-transform"
        >
          <p className="w-fit rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-white shadow-sm backdrop-blur-md transition duration-[400ms] ease-in-out">
            UNIVERSITY TECH COMMUNITY
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] md:text-7xl">
            Welcome to the Robotics & AI Club
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
            {siteConfig.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => window.location.assign("/#apply")}>{siteConfig.ctas.primary}</Button>
            <Button variant="ghost" onClick={() => window.location.assign("/#events")}>
              {siteConfig.ctas.secondary}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
