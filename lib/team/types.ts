import type { TeamMemberVisibility } from "@/lib/firebase/types";

export type { TeamMemberVisibility };

export type TeamContact = {
  _key?: string;
  type?: string;
  value?: string;
  visible?: boolean;
};

/** Role line is built from string tags (Firestore `roles: string[]`). */
export type RoleSummary = {
  _id: string;
  title?: string;
};

export type TeamMemberListItem = {
  _id: string;
  name: string;
  slug?: { current?: string } | null;
  /** Card / list blurb */
  bio?: string;
  shortBio?: string;
  /** Firebase Storage (or HTTPS) URL */
  imageUrl?: string;
  /** Legacy: unused with Firebase; prefer imageUrl */
  image?: unknown | null;
  roleType?: string;
  schoolStatus?: string | null;
  department?: string | null;
  academicYear?: string;
  order?: number;
  /** Derived from Firestore string[] for display */
  roles?: RoleSummary[] | null;
};

export type TeamMemberProfile = TeamMemberListItem & {
  fullDescription?: string;
  contacts?: TeamContact[] | null;
  birthday?: string;
  visibility?: TeamMemberVisibility;
};

export const ROLE_TYPE_FILTERS = ["All"] as const;
