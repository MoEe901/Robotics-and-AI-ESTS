"use client";

import { useEffect, useRef } from "react";

function useEdReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function EditorialHero() {
  const ref = useEdReveal();

  return (
    <section id="home" className="ed-hero">
      <div className="ed-reveal" ref={ref}>
        <div style={{ marginBottom: 28 }}>
          <span className="ed-eyebrow">University Tech Community · EST Safi</span>
        </div>

        <h1 className="ed-hero-headline">
          We build<br />
          <span className="ed-it">thinking</span>{" "}
          machines<br />
          <span className="ed-underline">in Safi.</span>
        </h1>

        <p className="ed-hero-deck">
          A student-run lab at{" "}
          <em style={{ color: "var(--ed-terracotta)" }}>EST Safi</em> where
          engineers, designers, and the merely-curious solder, script, and ship
          robotics and AI projects together. Not a study group. A build
          community.
        </p>

        <div className="ed-hero-ctas">
          <a href="#apply" className="ed-btn ed-btn-primary">
            <span>Join the club</span>
            <span className="ed-btn-arrow">→</span>
          </a>
          <a href="#events" className="ed-btn ed-btn-ghost">
            <span>Explore events</span>
            <span className="ed-btn-arrow">↓</span>
          </a>
        </div>

        <div className="ed-hero-meta">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="ed-hero-meta-label">Cohort</span>
            <span className="ed-hero-meta-value">VII</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="ed-hero-meta-label">Academic year</span>
            <span className="ed-hero-meta-value">
              <em>2025/26</em>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="ed-hero-meta-label">Builds shipped</span>
            <span className="ed-hero-meta-value">18</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, display: "grid", placeItems: "center" }}>
        <div className="ed-hero-visual-frame">
          <span className="ed-hero-stamp ed-hero-stamp-tl">// Workshop · Lab 03</span>
          <span className="ed-hero-stamp ed-hero-stamp-br">Rev. 04 — Live</span>
          <span className="ed-hero-visual-content">R/AI</span>
        </div>
      </div>

      <div className="ed-hero-cue">
        <span>Scroll</span>
        <span className="ed-hero-cue-line" />
      </div>
    </section>
  );
}
