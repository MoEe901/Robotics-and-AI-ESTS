/**
 * Canonical Firestore shapes for public homepage content (siteContent, faq, apply).
 * Runtime parsing lives in `lib/content/*-parser.ts` with Zod + fallbacks.
 */

import type { Timestamp } from "firebase/firestore";

export type SiteHeroDoc = {
  eyebrow: string;
  location: string;
  titleLines: string[];
  accentIndices: number[];
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  videoUrl: string | null;
  liveActivity: Array<{ id: string; title: string; timeAgo: string }>;
  techStack: string[];
  growthStats: Array<{ label: string; value: string }>;
  updatedAt?: Timestamp;
};

export type SiteKnowUsDoc = {
  emailHeading?: string;
  mainTitle: string;
  cards: Array<{ id: string; title: string; body: string; order: number }>;
  updatedAt?: Timestamp;
};

export type SiteWhyJoinDoc = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: Array<{ id: string; title: string; subtitle: string }>;
  steps: Array<{ id: string; number: string; title: string; body: string; order: number }>;
  updatedAt?: Timestamp;
};

export type SiteCellulesDoc = {
  eyebrow: string;
  title: string;
  intro: string;
  items: Array<{ id: string; number: string; title: string; body: string; order: number }>;
  updatedAt?: Timestamp;
};

export type SiteProcessStepsDoc = {
  eyebrow: string;
  title: string;
  steps: Array<{ id: string; number: string; label: string; title: string; body: string; order: number }>;
  updatedAt?: Timestamp;
};

export type SiteFooterDoc = {
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  columns: Array<{ heading: string; links: Array<{ label: string; href: string }> }>;
  socials: Array<{ platform: string; url: string }>;
  copyrightText?: string;
  versionLine?: string;
  updatedAt?: Timestamp;
};

export type SitePartnersDoc = {
  title: string;
  logos: Array<{ imageUrl: string; alt?: string; visible?: boolean; sourceTone?: "light" | "dark" }>;
  updatedAt?: Timestamp;
};

export type EventsConfigPublicDoc = {
  emptyTitle?: string;
  emptyMessage?: string;
  updatedAt?: Timestamp;
};

export type FaqConfigDoc = {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  categories: Array<{ id: string; label: string }>;
  updatedAt?: Timestamp;
};

export type FaqQuestionDoc = {
  categoryId: string;
  question: string;
  answer: string;
  accentColor?: string;
  icon?: string;
  order: number;
  isVisible?: boolean;
};
