/**
 * One-time / occasional seed: writes default public-site documents.
 * Run from repo `web/`: `npx tsx scripts/seed-firestore.ts` or `npm run seed:firestore`
 *
 * Requires Firebase Admin credentials (same as server metadata):
 * - `FIREBASE_SERVICE_ACCOUNT_JSON` (full service account JSON string), or
 * - Application Default Credentials + `FIREBASE_PROJECT_ID` / `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
 *
 * Pass `--force` to overwrite existing documents.
 */

import { FieldValue } from "firebase-admin/firestore";

import { DEFAULT_APPLY_CONFIG } from "../lib/content/apply-defaults";
import { DEFAULT_FAQ_CONFIG } from "../lib/content/faq-defaults";
import { DEFAULT_PROCESS_STEPS_CONFIG } from "../lib/content/process-steps-defaults";
import { DEFAULT_HERO_PUBLIC } from "../lib/content/site-content-parser";
import { DEFAULT_FOOTER_CONFIG, DEFAULT_NAVBAR_CONFIG } from "../lib/firebase/types";
import { getAdminFirestore } from "../lib/server/firebase-admin";

const force = process.argv.includes("--force");

const KNOW_US_CARDS = [
  {
    id: "ku-0",
    title: "Mission",
    body: "Build a hands-on learning community where students design, test, and launch real robotics and AI projects together.",
    order: 0,
  },
  {
    id: "ku-1",
    title: "How We Work",
    body: "Weekly workshops, team challenges, and project showcases focused on practical skills, collaboration, and mentorship.",
    order: 1,
  },
  {
    id: "ku-2",
    title: "Who Can Join",
    body: "Open to all motivated students, from beginners to advanced builders, with clear learning tracks and peer support.",
    order: 2,
  },
];

const WHY_JOIN_CARDS = [
  {
    title: "Hands-on Projects",
    description:
      "Build and experiment with real systems, from robotics prototypes to AI-driven applications, and gain practical experience.",
  },
  {
    title: "Skill Development",
    description:
      "Strengthen your technical abilities through structured learning, continuous practice, and real problem-solving.",
  },
  {
    title: "Networking Opportunities",
    description:
      "Connect with peers, mentors, and professionals to grow your network and discover new opportunities.",
  },
  {
    title: "Competitions & Events",
    description:
      "Participate in challenges, workshops, and events to showcase your skills and gain valuable experience.",
  },
];

const CELLULES_CARDS = [
  {
    title: "Organization Cellule",
    description:
      "The backbone of everything we do. Plans events, aligns our teams, and keeps the entire club moving in sync.",
    iconKey: "users",
    iconImageUrl: "",
  },
  {
    title: "Design Cellule",
    description:
      "Where ideas become visuals. From eye-catching posters to our full brand identity — this team shapes how the world sees us.",
    iconKey: "palette",
    iconImageUrl: "",
  },
  {
    title: "Media Cellule",
    description:
      "Every moment, documented. We capture the energy of our events and craft content that keeps our community inspired.",
    iconKey: "video",
    iconImageUrl: "",
  },
  {
    title: "Secretary Cellule",
    description:
      "Nothing gets lost here. Meeting minutes, official records, and every document — organized, accessible, always up to date.",
    iconKey: "file",
    iconImageUrl: "",
  },
  {
    title: "Treasury Cellule",
    description:
      "Smart with every dirham. We manage the budget, track every transaction, and ensure our projects always have the resources they need.",
    iconKey: "wallet",
    iconImageUrl: "",
  },
  {
    title: "Communication Cellule",
    description:
      "Our voice to the world. We manage social media, build partnerships, and make sure our message reaches the right people at the right time.",
    iconKey: "megaphone",
    iconImageUrl: "",
  },
];

async function writeIfMissing(
  path: string,
  data: Record<string, unknown>,
): Promise<"written" | "skipped" | "overwritten"> {
  const db = getAdminFirestore();
  const ref = db.doc(path);
  const snap = await ref.get();
  if (snap.exists && !force) return "skipped";
  await ref.set(
    {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: false },
  );
  return snap.exists && force ? "overwritten" : "written";
}

