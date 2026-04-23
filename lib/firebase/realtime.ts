import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  DEFAULT_TEAM_VISIBILITY,
  type EventAttachment,
  type EventDoc,
  type EventGalleryItem,
  type EventItem,
  type FirestoreTeamMember,
  type PageSection,
  type PageSectionDoc,
  type KnowUsConfig,
  type PartnersConfig,
  type TeamMemberVisibility,
  type WhyJoinConfig,
  type CellulesConfig,
  type CelluleCard,
  type ProcessStepsConfig,
  type ProcessStepItem,
  type FaqConfig,
  type FaqItem,
  type FaqCategory,
  type FaqItemColor,
  type ApplySectionConfig,
} from "@/lib/firebase/types";
import { DEFAULT_PROCESS_STEPS_CONFIG } from "@/lib/content/process-steps-defaults";
import { DEFAULT_FAQ_CONFIG } from "@/lib/content/faq-defaults";
import { mergeApplyFromFirestore } from "@/lib/content/apply-defaults";
import { parseWebsiteCtaHex } from "@/lib/events/website-cta-color";
import { getCurrentAcademicYearLabel } from "@/lib/team/academic-year";
import { departmentMustBeEmpty } from "@/lib/team/school-taxonomy";
import type { TeamMemberProfile } from "@/lib/team/types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function parseEventAttachments(raw: unknown): EventAttachment[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: EventAttachment[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    const visible = o.visible === undefined ? true : o.visible === true;
    if (label && url) out.push({ label, url, visible });
  }
  return out.length ? out : undefined;
}

function parseEventGallery(raw: unknown): EventGalleryItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: EventGalleryItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url) continue;
    const kind = o.kind === "video" ? "video" : "image";
    const visible = o.visible === undefined ? true : o.visible === true;
    const caption = typeof o.caption === "string" && o.caption.trim() ? o.caption.trim() : undefined;
    out.push(caption ? { url, kind, caption, visible } : { url, kind, visible });
  }
  return out.length ? out : undefined;
}

function mergeVisibility(raw?: Partial<TeamMemberVisibility> | null): TeamMemberVisibility {
  return {
    ...DEFAULT_TEAM_VISIBILITY,
    ...raw,
    showBirthday: raw?.showBirthday === true,
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => isNonEmptyString(v)).map((v) => v.trim());
}

function mapTeamDoc(docId: string, data: DocumentData): TeamMemberProfile | null {
  const row = data as Partial<FirestoreTeamMember> & { createdAt?: unknown };

  const schoolStatusRaw = typeof row.schoolStatus === "string" ? row.schoolStatus.trim() : "";
  const departmentRaw = typeof row.department === "string" ? row.department.trim() : "";
  const departmentOk =
    departmentMustBeEmpty(schoolStatusRaw) ? true : isNonEmptyString(departmentRaw);

  const imageUrlOk = row.imageUrl == null || typeof row.imageUrl === "string";

  if (
    !isNonEmptyString(row.name) ||
    !isNonEmptyString(row.slug) ||
    !isNonEmptyString(row.roleType) ||
    !Array.isArray(row.roles) ||
    !isNonEmptyString(row.academicYear) ||
    !departmentOk ||
    !isNonEmptyString(schoolStatusRaw) ||
    !imageUrlOk ||
    typeof row.order !== "number" ||
    !Number.isFinite(row.order) ||
    typeof row.isActive !== "boolean" ||
    row.createdAt == null
  ) {
    console.warn("[Firestore] Ignoring invalid teamMembers doc", { id: docId, row });
    return null;
  }

  if (row.isActive !== true) return null;

  const contacts = Array.isArray(row.contacts)
    ? row.contacts.filter(
        (c): c is { type: string; value: string; visible: boolean } =>
          typeof c === "object" &&
          c !== null &&
          isNonEmptyString((c as { type?: unknown }).type) &&
          isNonEmptyString((c as { value?: unknown }).value),
      )
    : [];

  const shortBio = isNonEmptyString(row.shortBio) ? row.shortBio.trim() : undefined;

  return {
    _id: docId,
    name: row.name.trim(),
    slug: { current: row.slug.trim() },
    roleType: row.roleType,
    roles: asStringArray(row.roles).map((title) => ({ _id: `${docId}-${title}`, title })),
    academicYear: row.academicYear.trim(),
    department: departmentMustBeEmpty(schoolStatusRaw) ? "" : departmentRaw,
    schoolStatus: schoolStatusRaw,
    imageUrl: typeof row.imageUrl === "string" ? row.imageUrl.trim() : "",
    order: row.order,
    bio: isNonEmptyString(row.bio) ? row.bio.trim() : shortBio,
    shortBio,
    fullDescription: isNonEmptyString(row.fullDescription) ? row.fullDescription.trim() : undefined,
    birthday: isNonEmptyString(row.birthday) ? row.birthday.trim() : undefined,
    contacts,
    visibility: mergeVisibility(row.visibility),
    image: null,
  };
}

