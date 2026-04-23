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
