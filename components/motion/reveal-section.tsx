"use client";

import { motion, useReducedMotion } from "framer-motion";

import { transitionReveal } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  style?: React.CSSProperties;
};

/** Scroll-in fade + lift. Wrapper is a `div` so nested `<section>` landmarks stay valid. */
export function RevealSection({ children, className, id, delay = 0, style }: RevealSectionProps) {
  const reduce = useReducedMotion();

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
      initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: transitionReveal.duration,
        ease: transitionReveal.ease,
        delay,
        filter: { duration: (transitionReveal.duration as number) * 0.85 },
      }}
    >
      {children}
    </motion.div>
  );
}
