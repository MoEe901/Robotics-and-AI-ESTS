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
  /** When false, hide from public site (admin can still see). */
  isVisible?: boolean;
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
  eventStory?: string;
  location?: string;
  venue?: string;
  locationMapsUrl?: string;
  mapsUrl?: string;
  date?: string;
  dateTba?: boolean;
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
  dateTba?: boolean;
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

export type KnowUsCard = {
  title: string;
  description: string;
};

export type KnowUsConfig = {
  intro: string;
  cards: KnowUsCard[];
  /** Firestore `mainTitle` — optional custom heading for the Know us block. */
  sectionTitle?: string;
};

export type PartnerLogo = {
  imageUrl: string;
  alt: string;
  visible?: boolean;
  sourceTone?: "light" | "dark";
};

export type PartnersConfig = {
  title: string;
  logos: PartnerLogo[];
};

export type WhyJoinCard = {
  title: string;
  description: string;
};

export type WhyJoinConfig = {
  smallHeading: string;
  title: string;
  description: string;
  cards: WhyJoinCard[];
  /** Optional left-column highlight rows (Firestore `whyJoin.highlights`). */
  highlights?: Array<{ title: string; subtitle: string }>;
};

export type CelluleCard = {
  title: string;
  description: string;
  iconKey?: string;
  iconImageUrl?: string;
};

export type CellulesConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: CelluleCard[];
};

export type ProcessStepItem = {
  badge: string;
  title: string;
  description: string;
  /** Lucide-style key: users | lightbulb | calendar | award | rocket | target | sparkles */
  iconKey: string;
};

export type ProcessStepsConfig = {
  eyebrow: string;
  /** Text before the gradient accent (e.g. "Step-by-Step ") */
  titleLine: string;
  /** Gradient accent word (e.g. "Process") */
  titleAccent: string;
  steps: ProcessStepItem[];
};

export type FaqCategory = {
  id: string;
  label: string;
};

export type FaqItemColor = "blue" | "violet" | "pink" | "amber" | "green";

export type FaqItem = {
  categoryId: string;
  question: string;
  answer: string;
  color: FaqItemColor;
  iconKey: string;
};

