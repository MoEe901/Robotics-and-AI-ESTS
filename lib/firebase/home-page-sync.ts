import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  type Unsubscribe,
} from "firebase/firestore";

import { mergeApplyCollectionDocs } from "@/lib/content/apply-docs-merge";
import {
  mergeFaqConfig,
  parseFaqConfigHeader,
  parseFaqQuestionDoc,
} from "@/lib/content/faq-public-merge";
import { parseNavbarDoc, parseSiteContentSnapshot } from "@/lib/content/site-content-parser";
import { db } from "@/lib/firebase";
import { logFirestoreListenerError } from "@/lib/firebase/firestore-listener-log";
import { mapEventDocToItem, subscribeToHomepageTeam, subscribeToPageSections } from "@/lib/firebase/realtime";
import type { EventDoc, EventItem, FaqItem } from "@/lib/firebase/types";
import type { HomeContentStore } from "@/store/homeContentStore";

type Setter = Pick<
  HomeContentStore,
  | "setEvents"
  | "setTeamMembers"
  | "setSections"
  | "setSectionLayout"
  | "setKnowUsConfig"
  | "setPartnersConfig"
  | "setWhyJoinConfig"
  | "setCellulesConfig"
  | "setProcessStepsConfig"
  | "setSectionLayout"
  | "setFaqConfig"
  | "setApplyConfig"
  | "setPublicHero"
  | "setNavbarConfig"
  | "setFooterConfig"
  | "setEventsEmptyCopy"
>;

/**
 * Exactly eight Firestore listeners for the public homepage:
 * 1) siteContent collection
 * 2) siteConfig/navbar document
 * 3) events (active, ordered)
 * 4) homepage team
 * 5) pageSections
 * 6) faq/config document
 * 7) faq/config/questions collection
 * 8) apply collection
 * 9) eventsConfig/public empty-state copy
 */
