"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PartnerLogo } from "@/lib/firebase/types";

type PartnersMarqueeProps = {
  logos: PartnerLogo[];
  gapPx: number;
  durationSec: number;
  logoBasis: string;
};

export function PartnersMarquee({ logos, gapPx, durationSec, logoBasis }: PartnersMarqueeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [shiftPx, setShiftPx] = useState(0);
  const [repeatCount, setRepeatCount] = useState(2);
  const reduceMotion = useReducedMotion();

  const prepared = useMemo(
    () =>
      logos.map((logo, idx) => ({
        ...logo,
        key: `${logo.imageUrl}-${idx}`,
      })),
    [logos],
  );

  useEffect(() => {
    const updateMeasurements = () => {
      const groupWidth = groupRef.current?.offsetWidth ?? 0;
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const unitWidth = groupWidth + gapPx;
      if (unitWidth <= 0) {
        setShiftPx(0);
        setRepeatCount(2);
        return;
      }
      // Move exactly one logo-strip width, then repeat seamlessly.
      setShiftPx(unitWidth);
      // Ensure there is always content filling the viewport during the loop.
      const needed = Math.ceil((containerWidth + unitWidth) / unitWidth);
      setRepeatCount(Math.max(2, needed));
    };

    updateMeasurements();
    if (typeof window === "undefined") return;
    const resizeObserver = new ResizeObserver(updateMeasurements);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (groupRef.current) resizeObserver.observe(groupRef.current);
    window.addEventListener("resize", updateMeasurements);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMeasurements);
    };
  }, [gapPx, logos.length]);

  return (
    <div
      ref={containerRef}
      className="partners-marquee overflow-hidden rounded-3xl border-y border-white/[0.08] border-x-0 bg-white/[0.03] py-6"
    >
      <motion.div
        className="flex w-max items-center"
        style={{ columnGap: `${gapPx}px` }}
        animate={reduceMotion || shiftPx <= 0 ? undefined : { x: [0, -shiftPx] }}
        transition={
          reduceMotion || shiftPx <= 0
            ? undefined
            : {
                duration: durationSec,
                repeat: Infinity,
                ease: "linear",
              }
        }
      >
        {Array.from({ length: repeatCount }).map((_, repeatIdx) => (
          <div
            key={`group-${repeatIdx}`}
            ref={repeatIdx === 0 ? groupRef : undefined}
            className="flex items-center"
            style={{ columnGap: `${gapPx}px` }}
            aria-hidden={repeatIdx > 0 ? "true" : undefined}
          >
            {prepared.map((logo) => (
              <div key={`${repeatIdx}-${logo.key}`} className="shrink-0" style={{ flexBasis: logoBasis }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.imageUrl}
                  alt={logo.alt}
                  loading="eager"
                  decoding="async"
                  className="h-14 w-full object-contain opacity-95 transition-[filter] duration-300"
                  style={{
                    filter: (logo.sourceTone ?? "light") === "dark" ? "invert(1)" : "none",
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
