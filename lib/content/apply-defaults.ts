import type {
  ApplyCommunityAction,
  ApplyCommunityColor,
  ApplyCommunityConfig,
  ApplyCommunityPlatform,
  ApplyContactRow,
  ApplySectionConfig,
  ApplySocialLink,
  ApplySocialPlatform,
} from "@/lib/firebase/types";

const ICON_KEYS = new Set(["map", "phone", "mail", "clock"]);
const TONES = new Set(["blue", "violet", "pink", "green"]);
const PLATFORMS = new Set(["instagram", "linkedin", "twitter", "youtube"]);

export const COMMUNITY_PLATFORMS: readonly ApplyCommunityPlatform[] = [
  "discord",
  "whatsapp",
  "telegram",
  "slack",
  "signal",
  "messenger",
  "instagram",
  "linkedin",
  "twitter",
  "email",
  "generic",
] as const;

export const COMMUNITY_COLORS: readonly ApplyCommunityColor[] = [
  "indigo",
  "emerald",
  "sky",
  "violet",
  "cyan",
  "rose",
  "amber",
  "white",
  "blue",
  "teal",
  "green",
  "lime",
  "orange",
  "red",
  "pink",
  "fuchsia",
  "purple",
  "slate",
  "black",
  "custom",
] as const;

const COMMUNITY_PLATFORM_SET = new Set<string>(COMMUNITY_PLATFORMS);
const COMMUNITY_COLOR_SET = new Set<string>(COMMUNITY_COLORS);

export const DEFAULT_COMMUNITY_CONFIG: ApplyCommunityConfig = {
  isVisible: true,
  eyebrow: "",
  titleLine: "Ready to join this",
  titleAccent: "Community?",
  description:
    "Join our vibrant communities! Connect, share, and grow with like-minded enthusiasts across every channel.",
  actions: [
    {
      id: "discord",
      platform: "discord",
      label: "Join Discord",
      url: "",
      color: "indigo",
      isVisible: true,
      order: 0,
    },
    {
      id: "whatsapp",
      platform: "whatsapp",
      label: "Join WhatsApp",
      url: "",
      color: "emerald",
      isVisible: true,
      order: 1,
    },
  ],
};

export function parseCommunityConfig(raw: unknown): ApplyCommunityConfig {
  const base = structuredClone(DEFAULT_COMMUNITY_CONFIG);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  if (typeof o.isVisible === "boolean") base.isVisible = o.isVisible;
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  if (typeof o.eyebrow === "string") base.eyebrow = s("eyebrow");
  if (typeof o.titleLine === "string" && s("titleLine").trim()) base.titleLine = s("titleLine");
  if (typeof o.titleAccent === "string" && s("titleAccent").trim()) base.titleAccent = s("titleAccent");
  if (typeof o.description === "string" && s("description").trim()) base.description = s("description");

  const actionsRaw = Array.isArray(o.actions) ? o.actions : [];
  const parsed: ApplyCommunityAction[] = [];
  actionsRaw.forEach((row, idx) => {
    if (!row || typeof row !== "object") return;
    const r = row as Record<string, unknown>;
    const platformRaw = typeof r.platform === "string" ? r.platform.trim().toLowerCase() : "";
    const colorRaw = typeof r.color === "string" ? r.color.trim().toLowerCase() : "";
    const label = typeof r.label === "string" ? r.label.trim() : "";
    const url = typeof r.url === "string" ? r.url.trim() : "";
    const id =
      typeof r.id === "string" && r.id.trim().length > 0
        ? r.id.trim()
        : `${platformRaw || "action"}-${idx}`;
    if (!label) return;
    const platform: ApplyCommunityPlatform = COMMUNITY_PLATFORM_SET.has(platformRaw)
      ? (platformRaw as ApplyCommunityPlatform)
      : "generic";
    const color: ApplyCommunityColor = COMMUNITY_COLOR_SET.has(colorRaw)
      ? (colorRaw as ApplyCommunityColor)
      : "violet";
    const rawHex = typeof r.customHex === "string" ? r.customHex.trim() : "";
    const customHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawHex) ? rawHex : "";
    parsed.push({
      id,
      platform,
      label,
      url,
      color,
      customHex: customHex || undefined,
      isVisible: r.isVisible !== false,
      order: typeof r.order === "number" ? r.order : idx,
    });
  });
  if (parsed.length > 0) {
    base.actions = parsed.sort((a, b) => a.order - b.order).slice(0, 8);
  }
  return base;
}

