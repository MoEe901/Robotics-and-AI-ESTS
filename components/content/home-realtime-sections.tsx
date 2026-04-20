"use client";

import { useEffect } from "react";

import { HomeSections } from "@/components/content/home-sections";
import {
  subscribeToEvents,
  subscribeToHomepageTeam,
  subscribeToPageSections,
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

    return () => {
      unsubEvents();
      unsubTeam();
      unsubSections();
    };
  }, [setEvents, setSections, setTeamMembers]);

  if (process.env.NODE_ENV === "development") {
    console.log("[Home] events:", events.length, "team:", teamMembers.length, "sections:", sections.length);
  }

  return (
    <div className="min-h-[200px]" suppressHydrationWarning>
      <HomeSections events={events} teamMembers={teamMembers} sections={sections} />
    </div>
  );
}
