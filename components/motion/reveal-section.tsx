"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  type RevealDirection,
  revealVariants,
  transitionReveal,
  durS,
  easeLux,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Stagger delay in seconds. */
  delay?: number;
  /** Animation entry direction. Default: "up". */
  dir?: RevealDirection;
  /** Blur intensity in px. Default: 10. */
  blur?: number;
  style?: React.CSSProperties;
  /** Amount of element visible before triggering (0–1). Default: 0.1 */
  amount?: number;
};

/**
 * Scroll-triggered reveal wrapper.
 * - Respects prefers-reduced-motion
 * - Supports directional entry (up / down / left / right / scale / fade)
 * - Uses the shared motion token system
 */
export function RevealSection({
  children,
  className,
  id,
  delay = 0,
  dir = "up",
  blur = 10,
  style,
  amount = 0.1,
}: RevealSectionProps) {
  const reduce = useReducedMotion();
  const { hidden, visible } = revealVariants(dir, blur);

  if (reduce) {
    return (
      <div id={id} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className={cn(className)}
      style={style}
      initial={hidden as object}
      whileInView={visible as object}
      viewport={{ once: true, amount, margin: "0px 0px -6% 0px" }}
      transition={{
        duration: transitionReveal.duration,
        ease: transitionReveal.ease,
        delay,
        filter: { duration: transitionReveal.duration * 0.82 },
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerRevealProps = {
  children: React.ReactNode[];
  className?: string;
  id?: string;
  /** Per-child stagger increment in seconds. Default: 0.07 */
  stagger?: number;
  /** Base delay before stagger starts. */
  delay?: number;
  dir?: RevealDirection;
  childClassName?: string;
};

/**
 * Staggers a list of children into view sequentially.
 * Each direct child gets its own reveal animation.
 */
export function StaggerReveal({
  children,
  className,
  id,
  stagger: staggerStep = 0.07,
  delay = 0,
  dir = "up",
  childClassName,
}: StaggerRevealProps) {
  const reduce = useReducedMotion();
  const { hidden, visible } = revealVariants(dir, 8);

  if (reduce) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div id={id} className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          className={childClassName}
          initial={hidden as object}
          whileInView={visible as object}
          viewport={{ once: true, amount: 0.08 }}
          transition={{
            duration: durS.slower,
            ease: easeLux,
            delay: delay + i * staggerStep,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