function sortMembers<T extends TeamMemberProfile>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const oa = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
    const ob = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name);
  });
}

// Debug-first subscription: no filters, checks connectivity and raw documents.
export function subscribeToTeamMembers(
  callback: (members: TeamMemberProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db(), "teamMembers"),
    (snapshot) => {
      console.log("[Firestore] RAW SNAPSHOT SIZE:", snapshot.size);
      const mapped = snapshot.docs
        .map((doc) => mapTeamDoc(doc.id, doc.data()))
        .filter((m): m is TeamMemberProfile => Boolean(m));
      console.log("[Firestore] RAW DATA rows:", mapped.length);
      callback(sortMembers(mapped));
    },
    (error) => {
      console.error("[Firestore] subscribeToTeamMembers failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToTeamByYear(
  year: string,
  callback: (members: TeamMemberProfile[]) => void,
  options?: { roleType?: string | "All"; onError?: (error: Error) => void },
): Unsubscribe {
  const constraints: QueryConstraint[] = [
    where("academicYear", "==", year),
    where("isActive", "==", true),
    orderBy("order", "asc"),
  ];

  const q = query(collection(db(), "teamMembers"), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const mapped = snapshot.docs
        .map((doc) => mapTeamDoc(doc.id, doc.data()))
        .filter((m): m is TeamMemberProfile => Boolean(m));

      if (!mapped.length && snapshot.size > 0) {
        console.warn("[Firestore] Team query returned docs but none mapped", {
          year,
          roleType: options?.roleType ?? "All",
          snapshotSize: snapshot.size,
        });
      }

      callback(sortMembers(mapped));
    },
    (error) => {
      const err = error as { code?: string; message?: string };
      if (err.code === "failed-precondition") {
        console.error(
          "[Firestore] Missing composite index for teamMembers: academicYear ASC + isActive ASC + order ASC",
        );
        if (err.message?.includes("firebase.google.com")) {
          console.info("[Firestore] Use the URL inside the error message below to create the index in one click.");
        }
      }
      console.error("[Firestore] subscribeToTeamByYear failed", error);
      options?.onError?.(error);
    },
  );
}

export function subscribeToMemberBySlug(
  slug: string,
  callback: (member: TeamMemberProfile | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db(), "teamMembers"),
    where("slug", "==", slug),
    where("isActive", "==", true),
    limit(1),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const data = mapTeamDoc(snapshot.docs[0]!.id, snapshot.docs[0]!.data());
      callback(data);
    },
    (error) => {
      console.error("[Firestore] subscribeToMemberBySlug failed", error);
      onError?.(error);
    },
  );
}

function hasHomepageExecutiveCouncilCell(member: TeamMemberProfile): boolean {
  return (member.roleType ?? "").trim().toLowerCase() === "executive council";
}

