"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type UseCountUpOptions = {
  /** Total animation duration, ms. Defaults to 900. */
  duration?: number;
  /** Master switch — if false, the hook returns `target` directly without animating. */
  enabled?: boolean;
  /** Intersection threshold (0-1). Defaults to 0.35. */
  threshold?: number;
  /** Re-run the count-up when target changes. Defaults to false (first-view effect). */
  restartOnTargetChange?: boolean;
};

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Safari <14 uses the deprecated addListener signature; fall back for safety.
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  }
  mq.addListener(callback);
  return () => mq.removeListener(callback);
}

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readReducedMotionServer(): boolean {
  return false;
}

/**
 * Animate an integer from 0 → `target` the first time the returned ref's
 * element enters the viewport. Respects `prefers-reduced-motion` and `enabled`
 * — in either case the hook returns the final `target` immediately without
 * entering React state updates during render (safe for effects-in-render lint).
 *
 * Usage:
 *   const { value, ref } = useCountUp(42, { enabled: true });
 *   return <span ref={ref}>{value}</span>;
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  target: number,
  options: UseCountUpOptions = {},
): { value: number; ref: React.RefObject<T | null> } {
  const { duration = 900, enabled = true, threshold = 0.35, restartOnTargetChange = false } = options;
  const prefersReducedMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, readReducedMotionServer);
  const shouldAnimate = enabled && !prefersReducedMotion;

  const ref = useRef<T | null>(null);
  const [animatedValue, setAnimatedValue] = useState<number>(0);
  const hasRunRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!shouldAnimate) return;
    if (typeof window === "undefined") return;

    const node = ref.current;
    const to = Math.trunc(target);

    const scheduleSync = (v: number) => {
      // Update via rAF so we never call setState synchronously inside the effect body.
      rafRef.current = window.requestAnimationFrame(() => setAnimatedValue(v));
    };

    if (restartOnTargetChange) hasRunRef.current = false;

    const run = () => {
      if (hasRunRef.current) {
        scheduleSync(to);
        return;
      }
      hasRunRef.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = Math.round(eased * to);
        setAnimatedValue(next);
        if (t < 1) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          setAnimatedValue(to);
          rafRef.current = null;
        }
      };
      rafRef.current = window.requestAnimationFrame(tick);
    };

    if (!node || typeof IntersectionObserver === "undefined") {
      run();
    } else {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              run();
              observerRef.current?.disconnect();
              observerRef.current = null;
              break;
            }
          }
        },
        { threshold },
      );
      observerRef.current.observe(node);
    }

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [shouldAnimate, target, duration, threshold, restartOnTargetChange]);

  // When not animating (disabled or reduced motion), render `target` directly —
  // no state to sync, no cascading renders.
  const value = shouldAnimate ? animatedValue : Math.trunc(target);
  return { value, ref };
}
