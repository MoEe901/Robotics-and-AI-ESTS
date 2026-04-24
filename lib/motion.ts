/** Shared easing — soft deceleration (readable “premium” motion). */
export const easeLux = [0.16, 1, 0.3, 1] as const;

export const transitionReveal = {
  duration: 0.88,
  ease: easeLux,
} as const;