export function subscribeToHomepageTeam(
  callback: (members: TeamMemberProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const year = getCurrentAcademicYearLabel();
  return subscribeToTeamByYear(
    year,
    (rows) => callback(rows.filter(hasHomepageExecutiveCouncilCell).slice(0, 8)),
    { onError },
  );
}

export function mapEventDocToItem(docId: string, raw: EventDoc): EventItem | null {
  if (!isNonEmptyString(raw.title)) return null;
  const attachments = parseEventAttachments(raw.attachments);
  const gallery = parseEventGallery(raw.gallery);
  return {
    _id: docId,
    title: raw.title.trim(),
    slug: raw.slug ? { current: raw.slug } : null,
    description: isNonEmptyString(raw.description) ? raw.description : undefined,
    documentary: isNonEmptyString(raw.documentary) ? raw.documentary : undefined,
    location: isNonEmptyString(raw.location) ? raw.location : undefined,
    locationMapsUrl: isNonEmptyString(raw.locationMapsUrl) ? raw.locationMapsUrl.trim() : undefined,
    date: isNonEmptyString(raw.date) ? raw.date : undefined,
    attachments,
    gallery,
    eventWebsiteUrl: isNonEmptyString(raw.eventWebsiteUrl) ? raw.eventWebsiteUrl.trim() : undefined,
    showEventWebsite: raw.showEventWebsite !== false,
    eventWebsiteButtonColor: parseWebsiteCtaHex(raw.eventWebsiteButtonColor),
    imageFocusX: clampNumber(raw.imageFocusX, 0, 100, 50),
    imageFocusY: clampNumber(raw.imageFocusY, 0, 100, 50),
    imageZoom: clampNumber(raw.imageZoom, 0.25, 2.5, 1),
    isActive: raw.isActive !== false,
    isFeatured: Boolean(raw.isFeatured),
    imageUrl: isNonEmptyString(raw.imageUrl) ? raw.imageUrl : null,
    order: typeof raw.order === "number" ? raw.order : undefined,
  };
}

/** Load a single published event by Firestore document id or by `slug` field (one-shot). */
export async function fetchPublishedEventBySlugOrId(segment: string): Promise<EventItem | null> {
  const key = decodeURIComponent(segment);
  try {
    const byId = await getDoc(doc(db(), "events", key));
    if (byId.exists()) {
      const item = mapEventDocToItem(byId.id, byId.data() as EventDoc);
      if (item && item.isActive !== false) return item;
    }
    const snap = await getDocs(
      query(collection(db(), "events"), where("slug", "==", key), limit(10)),
    );
    for (const d of snap.docs) {
      const item = mapEventDocToItem(d.id, d.data() as EventDoc);
      if (item && item.isActive !== false) return item;
    }
  } catch (e) {
    console.error("[Firestore] fetchPublishedEventBySlugOrId failed", e);
  }
  return null;
}

/**
 * Live-updates when the event document changes (admin edits, etc.).
 * Listens both to `events/{segment}` (document id URLs) and to `slug == segment` (slug URLs).
 */
export function subscribeToPublishedEventBySlugOrId(
  segment: string,
  callback: (event: EventItem | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const key = decodeURIComponent(segment);
  const dref = doc(db(), "events", key);
  const q = query(collection(db(), "events"), where("slug", "==", key), limit(1));

  let docReady = false;
  let queryReady = false;
  let docItem: EventItem | null = null;
  let queryItem: EventItem | null = null;

  const flush = () => {
    if (!docReady || !queryReady) return;
    if (docItem) callback(docItem);
    else if (queryItem) callback(queryItem);
    else callback(null);
  };

  const unsubDoc = onSnapshot(
    dref,
    (snap) => {
      docReady = true;
      if (!snap.exists()) {
        docItem = null;
      } else {
        const item = mapEventDocToItem(snap.id, snap.data() as EventDoc);
        docItem = item && item.isActive !== false ? item : null;
      }
      flush();
    },
    (error) => {
      console.error("[Firestore] subscribeToPublishedEventBySlugOrId (doc) failed", error);
      docReady = true;
      docItem = null;
      flush();
      onError?.(error);
    },
  );

  const unsubQuery = onSnapshot(
    q,
    (snap) => {
      queryReady = true;
      if (snap.empty) {
        queryItem = null;
      } else {
        const d = snap.docs[0];
        const item = mapEventDocToItem(d.id, d.data() as EventDoc);
        queryItem = item && item.isActive !== false ? item : null;
      }
      flush();
    },
    (error) => {
      console.error("[Firestore] subscribeToPublishedEventBySlugOrId (query) failed", error);
      queryReady = true;
      queryItem = null;
      flush();
      onError?.(error);
    },
  );

  return () => {
    unsubDoc();
    unsubQuery();
  };
}

export function subscribeToEvents(
  callback: (events: EventItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db(), "events"), orderBy("order", "asc"), limit(24));
  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map((d) => mapEventDocToItem(d.id, d.data() as EventDoc))
        .filter((e): e is EventItem => e !== null)
        .filter((e) => e.isActive !== false)
        .sort((a, b) => {
          const fa = a.isFeatured ? 1 : 0;
          const fb = b.isFeatured ? 1 : 0;
          if (fb !== fa) return fb - fa;
          const oa = typeof a.order === "number" ? a.order : 9999;
          const ob = typeof b.order === "number" ? b.order : 9999;
          return oa - ob;
        });
      callback(events);
    },
    (error) => {
      console.error("[Firestore] subscribeToEvents failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToPageSections(
  callback: (sections: PageSection[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db(), "pageSections"), orderBy("order", "asc"), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const sections = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as PageSectionDoc) }))
        .filter((s) => isNonEmptyString(s.title) && isNonEmptyString(s.sectionType))
        .map((s) => ({
          _id: s.id,
          title: s.title.trim(),
          sectionType: s.sectionType.trim(),
          order: typeof s.order === "number" ? s.order : undefined,
        }));
      callback(sections);
    },
    (error) => {
      console.error("[Firestore] subscribeToPageSections failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToKnowUsConfig(
  callback: (config: KnowUsConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "knowUs"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const intro = typeof raw.intro === "string" ? raw.intro.trim() : "";
      const cardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
      const cards = cardsRaw
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const title = typeof o.title === "string" ? o.title.trim() : "";
          const description = typeof o.description === "string" ? o.description.trim() : "";
          if (!title || !description) return null;
          return { title, description };
        })
        .filter((row): row is { title: string; description: string } => Boolean(row))
        .slice(0, 6);
      callback(cards.length ? { intro, cards } : null);
    },
    (error) => {
      console.error("[Firestore] subscribeToKnowUsConfig failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToPartnersConfig(
  callback: (config: PartnersConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "partners"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const titleRaw = typeof raw.title === "string" ? raw.title.trim() : "";
      const logosRaw = Array.isArray(raw.logos) ? raw.logos : [];
      const logos = logosRaw
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
          if (!imageUrl) return null;
          const altRaw = typeof o.alt === "string" ? o.alt.trim() : "";
          const alt = altRaw || "Partner logo";
          const visible = o.visible === undefined ? true : o.visible === true;
          const sourceTone = o.sourceTone === "dark" ? "dark" : "light";
          if (!visible) return null;
          return { imageUrl, alt, sourceTone };
        })
        .filter((row): row is { imageUrl: string; alt: string; sourceTone: "light" | "dark" } => Boolean(row))
        .slice(0, 30);

      if (!logos.length) {
        callback(null);
        return;
      }

      callback({
        title: titleRaw || "Our Partners & Collaborations All the Time",
        logos,
      });
    },
    (error) => {
      console.error("[Firestore] subscribeToPartnersConfig failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToWhyJoinConfig(
  callback: (config: WhyJoinConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "whyJoin"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const smallHeading =
        typeof raw.smallHeading === "string" && raw.smallHeading.trim()
          ? raw.smallHeading.trim()
          : "Shaping the Future with Robotics & AI";
      const title =
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title.trim()
          : "Why Join the Robotics & AI Club";
      const description =
        typeof raw.description === "string" && raw.description.trim()
          ? raw.description.trim()
          : "";
      const cardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
      const cards = cardsRaw
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const cardTitle = typeof o.title === "string" ? o.title.trim() : "";
          const cardDescription = typeof o.description === "string" ? o.description.trim() : "";
          if (!cardTitle || !cardDescription) return null;
          return { title: cardTitle, description: cardDescription };
        })
        .filter((row): row is { title: string; description: string } => Boolean(row))
        .slice(0, 12);

      if (!description || !cards.length) {
        callback(null);
        return;
      }

      callback({
        smallHeading,
        title,
        description,
        cards,
      });
    },
    (error) => {
      console.error("[Firestore] subscribeToWhyJoinConfig failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToCellulesConfig(
  callback: (config: CellulesConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "cellules"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const eyebrow =
        typeof raw.eyebrow === "string" && raw.eyebrow.trim() ? raw.eyebrow.trim() : "Robotics & AI Club";
      const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Our Cellules";
      const subtitle = typeof raw.subtitle === "string" && raw.subtitle.trim() ? raw.subtitle.trim() : "";
      const cardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
      const cards = cardsRaw
        .map((row): CelluleCard | null => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const cardTitle = typeof o.title === "string" ? o.title.trim() : "";
          const cardDescription = typeof o.description === "string" ? o.description.trim() : "";
          if (!cardTitle || !cardDescription) return null;
          const iconKey = typeof o.iconKey === "string" && o.iconKey.trim() ? o.iconKey.trim() : undefined;
          const iconImageUrl =
            typeof o.iconImageUrl === "string" && o.iconImageUrl.trim()
              ? o.iconImageUrl.trim()
              : undefined;
          const card: CelluleCard = { title: cardTitle, description: cardDescription };
          if (iconKey) card.iconKey = iconKey;
          if (iconImageUrl) card.iconImageUrl = iconImageUrl;
          return card;
        })
        .filter((c): c is CelluleCard => Boolean(c));
      const limitedCards = cards
        .slice(0, 12);

      if (!subtitle || !limitedCards.length) {
        callback(null);
        return;
      }

      callback({ eyebrow, title, subtitle, cards: limitedCards });
    },
    (error) => {
      console.error("[Firestore] subscribeToCellulesConfig failed", error);
      onError?.(error);
    },
  );
}

