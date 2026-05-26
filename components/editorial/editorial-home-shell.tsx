"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { EditorialNav } from "@/components/editorial/editorial-nav";
import { EditorialHero } from "@/components/editorial/editorial-hero";
import { EditorialSections } from "@/components/editorial/editorial-sections";
import { EditorialFooter } from "@/components/editorial/editorial-footer";
import { EditorialTicker } from "@/components/editorial/editorial-ticker";
import { subscribeHomePageFirestore } from "@/lib/firebase/home-page-sync";
import { useHomeContentStore } from "@/store/homeContentStore";
import { db } from "@/lib/firebase";

type SectionLayout = {
  order: string[];
  visibility: Record<string, boolean>;
};

const DEFAULT_LAYOUT: SectionLayout = {
  order: ["hero", "events", "knowUs", "whyJoin", "cellules", "processSteps", "team", "faq", "apply", "footer"],
  visibility: { hero: true, events: true, knowUs: true, whyJoin: true, cellules: true, processSteps: true, team: true, faq: true, apply: true, footer: true },
};

export function EditorialHomeShell() {
  const [layout, setLayout] = useState<SectionLayout>(DEFAULT_LAYOUT);

  // Subscribe to Firestore layout
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

  // Subscribe to home content
  const events = useHomeContentStore((s) => s.events);
  const teamMembers = useHomeContentStore((s) => s.teamMembers);
  const sections = useHomeContentStore((s) => s.sections);
  const sectionLayout = useHomeContentStore((s) => s.sectionLayout);
  const knowUsConfig = useHomeContentStore((s) => s.knowUsConfig);
  const partnersConfig = useHomeContentStore((s) => s.partnersConfig);
  const whyJoinConfig = useHomeContentStore((s) => s.whyJoinConfig);
  const cellulesConfig = useHomeContentStore((s) => s.cellulesConfig);
  const processStepsConfig = useHomeContentStore((s) => s.processStepsConfig);
  const faqConfig = useHomeContentStore((s) => s.faqConfig);
  const applyConfig = useHomeContentStore((s) => s.applyConfig);

  useEffect(() => {
    const sync = useHomeContentStore.getState();
    return subscribeHomePageFirestore(sync);
  }, []);

  const showHero = layout.visibility.hero !== false;
  const showFooter = layout.visibility.footer !== false;

  return (
    <div className="relative z-[2] flex flex-col">
      <div className="ed-paper-grain" />
      <EditorialTicker />
      <EditorialNav />
      <main>
        {showHero && <EditorialHero />}
        <EditorialSections
          events={events}
          teamMembers={teamMembers}
          knowUsConfig={knowUsConfig}
          partnersConfig={partnersConfig}
          whyJoinConfig={whyJoinConfig}
          cellulesConfig={cellulesConfig}
          processStepsConfig={processStepsConfig}
          faqConfig={faqConfig}
          applyConfig={applyConfig}
          sectionLayout={sectionLayout}
        />
      </main>
      {showFooter && <EditorialFooter />}
    </div>
  );
}
