"use client";

import { useEffect, useRef } from "react";

/**
 * Staggers children of the target element into view using GSAP.
 * Falls back gracefully if GSAP is unavailable or reduced-motion is preferred.
 *
 * @param selector  CSS selector for child elements to animate.
 * @param deps      Extra deps that re-trigger the animation.
 */
export function useGsapStagger(
  selector: string,
  opts: {
    delay?: number;
    stagger?: number;
    y?: number;
    duration?: number;
    once?: boolean;
  } = {},
) {
  const ref = useRef<HTMLElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (opts.once && ran.current) return;
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert?: () => void } = {};

    (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        gsap.registerPlugin(ScrollTrigger);

        const targets = el.querySelectorAll<HTMLElement>(selector);
        if (!targets.length) return;

        ctx = gsap.context(() => {
          gsap.fromTo(
            targets,
            { opacity: 0, y: opts.y ?? 28, filter: "blur(8px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: opts.duration ?? 0.85,
              ease: "power3.out",
              stagger: opts.stagger ?? 0.08,
              delay: opts.delay ?? 0,
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
            },
          );
        }, el);

        ran.current = true;
      } catch {
        // GSAP unavailable — elements visible at their natural state
      }
    })();

    return () => ctx.revert?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/**
 * Animates a single element in with a cinematic blur+lift reveal.
 * Use for hero titles, section headings, etc.
 */
export function useGsapHeroReveal(opts: { delay?: number } = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert?: () => void } = {};

    (async () => {
      try {
        const { gsap } = await import("gsap");
        ctx = gsap.context(() => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 40, filter: "blur(16px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              ease: "power4.out",
              delay: opts.delay ?? 0,
            },
          );
        }, el);
      } catch { /* skip */ }
    })();

    return () => ctx.revert?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
