"use client";

import { useEffect } from "react";

import { HomeSections } from "@/components/content/home-sections";
import {
  subscribeToEvents,
  subscribeToHomepageTeam,
  subscribeToKnowUsConfig,
  subscribeToCellulesConfig,
  subscribeToProcessStepsConfig,
  subscribeToFaqConfig,
  subscribeToApplyConfig,
  subscribeToPartnersConfig,
  subscribeToPageSections,
  subscribeToWhyJoinConfig,
} from "@/lib/firebase/realtime";
import { useHomeContentStore } from "@/store/homeContentStore";

/**
 * Stable DOM for SSR + hydration: same outer shell always; no loading-only branch.
 */
export function HomeRealtimeSections() {
  const events = useHomeContentStore((s) => s.events);
  const teamMembers = useHomeContentStore((s) => s.teamMembers);
  const sections = useHomeContentStore((s) => s.sections);
  const setEvents = useHomeContentStore((s) => s.setEvents);
  const setTeamMembers = useHomeContentStore((s) => s.setTeamMembers);
  const setSections = useHomeContentStore((s) => s.setSections);
  const knowUsConfig = useHomeContentStore((s) => s.knowUsConfig);
  const setKnowUsConfig = useHomeContentStore((s) => s.setKnowUsConfig);
  const partnersConfig = useHomeContentStore((s) => s.partnersConfig);
  const setPartnersConfig = useHomeContentStore((s) => s.setPartnersConfig);
  const whyJoinConfig = useHomeContentStore((s) => s.whyJoinConfig);
  const setWhyJoinConfig = useHomeContentStore((s) => s.setWhyJoinConfig);
  const cellulesConfig = useHomeContentStore((s) => s.cellulesConfig);
  const setCellulesConfig = useHomeContentStore((s) => s.setCellulesConfig);
  const processStepsConfig = useHomeContentStore((s) => s.processStepsConfig);
  const setProcessStepsConfig = useHomeContentStore((s) => s.setProcessStepsConfig);
  const faqConfig = useHomeContentStore((s) => s.faqConfig);
  const setFaqConfig = useHomeContentStore((s) => s.setFaqConfig);
  const applyConfig = useHomeContentStore((s) => s.applyConfig);
  const setApplyConfig = useHomeContentStore((s) => s.setApplyConfig);

  useEffect(() => {
    const unsubEvents = subscribeToEvents(
      (rows) => {
        setEvents(rows);
      },
      () => {},
    );

    const unsubTeam = subscribeToHomepageTeam(
      (rows) => {
        setTeamMembers(rows);
      },
      () => {},
    );

    const unsubSections = subscribeToPageSections(
      (rows) => {
        setSections(rows);
      },
      () => {},
    );

    const unsubKnowUs = subscribeToKnowUsConfig(
      (config) => {
        setKnowUsConfig(config);
      },
      () => {},
    );

    const unsubPartners = subscribeToPartnersConfig(
      (config) => {
        setPartnersConfig(config);
      },
      () => {},
    );

    const unsubWhyJoin = subscribeToWhyJoinConfig(
      (config) => {
        setWhyJoinConfig(config);
      },
      () => {},
    );
    const unsubCellules = subscribeToCellulesConfig(
      (config) => {
        setCellulesConfig(config);
      },
      () => {},
    );

    const unsubProcess = subscribeToProcessStepsConfig(
      (config) => {
        setProcessStepsConfig(config);
      },
      () => {},
    );

    const unsubFaq = subscribeToFaqConfig(
      (config) => {
        setFaqConfig(config);
      },
      () => {},
    );

    const unsubApply = subscribeToApplyConfig(
      (config) => {
        setApplyConfig(config);
      },
      () => {},
    );

    return () => {
      unsubEvents();
      unsubTeam();
      unsubSections();
      unsubKnowUs();
      unsubPartners();
      unsubWhyJoin();
      unsubCellules();
      unsubProcess();
      unsubFaq();
      unsubApply();
    };
  }, [
    setApplyConfig,
    setCellulesConfig,
    setEvents,
    setFaqConfig,
    setKnowUsConfig,
    setPartnersConfig,
    setProcessStepsConfig,
    setSections,
    setTeamMembers,
    setWhyJoinConfig,
  ]);

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
      />
    </div>
  );
}