async function main() {
  const db = getAdminFirestore();
  const results: string[] = [];

  const heroPayload = {
    eyebrow: DEFAULT_HERO_PUBLIC.eyebrow,
    location: DEFAULT_HERO_PUBLIC.location,
    titleLines: DEFAULT_HERO_PUBLIC.titleLines,
    accentIndices: DEFAULT_HERO_PUBLIC.accentIndices,
    description: DEFAULT_HERO_PUBLIC.description,
    primaryCta: DEFAULT_HERO_PUBLIC.primaryCta,
    secondaryCta: DEFAULT_HERO_PUBLIC.secondaryCta,
    videoUrl: DEFAULT_HERO_PUBLIC.videoUrl,
    backgroundMedia: DEFAULT_HERO_PUBLIC.backgroundMedia,
    mask: DEFAULT_HERO_PUBLIC.mask,
    datashow: DEFAULT_HERO_PUBLIC.datashow,
    liveActivity: DEFAULT_HERO_PUBLIC.liveActivity,
    techStack: { items: DEFAULT_HERO_PUBLIC.techStack },
    growthStats: DEFAULT_HERO_PUBLIC.growthStats,
    stats: DEFAULT_HERO_PUBLIC.stats,
    statsStrip: DEFAULT_HERO_PUBLIC.statsStrip,
    foundedYear: DEFAULT_HERO_PUBLIC.foundedYear,
    growth: DEFAULT_HERO_PUBLIC.growth,
  };
  results.push(`siteContent/hero: ${await writeIfMissing("siteContent/hero", heroPayload)}`);

  const navbarPayload = {
    logoUrl: DEFAULT_NAVBAR_CONFIG.logoUrl,
    logoText: DEFAULT_NAVBAR_CONFIG.logoText,
    links: DEFAULT_NAVBAR_CONFIG.links,
    ctaButton: DEFAULT_NAVBAR_CONFIG.ctaButton,
    showThemeToggle: DEFAULT_NAVBAR_CONFIG.showThemeToggle,
  };
  results.push(`siteConfig/navbar: ${await writeIfMissing("siteConfig/navbar", navbarPayload)}`);

  const knowUsPayload = {
    emailHeading: "A quick overview so new members understand our direction, culture, and learning model.",
    mainTitle: "Know Us",
    cards: KNOW_US_CARDS,
  };
  results.push(`siteContent/knowUs: ${await writeIfMissing("siteContent/knowUs", knowUsPayload)}`);

  const partnersPayload = {
    title: "Our Partners & Collaborators All The Time",
    logos: [
      {
        imageUrl:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=480&q=80",
        alt: "Partner",
        visible: true,
        sourceTone: "dark",
      },
      {
        imageUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=480&q=80",
        alt: "Partner",
        visible: true,
        sourceTone: "dark",
      },
    ],
  };
  results.push(`siteContent/partners: ${await writeIfMissing("siteContent/partners", partnersPayload)}`);

  const whyJoinPayload = {
    smallHeading: "Shaping the Future with Robotics & AI",
    eyebrow: "Shaping the Future with Robotics & AI",
    title: "Why Join the Robotics & AI Club",
    description:
      "Join a community of passionate students exploring robotics and artificial intelligence. Through hands-on projects, mentorship, and collaboration, you'll gain practical skills and turn ideas into real-world solutions.",
    cards: WHY_JOIN_CARDS,
    highlights: [
      { id: "hj-0", title: "Hands-on Learning", subtitle: "Real projects, real impact", order: 0 },
      { id: "hj-1", title: "6 Specialized Cellules", subtitle: "Design · Media · Tech · More", order: 1 },
      { id: "hj-2", title: "Open to Everyone", subtitle: "Beginner or expert — you belong", order: 2 },
    ],
  };
  results.push(`siteContent/whyJoin: ${await writeIfMissing("siteContent/whyJoin", whyJoinPayload)}`);

  const cellulesPayload = {
    eyebrow: "Robotics & AI Club",
    title: "Our Cellules",
    intro:
      "Six specialized teams. One shared mission. Together, we handle everything that keeps our club running — from creative vision to operations and beyond.",
    subtitle:
      "Six specialized teams. One shared mission. Together, we handle everything that keeps our club running — from creative vision to operations and beyond.",
    items: CELLULES_CARDS.map((c, order) => ({
      id: `cell-${order}`,
      number: String(order + 1).padStart(2, "0"),
      title: c.title,
      body: c.description,
      iconKey: c.iconKey,
      iconImageUrl: c.iconImageUrl || undefined,
      order,
    })),
  };
  results.push(`siteContent/cellules: ${await writeIfMissing("siteContent/cellules", cellulesPayload)}`);

  const processPayload = {
    eyebrow: DEFAULT_PROCESS_STEPS_CONFIG.eyebrow,
    titleLine: DEFAULT_PROCESS_STEPS_CONFIG.titleLine,
    titleAccent: DEFAULT_PROCESS_STEPS_CONFIG.titleAccent,
    title: `${DEFAULT_PROCESS_STEPS_CONFIG.titleLine}|${DEFAULT_PROCESS_STEPS_CONFIG.titleAccent}`,
    steps: DEFAULT_PROCESS_STEPS_CONFIG.steps.map((s, order) => ({
      id: `ps-${order}`,
      number: s.badge,
      label: s.badge,
      title: s.title,
      body: s.description,
      iconKey: s.iconKey,
      order,
    })),
  };
  results.push(`siteContent/processSteps: ${await writeIfMissing("siteContent/processSteps", processPayload)}`);

  const footerColumns = [
    {
      heading: "Club",
      links: DEFAULT_FOOTER_CONFIG.footerNav.filter((_, i) => i < 2),
    },
    {
      heading: "Explore",
      links: DEFAULT_FOOTER_CONFIG.footerNav.filter((_, i) => i >= 2),
    },
  ];
  const footerPayload = {
    tagline: DEFAULT_FOOTER_CONFIG.tagline,
    address: DEFAULT_FOOTER_CONFIG.contactLocation,
    phone: "+212 68444912",
    email: DEFAULT_FOOTER_CONFIG.contactEmail,
    hours: "Monday – Friday · 9AM – 5PM",
    columns: footerColumns,
    socials: DEFAULT_FOOTER_CONFIG.socialLinks.map((s) => ({ platform: s.platform, url: s.url })),
    copyrightText: DEFAULT_FOOTER_CONFIG.copyrightText,
    versionLine: DEFAULT_FOOTER_CONFIG.versionLine,
  };
  results.push(`siteContent/footer: ${await writeIfMissing("siteContent/footer", footerPayload)}`);

  results.push(
    `eventsConfig/public: ${await writeIfMissing("eventsConfig/public", {
      emptyTitle: "No events scheduled yet.",
      emptyMessage: "",
    })}`,
  );

  results.push(
    `siteConfig/sections: ${await writeIfMissing("siteConfig/sections", {
      order: ["hero", "events", "knowUs", "whyJoin", "cellules", "processSteps", "faq", "apply", "footer"],
      visibility: {
        hero: true, events: true, knowUs: true, whyJoin: true,
        cellules: true, processSteps: true, faq: true, apply: true, footer: true,
      },
    })}`,
  );

  results.push(
    `siteConfig/adminShell: ${await writeIfMissing("siteConfig/adminShell", {
      order: [
        "/admin/dashboard",
        "/admin/hero",
        "/admin/team",
        "/admin/team/taxonomy",
        "/admin/events",
        "/admin/basic",
        "/admin/navbar",
        "/admin/faq",
        "/admin/apply",
        "/admin/submissions",
        "/admin/activity",
        "/admin/layout",
      ],
      visibility: {
        "/admin/dashboard": true,
        "/admin/hero": true,
        "/admin/team": true,
        "/admin/team/taxonomy": true,
        "/admin/events": true,
        "/admin/basic": true,
        "/admin/navbar": true,
        "/admin/faq": true,
        "/admin/apply": true,
        "/admin/submissions": true,
        "/admin/activity": true,
        "/admin/layout": true,
      },
      showViewSite: true,
      showThemeToggle: true,
    })}`,
  );

  const faqConfigPath = "faq/config";
  const faqConfigRef = db.doc(faqConfigPath);
  const faqSnap = await faqConfigRef.get();
  if (!faqSnap.exists || force) {
    await faqConfigRef.set(
      {
        eyebrow: DEFAULT_FAQ_CONFIG.eyebrow,
        title: DEFAULT_FAQ_CONFIG.titleLine,
        accent: DEFAULT_FAQ_CONFIG.titleAccent,
        subtitle: DEFAULT_FAQ_CONFIG.subtitle,
        categories: DEFAULT_FAQ_CONFIG.categories,
        ctaTitle: DEFAULT_FAQ_CONFIG.ctaTitle,
        ctaSubtitle: DEFAULT_FAQ_CONFIG.ctaSubtitle,
        ctaButtonLabel: DEFAULT_FAQ_CONFIG.ctaButtonLabel,
        ctaButtonHref: DEFAULT_FAQ_CONFIG.ctaButtonHref,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: false },
    );
    results.push(`faq/config: ${faqSnap.exists ? "overwritten" : "written"}`);
  } else {
    results.push("faq/config: skipped");
  }

  const qCol = db.collection("faq/config/questions");
  const existingQs = await qCol.limit(1).get();
  if (existingQs.empty || force) {
    if (force) {
      const all = await qCol.get();
      const batch = db.batch();
      for (const d of all.docs) batch.delete(d.ref);
      await batch.commit();
    }
    let order = 0;
    for (const item of DEFAULT_FAQ_CONFIG.items) {
      const id = `seed_${order}_${item.categoryId}`;
      await qCol.doc(id).set({
        categoryId: item.categoryId,
        question: item.question,
        answer: item.answer,
        accentColor: item.color,
        icon: item.iconKey,
        order,
        isVisible: true,
      });
      order += 1;
    }
    results.push(`faq/config/questions: ${force ? "reseeded" : "written"}`);
  } else {
    results.push("faq/config/questions: skipped");
  }

  const applyWrites: Array<Promise<unknown>> = [];
  const applyHero = {
    stepLabel: DEFAULT_APPLY_CONFIG.topLabel,
    titleLine1: DEFAULT_APPLY_CONFIG.heroLine1,
    titleLine2: DEFAULT_APPLY_CONFIG.heroLine2,
    subtitle: DEFAULT_APPLY_CONFIG.heroSub,
  };
  applyWrites.push(
    (async () => {
      const r = await writeIfMissing("apply/hero", applyHero);
      results.push(`apply/hero: ${r}`);
    })(),
  );
  applyWrites.push(
    (async () => {
      const r = await writeIfMissing("apply/leftPanel", {
        badge: DEFAULT_APPLY_CONFIG.infoBadge,
        title: DEFAULT_APPLY_CONFIG.infoTitle,
        description: DEFAULT_APPLY_CONFIG.infoDesc,
      });
      results.push(`apply/leftPanel: ${r}`);
    })(),
  );
  applyWrites.push(
    (async () => {
      const r = await writeIfMissing("apply/contactRows", {
        rows: DEFAULT_APPLY_CONFIG.contactRows.map((row, idx) => ({
          id: `cr-${idx}`,
          label: row.label,
          value: row.value,
          type: row.iconKey === "phone" ? "phone" : row.iconKey === "mail" ? "mail" : row.iconKey === "clock" ? "clock" : "map",
          accent: row.tone,
          order: idx,
        })),
      });
      results.push(`apply/contactRows: ${r}`);
    })(),
  );
  applyWrites.push(
    (async () => {
      const links: Record<string, string> = {};
      for (const s of DEFAULT_APPLY_CONFIG.socialLinks) links[s.platform] = s.url;
      const r = await writeIfMissing("apply/socialLinks", links);
      results.push(`apply/socialLinks: ${r}`);
    })(),
  );
  applyWrites.push(
    (async () => {
      const r = await writeIfMissing("apply/form", {
        formTitle: DEFAULT_APPLY_CONFIG.formTitle,
        formSubtitle: DEFAULT_APPLY_CONFIG.formSubtitle,
        fieldLabels: {
          firstName: DEFAULT_APPLY_CONFIG.firstNameLabel,
          lastName: DEFAULT_APPLY_CONFIG.lastNameLabel,
          year: DEFAULT_APPLY_CONFIG.yearLabel,
          department: DEFAULT_APPLY_CONFIG.departmentLabel,
          email: DEFAULT_APPLY_CONFIG.emailLabel,
          phone: DEFAULT_APPLY_CONFIG.phoneLabel,
          message: DEFAULT_APPLY_CONFIG.messageLabel,
        },
        placeholders: DEFAULT_APPLY_CONFIG.placeholders,
        yearOptions: DEFAULT_APPLY_CONFIG.yearOptions,
        departmentOptions: DEFAULT_APPLY_CONFIG.departmentOptions.map((label) => ({ label, value: label })),
      });
      results.push(`apply/form: ${r}`);
    })(),
  );
  applyWrites.push(
    (async () => {
      const r = await writeIfMissing("apply/submitBlock", {
        charterText: DEFAULT_APPLY_CONFIG.charterLinkText,
        charterUrl: DEFAULT_APPLY_CONFIG.charterLinkHref,
        submitNotePrefix: DEFAULT_APPLY_CONFIG.submitNotePrefix,
        submitLabel: DEFAULT_APPLY_CONFIG.submitButtonLabel,
        successTitle: DEFAULT_APPLY_CONFIG.successTitle,
        successMessage: DEFAULT_APPLY_CONFIG.successMessage,
      });
      results.push(`apply/submitBlock: ${r}`);
    })(),
  );
  await Promise.all(applyWrites);

  console.log(force ? "Seed complete (--force overwrite).\n" : "Seed complete.\n");
  for (const line of results) console.log(line);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
