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

export type TeamExpertiseEntry = {
  title: string;
  /** 0..100 progress-bar value */
  level: number;
};

export type TeamMemberProfile = TeamMemberListItem & {
  fullDescription?: string;
  contacts?: TeamContact[] | null;
  birthday?: string;
  visibility?: TeamMemberVisibility;
  /** Free-text year the member started as Professor / Doctoral student. */
  startedYear?: string;
  /** Admin-managed expertise list (title + progress %). Empty when unset. */
  expertise?: TeamExpertiseEntry[];
};

export const ROLE_TYPE_FILTERS = ["All"] as const;
