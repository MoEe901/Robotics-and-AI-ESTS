import type { Timestamp } from "firebase/firestore";

export type TeamMemberVisibility = {
  showEmail: boolean;
  showPhone: boolean;
  showSocial: boolean;
  showFullDescription: boolean;
  showBirthday: boolean;
  showWhatsApp: boolean;
  showInstagram: boolean;
  showSnapchat: boolean;
  showLinkedIn: boolean;
  showGitHub: boolean;
};

export type FirestoreTeamContact = {
  type: string;
  value: string;
  visible: boolean;
};

export type FirestoreTeamMember = {
  name: string;
  slug: string;
  roleType: string;
  roles: string[];
  academicYear: string;
  department: string;
  schoolStatus: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  bio?: string;
  shortBio?: string;
  fullDescription?: string;
  birthday?: string;
  contacts?: FirestoreTeamContact[];
  visibility?: Partial<TeamMemberVisibility>;
};

export type EventAttachment = {
  label: string;
  url: string;
  visible?: boolean;
};

export type EventGalleryItem = {
  url: string;
  kind: "image" | "video";
  caption?: string;
  visible?: boolean;
};

export type EventDoc = {
  title: string;
  slug?: string;
  description?: string;
  documentary?: string;
  location?: string;
  locationMapsUrl?: string;
  date?: string;
  attachments?: EventAttachment[];
  gallery?: EventGalleryItem[];
  eventWebsiteUrl?: string;
  showEventWebsite?: boolean;
  eventWebsiteButtonColor?: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  order?: number;
};

export type PageSectionDoc = {
  title: string;
  sectionType: string;
  order?: number;
};

export type EventItem = {
  _id: string;
  title: string;
  slug?: { current?: string } | null;
  description?: string;
  documentary?: string;
  location?: string;
  locationMapsUrl?: string;
  date?: string;
  attachments?: EventAttachment[];
  gallery?: EventGalleryItem[];
  eventWebsiteUrl?: string;
  showEventWebsite?: boolean;
  eventWebsiteButtonColor?: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string | null;
  order?: number;
};

export type PageSection = {
  _id: string;
  title: string;
  sectionType: string;
  order?: number;
};

export const DEFAULT_TEAM_VISIBILITY: TeamMemberVisibility = {
  showEmail: true,
  showPhone: true,
  showSocial: true,
  showFullDescription: true,
  showBirthday: false,
  showWhatsApp: true,
  showInstagram: true,
  showSnapchat: true,
  showLinkedIn: true,
  showGitHub: true,
};
