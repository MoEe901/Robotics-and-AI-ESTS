import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  EventItem,
  KnowUsConfig,
  PageSection,
  PartnersConfig,
  WhyJoinConfig,
  CellulesConfig,
  ProcessStepsConfig,
  FaqConfig,
  ApplySectionConfig,
  FooterConfig,
  NavbarConfig,
} from "@/lib/firebase/types";
import type { PublicHeroContent } from "@/lib/content/site-content-parser";
import type { TeamMemberListItem } from "@/lib/team/types";

export type HomeContentStore = {
  events: EventItem[];
  teamMembers: TeamMemberListItem[];
  sections: PageSection[];
  knowUsConfig: KnowUsConfig | null;
  partnersConfig: PartnersConfig | null;
  whyJoinConfig: WhyJoinConfig | null;
  cellulesConfig: CellulesConfig | null;
  processStepsConfig: ProcessStepsConfig | null;
  faqConfig: FaqConfig | null;
  applyConfig: ApplySectionConfig | null;
  publicHero: PublicHeroContent | null;
  navbarConfig: NavbarConfig | null;
  footerConfig: FooterConfig | null;
  eventsEmptyCopy: { title: string; message: string };
  setEvents: (events: EventItem[]) => void;
  setTeamMembers: (members: TeamMemberListItem[]) => void;
  setSections: (sections: PageSection[]) => void;
  setKnowUsConfig: (config: KnowUsConfig | null) => void;
  setPartnersConfig: (config: PartnersConfig | null) => void;
  setWhyJoinConfig: (config: WhyJoinConfig | null) => void;
  setCellulesConfig: (config: CellulesConfig | null) => void;
  setProcessStepsConfig: (config: ProcessStepsConfig | null) => void;
  setFaqConfig: (config: FaqConfig | null) => void;
  setApplyConfig: (config: ApplySectionConfig | null) => void;
  setPublicHero: (hero: PublicHeroContent | null) => void;
  setNavbarConfig: (config: NavbarConfig | null) => void;
  setFooterConfig: (config: FooterConfig | null) => void;
  setEventsEmptyCopy: (copy: { title: string; message: string }) => void;
};

type PersistedHomeContentState = Partial<
  Omit<
    HomeContentStore,
    | "setEvents"
    | "setTeamMembers"
    | "setSections"
    | "setKnowUsConfig"
    | "setPartnersConfig"
    | "setWhyJoinConfig"
    | "setCellulesConfig"
    | "setProcessStepsConfig"
    | "setFaqConfig"
    | "setApplyConfig"
    | "setPublicHero"
    | "setNavbarConfig"
    | "setFooterConfig"
    | "setEventsEmptyCopy"
  >
>;

export const useHomeContentStore = create<HomeContentStore>()(
  persist(
    (set) => ({
      events: [],
      teamMembers: [],
      sections: [],
      knowUsConfig: null,
      partnersConfig: null,
      whyJoinConfig: null,
      cellulesConfig: null,
      processStepsConfig: null,
      faqConfig: null,
      applyConfig: null,
      publicHero: null,
      navbarConfig: null,
      footerConfig: null,
      eventsEmptyCopy: { title: "No events scheduled yet.", message: "" },
      setEvents: (events) => set({ events }),
      setTeamMembers: (teamMembers) => set({ teamMembers }),
      setSections: (sections) => set({ sections }),
      setKnowUsConfig: (knowUsConfig) => set({ knowUsConfig }),
      setPartnersConfig: (partnersConfig) => set({ partnersConfig }),
      setWhyJoinConfig: (whyJoinConfig) => set({ whyJoinConfig }),
      setCellulesConfig: (cellulesConfig) => set({ cellulesConfig }),
      setProcessStepsConfig: (processStepsConfig) => set({ processStepsConfig }),
      setFaqConfig: (faqConfig) => set({ faqConfig }),
      setApplyConfig: (applyConfig) => set({ applyConfig }),
      setPublicHero: (publicHero) => set({ publicHero }),
      setNavbarConfig: (navbarConfig) => set({ navbarConfig }),
      setFooterConfig: (footerConfig) => set({ footerConfig }),
      setEventsEmptyCopy: (eventsEmptyCopy) => set({ eventsEmptyCopy }),
    }),
    {
      name: "home-content-cache",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        const state =
          persistedState && typeof persistedState === "object"
            ? (persistedState as PersistedHomeContentState)
            : {};
        return {
          events: Array.isArray(state.events) ? state.events : [],
          teamMembers: Array.isArray(state.teamMembers) ? state.teamMembers : [],
          sections: Array.isArray(state.sections) ? state.sections : [],
          knowUsConfig: state.knowUsConfig ?? null,
          partnersConfig: state.partnersConfig ?? null,
          whyJoinConfig: state.whyJoinConfig ?? null,
          cellulesConfig: state.cellulesConfig ?? null,
          processStepsConfig: state.processStepsConfig ?? null,
          faqConfig: state.faqConfig ?? null,
          applyConfig: state.applyConfig ?? null,
          publicHero: null,
          navbarConfig: null,
          footerConfig: null,
          eventsEmptyCopy: { title: "No events scheduled yet.", message: "" },
        };
      },
      partialize: (s) => ({
        events: s.events,
        teamMembers: s.teamMembers,
        sections: s.sections,
      }),
      version: 5,
    },
  ),
);
