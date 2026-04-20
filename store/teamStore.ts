import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TeamMemberProfile } from "@/lib/team/types";

type TeamStore = {
  membersByKey: Record<string, TeamMemberProfile[]>;
  loadedByKey: Record<string, boolean>;
  /** Last known profile by slug (instant navigation / refresh). */
  profilesBySlug: Record<string, TeamMemberProfile>;
  setMembers: (key: string, members: TeamMemberProfile[]) => void;
  markLoaded: (key: string) => void;
  setProfileForSlug: (slug: string, member: TeamMemberProfile | null) => void;
};

export const useTeamStore = create<TeamStore>()(
  persist(
    (set) => ({
      membersByKey: {},
      loadedByKey: {},
      profilesBySlug: {},
      setMembers: (key, members) =>
        set((state) => ({
          membersByKey: { ...state.membersByKey, [key]: members },
          loadedByKey: { ...state.loadedByKey, [key]: true },
        })),
      markLoaded: (key) =>
        set((state) => ({
          loadedByKey: { ...state.loadedByKey, [key]: true },
        })),
      setProfileForSlug: (slug, member) =>
        set((state) => {
          const next = { ...state.profilesBySlug };
          if (member) next[slug] = member;
          else delete next[slug];
          return { profilesBySlug: next };
        }),
    }),
    {
      name: "team-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        membersByKey: state.membersByKey,
        loadedByKey: state.loadedByKey,
        profilesBySlug: state.profilesBySlug,
      }),
      version: 1,
    },
  ),
);