export const DEFAULT_APPLY_CONFIG: ApplySectionConfig = {
  topLabel: "Join the Mission",
  heroLine1: "Connect with",
  heroLine2: "Robotics & AI",
  heroSub:
    "Step into a community where builders, creators, and innovators converge. Subscribe to stay ahead — workshops, events, competitions, and more.",
  infoBadge: "EST Safi — Morocco",
  infoTitle: "Find Us Here",
  infoDesc: "We're rooted at EST Safi. Come meet us, or reach out digitally — we respond fast.",
  contactRows: [
    {
      label: "Address",
      value: "Route Dar Si Aissa, B.P. 89\n46000 — Safi, Morocco",
      iconKey: "map",
      tone: "blue",
    },
    {
      label: "Call Us",
      value: "+212 68444912",
      iconKey: "phone",
      tone: "violet",
    },
    {
      label: "Email",
      value: "roboticsai.club.ests@gmail.com",
      iconKey: "mail",
      tone: "pink",
    },
    {
      label: "Hours",
      value: "Monday – Friday\n9AM – 5PM",
      iconKey: "clock",
      tone: "green",
    },
  ],
  socialLinks: [
    { platform: "instagram", url: "" },
    { platform: "linkedin", url: "" },
    { platform: "twitter", url: "" },
    { platform: "youtube", url: "" },
  ],
  formTitle: "Subscription Form",
  formSubtitle: "Fill in your details to join the club and stay in the loop.",
  firstNameLabel: "First Name",
  lastNameLabel: "Last Name",
  yearLabel: "Education Year",
  departmentLabel: "Department",
  emailLabel: "Email",
  phoneLabel: "Phone Number",
  messageLabel: "Message",
  placeholders: {
    firstName: "Yassine",
    lastName: "El Amrani",
    email: "you@example.com",
    phone: "+212 6XXXXXXXX",
    message: "Tell us what interests you most — robotics, AI, design, media…",
  },
  yearOptions: ["1st Year", "2nd Year", "3rd Year"],
  departmentOptions: [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Industrial Engineering",
    "Other",
  ],
  charterLinkText: "Club Charter",
  charterLinkHref: "#",
  submitNotePrefix: "By subscribing you agree to our",
  submitButtonLabel: "Join the Club",
  successTitle: "You're In!",
  successMessage:
    "Welcome to the Robotics & AI Club family. We'll be in touch soon with everything you need to get started.",
  community: DEFAULT_COMMUNITY_CONFIG,
};

export function mergeApplyFromFirestore(raw: Record<string, unknown>): ApplySectionConfig {
  const d: ApplySectionConfig = structuredClone(DEFAULT_APPLY_CONFIG);

  const s = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  if (s("topLabel")) d.topLabel = s("topLabel");
  if (s("heroLine1")) d.heroLine1 = s("heroLine1");
  if (s("heroLine2")) d.heroLine2 = s("heroLine2");
  if (s("heroSub")) d.heroSub = s("heroSub");
  if (s("infoBadge")) d.infoBadge = s("infoBadge");
  if (s("infoTitle")) d.infoTitle = s("infoTitle");
  if (s("infoDesc")) d.infoDesc = s("infoDesc");
  if (s("formTitle")) d.formTitle = s("formTitle");
  if (s("formSubtitle")) d.formSubtitle = s("formSubtitle");
  if (s("firstNameLabel")) d.firstNameLabel = s("firstNameLabel");
  if (s("lastNameLabel")) d.lastNameLabel = s("lastNameLabel");
  if (s("yearLabel")) d.yearLabel = s("yearLabel");
  if (s("departmentLabel")) d.departmentLabel = s("departmentLabel");
  if (s("emailLabel")) d.emailLabel = s("emailLabel");
  if (s("phoneLabel")) d.phoneLabel = s("phoneLabel");
  if (s("messageLabel")) d.messageLabel = s("messageLabel");
  if (s("charterLinkText")) d.charterLinkText = s("charterLinkText");
  if (s("charterLinkHref")) d.charterLinkHref = s("charterLinkHref");
  if (s("submitNotePrefix")) d.submitNotePrefix = s("submitNotePrefix");
  if (s("submitButtonLabel")) d.submitButtonLabel = s("submitButtonLabel");
  if (s("successTitle")) d.successTitle = s("successTitle");
  if (s("successMessage")) d.successMessage = s("successMessage");

  const ph = raw.placeholders;
  if (ph && typeof ph === "object") {
    const o = ph as Record<string, unknown>;
    if (typeof o.firstName === "string") d.placeholders.firstName = o.firstName;
    if (typeof o.lastName === "string") d.placeholders.lastName = o.lastName;
    if (typeof o.email === "string") d.placeholders.email = o.email;
    if (typeof o.phone === "string") d.placeholders.phone = o.phone;
    if (typeof o.message === "string") d.placeholders.message = o.message;
  }

  const rowsRaw = Array.isArray(raw.contactRows) ? raw.contactRows : [];
  const rows = rowsRaw
    .map((row): ApplyContactRow | null => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const value = typeof o.value === "string" ? o.value : "";
      const ik = typeof o.iconKey === "string" ? o.iconKey.trim().toLowerCase() : "";
      const toneRaw = typeof o.tone === "string" ? o.tone.trim().toLowerCase() : "";
      const iconKey = ICON_KEYS.has(ik) ? (ik as ApplyContactRow["iconKey"]) : "map";
      const tone = TONES.has(toneRaw) ? (toneRaw as ApplyContactRow["tone"]) : "blue";
      if (!label || !value) return null;
      return { label, value, iconKey, tone };
    })
    .filter(Boolean) as ApplyContactRow[];
  if (rows.length) d.contactRows = rows.slice(0, 8);

  const socialRaw = Array.isArray(raw.socialLinks) ? raw.socialLinks : [];
  const socials = socialRaw
    .map((row): ApplySocialLink | null => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const platform = typeof o.platform === "string" ? o.platform.trim().toLowerCase() : "";
      const url = typeof o.url === "string" ? o.url.trim() : "";
      if (!PLATFORMS.has(platform)) return null;
      return { platform: platform as ApplySocialPlatform, url };
    })
    .filter(Boolean) as ApplySocialLink[];
  if (socials.length) d.socialLinks = socials.slice(0, 6);

  const yearRaw = Array.isArray(raw.yearOptions) ? raw.yearOptions : [];
  const years = yearRaw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
  if (years.length) d.yearOptions = years;

  const deptRaw = Array.isArray(raw.departmentOptions) ? raw.departmentOptions : [];
  const depts = deptRaw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, 30);
  if (depts.length) d.departmentOptions = depts;

  if (raw.community !== undefined) {
    d.community = parseCommunityConfig(raw.community);
  }

  return d;
}