const PROCESS_STEP_ICON_KEYS = new Set([
  "users",
  "lightbulb",
  "calendar",
  "award",
  "rocket",
  "target",
  "sparkles",
]);

export function subscribeToProcessStepsConfig(
  callback: (config: ProcessStepsConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "processSteps"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const eyebrow = typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "";
      const titleLine = typeof raw.titleLine === "string" ? raw.titleLine : "";
      const titleAccent = typeof raw.titleAccent === "string" ? raw.titleAccent.trim() : "";
      const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
      const steps = stepsRaw
        .map((row): ProcessStepItem | null => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const badge = typeof o.badge === "string" ? o.badge.trim() : "";
          const title = typeof o.title === "string" ? o.title.trim() : "";
          const description = typeof o.description === "string" ? o.description.trim() : "";
          const ik = typeof o.iconKey === "string" ? o.iconKey.trim().toLowerCase() : "";
          const iconKey = PROCESS_STEP_ICON_KEYS.has(ik) ? ik : "users";
          if (!badge || !title || !description) return null;
          return { badge, title, description, iconKey };
        })
        .filter((s): s is ProcessStepItem => Boolean(s))
        .slice(0, 8);

      if (steps.length < 2) {
        callback(null);
        return;
      }

      callback({
        eyebrow: eyebrow || DEFAULT_PROCESS_STEPS_CONFIG.eyebrow,
        titleLine: titleLine.length ? titleLine : DEFAULT_PROCESS_STEPS_CONFIG.titleLine,
        titleAccent: titleAccent || DEFAULT_PROCESS_STEPS_CONFIG.titleAccent,
        steps,
      });
    },
    (error) => {
      console.error("[Firestore] subscribeToProcessStepsConfig failed", error);
      onError?.(error);
    },
  );
}

