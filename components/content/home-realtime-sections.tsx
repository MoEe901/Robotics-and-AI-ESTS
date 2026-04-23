"use client";

import { useEffect } from "react";

import { HomeSections } from "@/components/content/home-sections";
import { subscribeHomePageFirestore } from "@/lib/firebase/home-page-sync";
import { useHomeContentStore } from "@/store/homeContentStore";

/**
 * Stable DOM for SSR + hydration: same outer shell always; no loading-only branch.
 * Eight Firestore listeners (see `subscribeHomePageFirestore`).
 */
export function HomeRealtimeSections() {
  const events = useHomeContentStore((s) => s.events);
  const teamMembers = useHomeContentStore((s) => s.teamMembers);
  const sections = useHomeContentStore((s) => s.sections);
  const knowUsConfig = useHomeContentStore((s) => s.knowUsConfig);
  const partnersConfig = useHomeContentStore((s) => s.partnersConfig);
  const whyJoinConfig = useHomeContentStore((s) => s.whyJoinConfig);
  const cellulesConfig = useHomeContentStore((s) => s.cellulesConfig);
  const processStepsConfig = useHomeContentStore((s) => s.processStepsConfig);
  const faqConfig = useHomeContentStore((s) => s.faqConfig);
  const applyConfig = useHomeContentStore((s) => s.applyConfig);
  const eventsEmptyCopy = useHomeContentStore((s) => s.eventsEmptyCopy);

  useEffect(() => {
    const sync = useHomeContentStore.getState();
    return subscribeHomePageFirestore(sync);
  }, []);

  if (process.env.NODE_ENV === "development") {
    console.log("[Home] events:", events.length, "team:", teamMembers.length, "sections:", sections.length);
  }

  return (
    <div className="min-h-[200px]" suppressHydrationWarning>
      <HomeSections
        events={events}
        teamMembers={teamMembers}
        sections={sections}
        knowUsConfig={knowUsConfig}
        partnersConfig={partnersConfig}
        whyJoinConfig={whyJoinConfig}
        cellulesConfig={cellulesConfig}
        processStepsConfig={processStepsConfig}
        faqConfig={faqConfig}
        applyConfig={applyConfig}
        eventsEmptyCopy={eventsEmptyCopy}
      />
    </div>
  );
}