export function subscribeHomePageFirestore(set: Setter): () => void {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      collection(db(), "siteContent"),
      (snap) => {
        const bundle = parseSiteContentSnapshot(snap);
        set.setPublicHero(bundle.hero);
        set.setKnowUsConfig(bundle.knowUs);
        set.setPartnersConfig(bundle.partners);
        set.setWhyJoinConfig(bundle.whyJoin);
        set.setCellulesConfig(bundle.cellules);
        set.setProcessStepsConfig(bundle.processSteps);
        set.setFooterConfig(bundle.footer);
      },
      (err) => {
        logFirestoreListenerError("home-page-sync siteContent collection", err);
        console.error("[home-page-sync] siteContent", err);
      },
    ),
  );

  unsubs.push(
    onSnapshot(
      doc(db(), "siteConfig", "navbar"),
      (snap) => {
        if (!snap.exists()) {
          set.setNavbarConfig(null);
          return;
        }
        const parsed = parseNavbarDoc(snap.data() as Record<string, unknown>);
        set.setNavbarConfig(parsed);
      },
      (err) => {
        logFirestoreListenerError("home-page-sync siteConfig/navbar doc", err);
        console.error("[home-page-sync] siteConfig/navbar", err);
      },
    ),
  );

  const eventsQ = query(
    collection(db(), "events"),
    where("isActive", "==", true),
    orderBy("order", "asc"),
    limit(60),
  );
  unsubs.push(
    onSnapshot(
      eventsQ,
      (snapshot) => {
        const events = snapshot.docs
          .map((d) => mapEventDocToItem(d.id, d.data() as EventDoc))
          .filter((e): e is EventItem => e !== null)
          .sort((a, b) => {
            const fa = a.isFeatured ? 1 : 0;
            const fb = b.isFeatured ? 1 : 0;
            if (fb !== fa) return fb - fa;
            const oa = typeof a.order === "number" ? a.order : 9999;
            const ob = typeof b.order === "number" ? b.order : 9999;
            return oa - ob;
          })
          .slice(0, 24);
        set.setEvents(events);
      },
      (err) => {
        logFirestoreListenerError("home-page-sync events query(isActive order)", err);
        console.error("[home-page-sync] events", err);
      },
    ),
  );

  unsubs.push(
    subscribeToHomepageTeam(
      (rows) => set.setTeamMembers(rows),
      (e) => {
        logFirestoreListenerError("home-page-sync subscribeToHomepageTeam", e);
        console.error("[home-page-sync] team", e);
      },
    ),
  );

  unsubs.push(
    subscribeToPageSections(
      (rows) => set.setSections(rows),
      (e) => {
        logFirestoreListenerError("home-page-sync pageSections", e);
        console.error("[home-page-sync] pageSections", e);
      },
    ),
  );

  unsubs.push(
    onSnapshot(
      doc(db(), "siteConfig", "sections"),
      (snap) => {
        if (!snap.exists()) return;
        const raw = snap.data() as Record<string, unknown>;
        const orderRaw = Array.isArray(raw.order) ? raw.order : [];
        const order = orderRaw.filter((x): x is string => typeof x === "string");
        const visRaw = raw.visibility && typeof raw.visibility === "object"
          ? (raw.visibility as Record<string, unknown>)
          : {};
        const visibility: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(visRaw)) visibility[k] = v !== false;
        set.setSectionLayout({ order, visibility });
      },
      (err) => {
        logFirestoreListenerError("home-page-sync siteConfig/sections doc", err);
        console.error("[home-page-sync] siteConfig/sections", err);
      },
    ),
  );

  let latestFaqHeader: ReturnType<typeof parseFaqConfigHeader> = null;
  let latestFaqItems: FaqItem[] = [];

  const flushFaq = () => {
    const merged = mergeFaqConfig(latestFaqHeader, latestFaqItems);
    if (merged) set.setFaqConfig(merged);
  };

  unsubs.push(
    onSnapshot(
      doc(db(), "faq", "config"),
      (snap) => {
        if (!snap.exists()) {
          latestFaqHeader = null;
        } else {
          latestFaqHeader = parseFaqConfigHeader(snap.data() as Record<string, unknown>);
        }
        flushFaq();
      },
      (err) => {
        logFirestoreListenerError("home-page-sync faq/config doc", err);
        console.error("[home-page-sync] faq/config", err);
      },
    ),
  );

  unsubs.push(
    onSnapshot(
      query(
        collection(db(), "faq", "config", "questions"),
        where("isVisible", "==", true),
        orderBy("order", "asc"),
        limit(80),
      ),
      (snap) => {
        latestFaqItems = snap.docs
          .map((d) => parseFaqQuestionDoc(d.data() as Record<string, unknown>, d.id))
          .filter((x): x is FaqItem => Boolean(x));
        flushFaq();
      },
      (err) => {
        logFirestoreListenerError("home-page-sync faq/config/questions query(isVisible order)", err);
        console.error("[home-page-sync] faq questions", err);
      },
    ),
  );

  unsubs.push(
    onSnapshot(
      collection(db(), "apply"),
      (snap) => {
        const byId: Record<string, Record<string, unknown>> = {};
        for (const d of snap.docs) {
          byId[d.id] = d.data() as Record<string, unknown>;
        }
        set.setApplyConfig(mergeApplyCollectionDocs(byId));
      },
      (err) => {
        logFirestoreListenerError("home-page-sync apply collection", err);
        console.error("[home-page-sync] apply", err);
      },
    ),
  );

  unsubs.push(
    onSnapshot(
      doc(db(), "eventsConfig", "public"),
      (snap) => {
        if (!snap.exists()) {
          set.setEventsEmptyCopy({ title: "No events scheduled yet.", message: "" });
          return;
        }
        const r = snap.data() as Record<string, unknown>;
        const title =
          typeof r.emptyTitle === "string" && r.emptyTitle.trim()
            ? r.emptyTitle.trim()
            : "No events scheduled yet.";
        const message = typeof r.emptyMessage === "string" ? r.emptyMessage.trim() : "";
        set.setEventsEmptyCopy({ title, message });
      },
      (err) => {
        logFirestoreListenerError("home-page-sync eventsConfig/public doc", err);
        console.error("[home-page-sync] eventsConfig", err);
      },
    ),
  );

  unsubs.push(
    onSnapshot(
      doc(db(), "siteConfig", "sections"),
      (snap) => {
        if (!snap.exists()) {
          set.setSectionLayout(null);
          return;
        }
        const r = snap.data() as Record<string, unknown>;
        const order = Array.isArray(r.order)
          ? r.order.filter((x): x is string => typeof x === "string")
          : [];
        const visibility =
          r.visibility && typeof r.visibility === "object"
            ? (r.visibility as Record<string, boolean>)
            : {};
        set.setSectionLayout({ order, visibility });
      },
      (err) => {
        logFirestoreListenerError("home-page-sync siteConfig/sections doc", err);
        console.error("[home-page-sync] siteConfig/sections", err);
      },
    ),
  );

  return () => {
    for (const u of unsubs) u();
  };
}
