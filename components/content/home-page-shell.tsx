"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { HomeRealtimeSections } from "@/components/content/home-realtime-sections";
import { HeroSection } from "@/components/hero/hero-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { db } from "@/lib/firebase";

type SectionLayout = {
  order: string[];
  visibility: Record<string, boolean>;
};

const DEFAULT_LAYOUT: SectionLayout = {
  order: ["hero", "events", "knowUs", "whyJoin", "cellules", "processSteps", "faq", "apply", "footer"],
  visibility: { hero: true, footer: true },
};

export function HomePageShell() {
  const [layout, setLayout] = useState<SectionLayout>(DEFAULT_LAYOUT);

  useEffect(() => {
    return onSnapshot(doc(db(), "siteConfig", "sections"), (snap) => {
      if (!snap.exists()) return;
      const raw = snap.data() as Record<string, unknown>;
      const order = Array.isArray(raw.order) ? raw.order.filter((x): x is string => typeof x === "string") : [];
      const visRaw = raw.visibility && typeof raw.visibility === "object"
        ? (raw.visibility as Record<string, unknown>)
        : {};
      const visibility: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(visRaw)) visibility[k] = v !== false;
      setLayout({ order: order.length ? order : DEFAULT_LAYOUT.order, visibility });
    });
  }, []);

  const sectionOrder = (id: string) => {
    const idx = layout.order.indexOf(id);
    return idx >= 0 ? idx : 999;
  };
  const showHero = layout.visibility.hero !== false;
  const showFooter = layout.visibility.footer !== false;

  return (
    <div className="relative z-[2] flex flex-col">
      <Navbar />
      {showHero ? (
        <div style={{ order: sectionOrder("hero") }}>
          <HeroSection />
        </div>
      ) : null}
      <div style={{ order: sectionOrder("events") }}>
        <HomeRealtimeSections />
      </div>
      {showFooter ? (
        <div style={{ order: sectionOrder("footer") }}>
          <Footer />
        </div>
      ) : null}
    </div>
  );
}
