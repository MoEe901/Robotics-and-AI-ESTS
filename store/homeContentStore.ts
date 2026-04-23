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
} from "@/lib/firebase/types";
import type { TeamMemberListItem } from "@/lib/team/types";

type HomeContentStore = {
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
        };
      },
      partialize: (s) => ({
        events: s.events,
        teamMembers: s.teamMembers,
        sections: s.sections,
        knowUsConfig: s.knowUsConfig,
        partnersConfig: s.partnersConfig,
        whyJoinConfig: s.whyJoinConfig,
        cellulesConfig: s.cellulesConfig,
        processStepsConfig: s.processStepsConfig,
        faqConfig: s.faqConfig,
        applyConfig: s.applyConfig,
      }),
      version: 4,
    },
  ),
);
