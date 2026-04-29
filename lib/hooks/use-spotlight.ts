"use client";

import { useCallback, useRef } from "react";

/**
 * Tracks pointer position inside a container and exposes
 * --spotlight-x / --spotlight-y CSS custom properties.
 * Attach `ref` to the element and spread `handlers` onto it.
 *
 * Usage:
 *   const { ref, handlers } = useSpotlight();
 *   <div ref={ref} {...handlers} className="card-spotlight">…</div>
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const handleMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--spotlight-x", `${x}%`);
    el.style.setProperty("--spotlight-y", `${y}%`);
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--spotlight-x", "50%");
    el.style.setProperty("--spotlight-y", "50%");
  }, []);

  return {
    ref,
    handlers: {
      onPointerMove: handleMove,
      onPointerLeave: handleLeave,
    } as const,
  };
}
