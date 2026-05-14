"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";

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
      initial={hidden as TargetAndTransition}
      whileInView={visible as TargetAndTransition}
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
          initial={hidden as TargetAndTransition}
          whileInView={visible as TargetAndTransition}
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

// ---------------------------------------------------------------------------
// StaggerGrid — staggered grid of cards, direction alternates by row
// ---------------------------------------------------------------------------

type StaggerGridProps = {
  children: React.ReactNode[];
  className?: string;
  id?: string;
  /** Number of columns — used to alternate row direction. Default: 3 */
  cols?: number;
  /** Per-column stagger increment. Default: 0.08 */
  stagger?: number;
  delay?: number;
  childClassName?: string;
};

/**
 * Grid-aware stagger: items in even rows reveal from left, odd rows from right,
 * creating a natural sweep effect. Falls back to simple fade under reduced-motion.
 */
export function StaggerGrid({
  children,
  className,
  id,
  cols = 3,
  stagger: staggerStep = 0.08,
  delay = 0,
  childClassName,
}: StaggerGridProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div id={id} className={className}>
      {children.map((child, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const dir = row % 2 === 0 ? 1 : -1;
        const { hidden, visible } = revealVariants("up", 6);
        return (
          <motion.div
            key={i}
            className={childClassName}
            initial={{ ...(hidden as TargetAndTransition), x: dir * 20 }}
            whileInView={{ ...(visible as TargetAndTransition), x: 0 }}
            viewport={{ once: true, amount: 0.07 }}
            transition={{
              duration: durS.slow,
              ease: easeLux,
              delay: delay + col * staggerStep + row * (staggerStep * 0.5),
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CountUp — animates a number from 0 to target when it enters the viewport
// ---------------------------------------------------------------------------

type CountUpProps = {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
};

/**
 * Counts a number up from 0 to `to` when scrolled into view.
 * Respects prefers-reduced-motion (shows final value instantly).
 */
export function CountUp({
  to,
  duration = 1.6,
  className,
  suffix = "",
  prefix = "",
}: CountUpProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <span className={className}>
        {prefix}{to}{suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.01 }}
    >
      <motion.span
        initial={{ "--count": 0 } as TargetAndTransition}
        whileInView={{ "--count": to } as TargetAndTransition}
        viewport={{ once: true }}
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
        style={
          {
            "--count": 0,
            counterReset: "count var(--count)",
          } as React.CSSProperties
        }
      >
        {prefix}
        <motion.span
          initial={{ y: 8, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {to}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  );
}
