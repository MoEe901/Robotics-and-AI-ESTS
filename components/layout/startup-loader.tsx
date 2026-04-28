"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

const MIN_VISIBLE_MS = 1200;
const FADE_MS = 900;

export function StartupLoader({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const finish = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", finish);
    };
  }, []);

  return (
    <>
      <div
        className="transition-all [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: visible ? 0 : 1,
          transform: visible ? "scale(1.008)" : "scale(1)",
          filter: visible ? "blur(4px)" : "blur(0px)",
          transitionDuration: `${FADE_MS}ms`,
        }}
      >
        {children}
      </div>

      <div
        aria-hidden={!visible}
        className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center [background:var(--background)] transition-all [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(1.025)",
          filter: visible ? "blur(0px)" : "blur(10px)",
          transitionDuration: `${FADE_MS}ms`,
          visibility: visible ? "visible" : "hidden",
        }}
      >
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute size-[520px] rounded-full bg-violet-600/[0.16] blur-[120px] ambient-blob" />
        <div className="pointer-events-none absolute size-[320px] rounded-full bg-cyan-500/[0.12] blur-[90px] ambient-blob-slow" />

        {/* Expanding rings */}
        <div className="pointer-events-none absolute size-80 rounded-full border border-violet-500/50 animate-[loaderRingExpand_2.6s_ease-out_infinite]" />
        <div className="pointer-events-none absolute size-80 rounded-full border border-cyan-400/35 animate-[loaderRingExpand_2.6s_ease-out_infinite_0.87s]" />
        <div className="pointer-events-none absolute size-80 rounded-full border border-violet-400/25 animate-[loaderRingExpand_2.6s_ease-out_infinite_1.74s]" />

        {/* Logo */}
        <div className="relative z-10 px-6">
          <Image
            src="/assets/logos/logo-optimized.svg" loading="eager"
            alt={t.meta.appName}
            width={520}
            height={320}
            priority
            className="h-auto w-[min(86vw,34rem)] animate-[loaderFloat_2.8s_ease-in-out_infinite] drop-shadow-[0_20px_60px_rgba(124,58,237,0.4)]"
          />
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-12 left-1/2 h-px w-56 -translate-x-1/2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full w-full origin-left bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 animate-[loaderProgress_1.15s_cubic-bezier(0.22,1,0.36,1)_forwards]" />
        </div>
      </div>
    </>
  );
}
