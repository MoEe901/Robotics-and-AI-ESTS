"use client";

import { useEffect, useRef } from "react";

/**
 * Thin gradient progress bar fixed at the top of the viewport.
 * Tracks scroll progress via a native Intersection Observer + scroll event —
 * no Framer Motion overhead for this always-on element.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bar.style.display = "none";
      return;
    }

    function update() {
      if (!bar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      bar.style.transform = `scaleX(${pct / 100})`;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[2px] w-full"
      style={{ willChange: "transform" }}
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400"
        style={{ transform: "scaleX(0)", transition: "transform 60ms linear" }}
      />
    </div>
  );
}
