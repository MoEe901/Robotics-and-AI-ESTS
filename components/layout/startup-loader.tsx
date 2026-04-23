"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 1200;
const FADE_MS = 900;

export function StartupLoader({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const finish = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", finish);
    };
  }, []);

  return (
    <>
      <div
        className="transition-all [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: visible ? 0 : 1,
          transform: visible ? "scale(1.008)" : "scale(1)",
          filter: visible ? "blur(4px)" : "blur(0px)",
          transitionDuration: `${FADE_MS}ms`,
        }}
      >
        {children}
      </div>

      <div
        aria-hidden={!visible}
        className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center [background:var(--background)] transition-all [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(1.02)",
          filter: visible ? "blur(0px)" : "blur(8px)",
          transitionDuration: `${FADE_MS}ms`,
          visibility: visible ? "visible" : "hidden",
        }}
      >
        <div className="px-6">
          <Image
            src="/assets/logos/logo-optimized.svg"
            alt="Robotics & AI Club loading"
            width={520}
            height={320}
            priority
            className="h-auto w-[min(86vw,34rem)] animate-[loaderFloat_2.8s_ease-in-out_infinite] drop-shadow-[0_16px_40px_rgba(27,110,200,0.28)]"
          />
        </div>
      </div>
    </>
  );
}