export type FaqConfig = {
  eyebrow: string;
  titleLine: string;
  titleAccent: string;
  subtitle: string;
  categories: FaqCategory[];
  items: FaqItem[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLabel: string;
  ctaButtonHref: string;
};

export type ApplyContactIconKey = "map" | "phone" | "mail" | "clock";
export type ApplyContactTone = "blue" | "violet" | "pink" | "green";

export type ApplyContactRow = {
  label: string;
  /** Use line breaks in text; rendered with <br /> on site */
  value: string;
  iconKey: ApplyContactIconKey;
  tone: ApplyContactTone;
};

export type ApplySocialPlatform = "instagram" | "linkedin" | "twitter" | "youtube";

export type ApplySocialLink = {
  platform: ApplySocialPlatform;
  url: string;
};

export type ApplyCommunityPlatform =
  | "discord"
  | "whatsapp"
  | "telegram"
  | "slack"
  | "signal"
  | "messenger"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "email"
  | "generic";

export type ApplyCommunityColor =
  | "indigo"
  | "emerald"
  | "sky"
  | "violet"
  | "cyan"
  | "rose"
  | "amber"
  | "white"
  | "blue"
  | "teal"
  | "green"
  | "lime"
  | "orange"
  | "red"
  | "pink"
  | "fuchsia"
  | "purple"
  | "slate"
  | "black"
  | "custom";

export type ApplyCommunityAction = {
  id: string;
  platform: ApplyCommunityPlatform;
  label: string;
  url: string;
  color: ApplyCommunityColor;
  /** Hex color like "#5865F2". Only used when color === "custom". */
  customHex?: string;
  isVisible: boolean;
  order: number;
};

export type ApplyCommunityConfig = {
  isVisible: boolean;
  eyebrow: string;
  titleLine: string;
  titleAccent: string;
  description: string;
  actions: ApplyCommunityAction[];
};

export type ApplySectionConfig = {
  topLabel: string;
  heroLine1: string;
  heroLine2: string;
  heroSub: string;
  infoBadge: string;
  infoTitle: string;
  infoDesc: string;
  contactRows: ApplyContactRow[];
  socialLinks: ApplySocialLink[];
  formTitle: string;
  formSubtitle: string;
  firstNameLabel: string;
  lastNameLabel: string;
  yearLabel: string;
  departmentLabel: string;
  emailLabel: string;
  phoneLabel: string;
  messageLabel: string;
  placeholders: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
  };
  yearOptions: string[];
  departmentOptions: string[];
  charterLinkText: string;
  charterLinkHref: string;
  submitNotePrefix: string;
  submitButtonLabel: string;
  successTitle: string;
  successMessage: string;
  community: ApplyCommunityConfig;
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

export type FooterSocialPlatform = "instagram" | "linkedin" | "youtube" | "github";

export type FooterSocialLink = {
  platform: FooterSocialPlatform;
  url: string;
};

export type FooterNavItem = {
  label: string;
  href: string;
};

export type FooterColumn = {
  heading: string;
  links: FooterNavItem[];
};

export type FooterConfig = {
  tagline: string;
  /** First column links when `footerColumns` is not used. */
  footerNav: FooterNavItem[];
  socialLinks: FooterSocialLink[];
  contactLocation: string;
  contactEmail: string;
  copyrightText: string;
  /** Right side of the bottom bar (mono). */
  versionLine: string;
  /** When set, footer link columns are rendered from Firestore (`siteContent/footer`). */
  footerColumns?: FooterColumn[];
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  tagline:
    "A university tech community at EST Safi, Morocco. Building the future through robotics, AI, and collaboration.",
  footerNav: [
    { label: "Home", href: "/" },
    { label: "Events", href: "/#events" },
    { label: "Projects", href: "/#cellules" },
    { label: "Competitions", href: "/#events" },
  ],
  socialLinks: [
    { platform: "instagram", url: "https://www.instagram.com/" },
    { platform: "linkedin", url: "https://www.linkedin.com/" },
  ],
  contactLocation: "Route Sidi Aissa, R.P. 100 26000 — Safi, Morocco",
  contactEmail: "roboticsaiclub.est@gmail.com",
  copyrightText: "Robotics & AI Club · EST Safi, Morocco",
  versionLine: "All systems operational · v2.0",
};

export type HeroConfig = {
  eyebrow: string;
  headlinePrefix: string;
  headlineAccent: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaSecondaryText: string;
  ctaSecondaryHref: string;
};

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  eyebrow: "University Tech Community · EST Safi",
  headlinePrefix: "Welcome to the",
  headlineAccent: "Robotics & AI Club",
  subtitle:
    "A community of builders, dreamers, and innovators transforming ideas into intelligent machines. Join us and shape the future of technology — starting today.",
  ctaPrimaryText: "Join the Club",
  ctaPrimaryHref: "/#apply",
  ctaSecondaryText: "Explore Events",
  ctaSecondaryHref: "/#events",
};

export type NavbarLink = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  order: number;
  isVisible: boolean;
};

export type NavbarConfig = {
  logoUrl: string;
  logoText: string;
  links: NavbarLink[];
  ctaButton: { label: string; href: string; isVisible: boolean };
  showThemeToggle: boolean;
};

export const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
  logoUrl: "/assets/logos/logo-optimized.svg",
  logoText: "Robotics & AI Club",
  links: [
    { id: "home", label: "Home", href: "/", isExternal: false, order: 0, isVisible: true },
    { id: "events", label: "Events", href: "/#events", isExternal: false, order: 1, isVisible: true },
    { id: "know", label: "Know us", href: "/#know", isExternal: false, order: 2, isVisible: true },
    { id: "cellules", label: "Cellules", href: "/#cellules", isExternal: false, order: 3, isVisible: true },
    { id: "team", label: "Team", href: "/#team", isExternal: false, order: 4, isVisible: true },
    { id: "faq", label: "FAQ", href: "/#faq", isExternal: false, order: 5, isVisible: true },
  ],
  ctaButton: { label: "Apply Now", href: "/#apply", isVisible: true },
  showThemeToggle: true,
};
