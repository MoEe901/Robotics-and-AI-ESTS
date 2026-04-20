import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { EventItem, PageSection } from "@/lib/firebase/types";
import type { TeamMemberListItem } from "@/lib/team/types";

type HomeContentStore = {
  events: EventItem[];
  teamMembers: TeamMemberListItem[];
  sections: PageSection[];
  setEvents: (events: EventItem[]) => void;
  setTeamMembers: (members: TeamMemberListItem[]) => void;
  setSections: (sections: PageSection[]) => void;
};

export const useHomeContentStore = create<HomeContentStore>()(
  persist(
    (set) => ({
      events: [],
      teamMembers: [],
      sections: [],
      setEvents: (events) => set({ events }),
      setTeamMembers: (teamMembers) => set({ teamMembers }),
      setSections: (sections) => set({ sections }),
    }),
    {
      name: "home-content-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        events: s.events,
        teamMembers: s.teamMembers,
        sections: s.sections,
      }),
      version: 1,
    },
  ),
);
