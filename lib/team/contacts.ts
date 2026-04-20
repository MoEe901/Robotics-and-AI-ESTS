import {
  DEFAULT_TEAM_VISIBILITY,
  type TeamMemberVisibility,
} from "@/lib/firebase/types";
import type { TeamContact, TeamMemberProfile } from "@/lib/team/types";

const DIRECT_TYPES = new Set(["Phone", "Email"]);

/** Fixed slots on the profile “Connect” grid (order matters). */
export const SOCIAL_PLATFORMS = [
  "WhatsApp",
  "Instagram",
  "Snapchat",
  "LinkedIn",
  "GitHub",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const GRID_PLATFORM_SET = new Set<string>(SOCIAL_PLATFORMS);

function mergedVisibility(v?: TeamMemberVisibility | null): TeamMemberVisibility {
  return {
    ...DEFAULT_TEAM_VISIBILITY,
    ...v,
    showBirthday: v?.showBirthday === true,
  };
}

function platformAllows(type: string, v: TeamMemberVisibility): boolean {
  switch (type) {
    case "Email":
      return v.showEmail;
    case "Phone":
      return v.showPhone;
    case "WhatsApp":
      return v.showWhatsApp;
    case "Instagram":
      return v.showInstagram;
    case "Snapchat":
      return v.showSnapchat;
    case "LinkedIn":
      return v.showLinkedIn;
    case "GitHub":
      return v.showGitHub;
    default:
      return v.showSocial;
  }
}

export function getVisibleContacts(member: TeamMemberProfile): TeamContact[] {
  const raw = member.contacts ?? [];
  const v = mergedVisibility(member.visibility);
  return raw.filter((c) => {
    if (!c?.type || !c.value || c.visible === false) return false;
    return platformAllows(c.type, v);
  });
}

export function partitionContacts(contacts: TeamContact[]) {
  const direct: TeamContact[] = [];
  const social: TeamContact[] = [];
  for (const c of contacts) {
    if (c.type && DIRECT_TYPES.has(c.type)) direct.push(c);
    else social.push(c);
  }
  return { direct, social };
}

/** Social contacts that are not one of the five fixed grid platforms (e.g. Discord). */
export function extraSocialContacts(contacts: TeamContact[]): TeamContact[] {
  return contacts.filter((c) => c.type && !GRID_PLATFORM_SET.has(c.type));
}
