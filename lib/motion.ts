// ============================================================
//  Motion Design System
//  Single source of truth for all animation tokens in the app.
// ============================================================

// ---- Duration scale (milliseconds) -------------------------
export const dur = {
  instant:  80,
  fast:    150,
  normal:  260,
  slow:    420,
  slower:  650,
  reveal:  880,
  crawl:  1200,
} as const;

// ---- Framer-Motion friendly (seconds) ----------------------
export const durS = {
  instant:  0.08,
  fast:     0.15,
  normal:   0.26,
  slow:     0.42,
  slower:   0.65,
  reveal:   0.88,
  crawl:    1.2,
} as const;

// ---- Named easing curves -----------------------------------
export const easeLux     = [0.16, 1, 0.3, 1] as const;
export const easeSnappy  = [0.22, 1, 0.36, 1] as const;
export const easeOut     = [0, 0, 0.2, 1] as const;
export const easeSpring  = [0.34, 1.56, 0.64, 1] as const;
export const easeInOut   = [0.4, 0, 0.2, 1] as const;
export const easeIn      = [0.4, 0, 1, 1] as const;

// ---- Stagger helpers (seconds) ----------------------------
export function stagger(
  count: number,
  opts: { base?: number; step?: number } = {},
): number[] {
  const { base = 0, step = 0.06 } = opts;
  return Array.from({ length: count }, (_, i) => base + i * step);
}

// ---- Framer-Motion spring configs --------------------------
export const springSnappy = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
  mass: 0.8,
} as const;

export const springGentle = {
  type: "spring" as const,
  stiffness: 200,
  damping: 24,
  mass: 1,
} as const;

export const springBounce = {
  type: "spring" as const,
  stiffness: 420,
  damping: 22,
  mass: 0.75,
} as const;

// ---- Framer-Motion transition presets ----------------------
export const transitionReveal = {
  duration:  durS.reveal,
  ease:      easeLux,
} as const;

export const transitionFast = {
  duration:  durS.fast,
  ease:      easeSnappy,
} as const;

export const transitionNormal = {
  duration:  durS.normal,
  ease:      easeOut,
} as const;

export const transitionSlow = {
  duration:  durS.slow,
  ease:      easeLux,
} as const;

// ---- Reveal animation variants ----------------------------
export type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

const OFFSET = 32;

export function revealVariants(dir: RevealDirection = "up", blurPx = 10) {
  const hidden: Record<string, unknown> = { opacity: 0 };
  const visible: Record<string, unknown> = { opacity: 1 };

  switch (dir) {
    case "up":
      hidden.y = OFFSET;
      hidden.filter = `blur(${blurPx}px)`;
      visible.y = 0;
      visible.filter = "blur(0px)";
      break;
    case "down":
      hidden.y = -OFFSET;
      hidden.filter = `blur(${blurPx}px)`;
      visible.y = 0;
      visible.filter = "blur(0px)";
      break;
    case "left":
      hidden.x = OFFSET;
      hidden.filter = `blur(${blurPx / 2}px)`;
      visible.x = 0;
      visible.filter = "blur(0px)";
      break;
    case "right":
      hidden.x = -OFFSET;
      hidden.filter = `blur(${blurPx / 2}px)`;
      visible.x = 0;
      visible.filter = "blur(0px)";
      break;
    case "scale":
      hidden.scale = 0.93;
      hidden.filter = `blur(${blurPx / 2}px)`;
      visible.scale = 1;
      visible.filter = "blur(0px)";
      break;
    case "fade":
    default:
      break;
  }

  return { hidden, visible };
}

// ---- GSAP helpers -----------------------------------------
export async function registerGsapPlugins() {
  if (typeof window === "undefined") return null;
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}