const FAQ_ITEM_ICON_KEYS = new Set([
  "circle-dollar-sign",
  "calendar",
  "lightbulb",
  "trending-up",
  "users",
  "code",
  "award",
  "clock",
  "help-circle",
  "message-circle",
  "sparkles",
  "target",
]);

const FAQ_ITEM_COLORS = new Set(["blue", "violet", "pink", "amber", "green"]);

export function subscribeToFaqConfig(
  callback: (config: FaqConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "faq"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const eyebrow = typeof raw.eyebrow === "string" ? raw.eyebrow.trim() : "";
      const titleLine = typeof raw.titleLine === "string" ? raw.titleLine : "";
      const titleAccent = typeof raw.titleAccent === "string" ? raw.titleAccent.trim() : "";
      const subtitle = typeof raw.subtitle === "string" ? raw.subtitle.trim() : "";
      const ctaTitle = typeof raw.ctaTitle === "string" ? raw.ctaTitle.trim() : "";
      const ctaSubtitle = typeof raw.ctaSubtitle === "string" ? raw.ctaSubtitle.trim() : "";
      const ctaButtonLabel = typeof raw.ctaButtonLabel === "string" ? raw.ctaButtonLabel.trim() : "";
      const ctaButtonHref = typeof raw.ctaButtonHref === "string" ? raw.ctaButtonHref.trim() : "";

      const categoriesRaw = Array.isArray(raw.categories) ? raw.categories : [];
      const categories = categoriesRaw
        .map((row): FaqCategory | null => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const id = typeof o.id === "string" ? o.id.trim().toLowerCase() : "";
          const label = typeof o.label === "string" ? o.label.trim() : "";
          if (!id || !label) return null;
          return { id, label };
        })
        .filter((c): c is FaqCategory => Boolean(c))
        .slice(0, 12);

      const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
      const items = itemsRaw
        .map((row): FaqItem | null => {
          if (!row || typeof row !== "object") return null;
          const o = row as Record<string, unknown>;
          const categoryId = typeof o.categoryId === "string" ? o.categoryId.trim().toLowerCase() : "";
          const question = typeof o.question === "string" ? o.question.trim() : "";
          const answer = typeof o.answer === "string" ? o.answer.trim() : "";
          const colorRaw = typeof o.color === "string" ? o.color.trim().toLowerCase() : "";
          const color = (FAQ_ITEM_COLORS.has(colorRaw) ? colorRaw : "blue") as FaqItemColor;
          const ik = typeof o.iconKey === "string" ? o.iconKey.trim().toLowerCase() : "";
          const iconKey = FAQ_ITEM_ICON_KEYS.has(ik) ? ik : "help-circle";
          if (!categoryId || !question || !answer) return null;
          return { categoryId, question, answer, color, iconKey };
        })
        .filter((it): it is FaqItem => Boolean(it))
        .slice(0, 24);

      if (!items.length) {
        callback(null);
        return;
      }

      const catIds = new Set(categories.map((c) => c.id));
      const validItems = items.filter((it) => catIds.has(it.categoryId));
      if (!validItems.length) {
        callback(null);
        return;
      }

      callback({
        eyebrow: eyebrow || DEFAULT_FAQ_CONFIG.eyebrow,
        titleLine: titleLine.length ? titleLine : DEFAULT_FAQ_CONFIG.titleLine,
        titleAccent: titleAccent || DEFAULT_FAQ_CONFIG.titleAccent,
        subtitle: subtitle || DEFAULT_FAQ_CONFIG.subtitle,
        categories: categories.length ? categories : DEFAULT_FAQ_CONFIG.categories,
        items: validItems,
        ctaTitle: ctaTitle || DEFAULT_FAQ_CONFIG.ctaTitle,
        ctaSubtitle: ctaSubtitle || DEFAULT_FAQ_CONFIG.ctaSubtitle,
        ctaButtonLabel: ctaButtonLabel || DEFAULT_FAQ_CONFIG.ctaButtonLabel,
        ctaButtonHref: ctaButtonHref || DEFAULT_FAQ_CONFIG.ctaButtonHref,
      });
    },
    (error) => {
      console.error("[Firestore] subscribeToFaqConfig failed", error);
      onError?.(error);
    },
  );
}

export function subscribeToApplyConfig(
  callback: (config: ApplySectionConfig | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "siteConfig", "apply"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(mergeApplyFromFirestore(snapshot.data() as Record<string, unknown>));
    },
    (error) => {
      console.error("[Firestore] subscribeToApplyConfig failed", error);
      onError?.(error);
    },
  );
}
