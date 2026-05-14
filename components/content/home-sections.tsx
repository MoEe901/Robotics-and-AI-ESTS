"use client";

import {
  EventsCarousel,
  type EventCarouselItem,
} from "@/components/events/events-carousel";
import {
  FileText,
  Megaphone,
  Palette,
  Rocket,
  Settings2,
  Target,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { resolveSectionIcon } from "@/lib/icons/section-icon-pack";
import { formatEventDate } from "@/lib/events/public";
import { PartnersMarquee } from "@/components/content/partners-marquee";
import { RevealSection } from "@/components/motion/reveal-section";
import { ApplySection } from "@/components/content/apply-section";
import { FaqSection } from "@/components/content/faq-section";
import { ProcessStepsSection } from "@/components/content/process-steps-section";
import { TeamSection } from "@/components/team/team-section";
import { useLanguage } from "@/lib/i18n/context";
import type {
  CellulesConfig,
  EventItem,
  FaqConfig,
  KnowUsConfig,
  PageSection,
  PartnersConfig,
  ProcessStepsConfig,
  WhyJoinConfig,
  ApplySectionConfig,
} from "@/lib/firebase/types";
import type { TeamMemberListItem } from "@/lib/team/types";
import type { SectionLayout } from "@/store/homeContentStore";

const knowUsIcons = [Target, Settings2, Rocket] as const;

const knowUsDefaults = [
  {
    title: "Mission",
    description:
      "Build a hands-on learning community where students design, test, and launch real robotics and AI projects together.",
  },
  {
    title: "How We Work",
    description:
      "Weekly workshops, team challenges, and project showcases focused on practical skills, collaboration, and mentorship.",
  },
  {
    title: "Who Can Join",
    description:
      "Open to all motivated students, from beginners to advanced builders, with clear learning tracks and peer support.",
  },
];

const whyJoinCards = [
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

const cellulesCards = [
  {
    title: "Organization Cellule",
    description:
      "The backbone of everything we do. Plans events, aligns our teams, and keeps the entire club moving in sync.",
    accent: "from-blue-400/25 to-blue-500/5",
    iconClass: "text-blue-400",
    lineClass: "bg-blue-400",
    icon: Users,
    iconKey: "users",
    iconImageUrl: "",
  },
  {
    title: "Design Cellule",
    description:
      "Where ideas become visuals. From eye-catching posters to our full brand identity — this team shapes how the world sees us.",
    accent: "from-pink-400/25 to-pink-500/5",
    iconClass: "text-pink-400",
    lineClass: "bg-pink-400",
    icon: Palette,
    iconKey: "palette",
    iconImageUrl: "",
  },
  {
    title: "Media Cellule",
    description:
      "Every moment, documented. We capture the energy of our events and craft content that keeps our community inspired.",
    accent: "from-amber-400/25 to-amber-500/5",
    iconClass: "text-amber-400",
    lineClass: "bg-amber-400",
    icon: Video,
    iconKey: "video",
    iconImageUrl: "",
  },
  {
    title: "Secretary Cellule",
    description:
      "Nothing gets lost here. Meeting minutes, official records, and every document — organized, accessible, always up to date.",
    accent: "from-emerald-400/25 to-emerald-500/5",
    iconClass: "text-emerald-400",
    lineClass: "bg-emerald-400",
    icon: FileText,
    iconKey: "file",
    iconImageUrl: "",
  },
  {
    title: "Treasury Cellule",
    description:
      "Smart with every dirham. We manage the budget, track every transaction, and ensure our projects always have the resources they need.",
    accent: "from-violet-400/25 to-violet-500/5",
    iconClass: "text-violet-400",
    lineClass: "bg-violet-400",
    icon: Wallet,
    iconKey: "wallet",
    iconImageUrl: "",
  },
  {
    title: "Communication Cellule",
    description:
      "Our voice to the world. We manage social media, build partnerships, and make sure our message reaches the right people at the right time.",
    accent: "from-cyan-400/25 to-cyan-500/5",
    iconClass: "text-cyan-400",
    lineClass: "bg-cyan-400",
    icon: Megaphone,
    iconKey: "megaphone",
    iconImageUrl: "",
  },
];

function buildCarouselItems(events: EventItem[]): EventCarouselItem[] {
  if (!events.length) return [];
  return events.map((event) => ({
    id: event._id,
    title: event.title,
    dateLabel: formatEventDate(event.date, { dateTba: event.dateTba ?? false }),
    imageUrl: event.imageUrl ?? null,
    imageFocusX: event.imageFocusX ?? 50,
    imageFocusY: event.imageFocusY ?? 50,
    imageZoom: event.imageZoom ?? 1,
    linkSlug: event.slug?.current ?? event._id,
  }));
}

type HomeSectionsProps = {
  events: EventItem[];
  teamMembers: TeamMemberListItem[];
  sections: PageSection[];
  knowUsConfig: KnowUsConfig | null;
  partnersConfig: PartnersConfig | null;
  whyJoinConfig: WhyJoinConfig | null;
  cellulesConfig: CellulesConfig | null;
  processStepsConfig: ProcessStepsConfig | null;
  faqConfig: FaqConfig | null;
  applyConfig: ApplySectionConfig | null;
  eventsEmptyCopy: { title: string; message: string };
  sectionLayout: SectionLayout | null;
};

function sectionTitle(sectionKey: string, fallback: string) {
  return sectionsMap[sectionKey] ?? fallback;
}

const sectionsMap: Record<string, string> = {
  events: "Events",
  certificates: "Know us",
  team: "Team",
  faq: "FAQ",
  contact: "Apply",
  sponsors: "Sponsors",
  gallery: "Gallery",
  achievements: "Achievements",
};

/* ── Shared heading renderer: last word gets gradient ───────────── */
function GradientHeading({ text }: { text: string }) {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) {
    return <span className="hero-title-grad">{parts[0]}</span>;
  }
  return (
    <>
      <span className="text-white">{parts.slice(0, -1).join(" ")} </span>
      <span className="hero-title-grad">{parts[parts.length - 1]}</span>
    </>
  );
}

export function HomeSections({
  events,
  teamMembers,
  sections,
  knowUsConfig,
  partnersConfig,
  whyJoinConfig,
  cellulesConfig,
  processStepsConfig,
  faqConfig,
  applyConfig,
  eventsEmptyCopy,
  sectionLayout,
}: HomeSectionsProps) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";

  const eventsTitle = isFr
    ? t.sections.eventsTitle
    : sections.find((item) => item.sectionType === "events")?.title ??
      sectionTitle("events", "Events");
  const teamTitle = isFr
    ? t.sections.teamTitle
    : sections.find((item) => item.sectionType === "team")?.title ??
      sectionTitle("team", "Team");

  const carouselItems = buildCarouselItems(events);
  const partnerLogos = partnersConfig?.logos ?? [];
  const partnerTitle = isFr
    ? t.sections.partnersTitle
    : partnersConfig?.title?.trim() || "Our Partners & Collaborations All the Time";
  const partnerGapPx = partnerLogos.length <= 2 ? 96 : partnerLogos.length === 3 ? 72 : 52;
  const partnerDurationSec = Math.max(10, Math.round(partnerLogos.length * 3.5));
  const partnerBasis =
    partnerLogos.length <= 2
      ? "clamp(170px, 23vw, 260px)"
      : partnerLogos.length === 3
        ? "clamp(150px, 20vw, 230px)"
        : "clamp(120px, 16vw, 200px)";

  const whyJoin = isFr
    ? {
        smallHeading: t.sections.whyJoinSmallHeading,
        title: t.sections.whyJoinTitle,
        description: t.sections.whyJoinDescription,
        highlights: t.sections.whyJoinHighlights,
        cards: t.sections.whyJoinCards,
      }
    : whyJoinConfig ?? {
        smallHeading: "Shaping the Future with Robotics & AI",
        title: "Why Join the Robotics & AI Club",
        description:
          "Join a community of passionate students exploring robotics and artificial intelligence. Through hands-on projects, mentorship, and collaboration, you'll gain practical skills and turn ideas into real-world solutions.",
        cards: whyJoinCards,
      };
  const cellules = isFr
    ? {
        eyebrow: t.sections.cellulesClubName,
        title: t.sections.cellulesTitle,
        subtitle: t.sections.cellulesSubtitle,
        cards: t.sections.cellulesCards.map((card, idx) => ({
          ...cellulesCards[idx % cellulesCards.length]!,
          title: card.title,
          description: card.description,
        })),
      }
    : cellulesConfig ?? {
        eyebrow: "Robotics & AI Club",
        title: "Our Cellules",
        subtitle:
          "Six specialized teams. One shared mission. Together, we handle everything that keeps our club running — from creative vision to operations and beyond.",
        cards: cellulesCards,
      };

  const layout = sectionLayout ?? {
    order: ["hero", "events", "knowUs", "whyJoin", "cellules", "processSteps", "team", "faq", "apply", "footer"],
    visibility: {
      hero: true,
      events: true,
      knowUs: true,
      whyJoin: true,
      cellules: true,
      processSteps: true,
      team: true,
      faq: true,
      apply: true,
      footer: true,
    } as Record<string, boolean>,
  };
  const sectionOrder = (id: string) => {
    const idx = layout.order.indexOf(id);
    return idx >= 0 ? idx : 999;
  };
  const isVisible = (id: string) => layout.visibility[id] !== false;

  return (
    <main className="perspective-page flex flex-col space-y-20 pb-24 sm:space-y-24">
      {/* ═══════════════════════════════════════════════════════════
          EVENTS — open section, eyebrow pill + gradient heading
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("events") ? (
      <RevealSection
        id="events"
        className="relative mx-auto w-[min(94%,1200px)] scroll-mt-28 space-y-6 px-4 sm:px-6 lg:px-8"
        delay={0}
        style={{ order: sectionOrder("events") }}
      >
        <span className="eyebrow-pill mb-4">
          {isFr ? t.sections.eventsEyebrow : "// Upcoming & Past"}
        </span>
        <h2 className="font-heading typo-section-heading font-extrabold tracking-tight text-white">
          <GradientHeading text={eventsTitle} />
        </h2>
        <div className="glass-card glass-prism card-lift-3d--controls-safe rounded-[20px] py-2">
          <EventsCarousel
            items={carouselItems}
            emptyTitle={eventsEmptyCopy.title}
            emptyMessage={eventsEmptyCopy.message}
          />
        </div>
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          KNOW US — open flowing, no border box, atmospheric glow
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("knowUs") ? (
      <RevealSection
        id="know"
        className="relative mx-auto w-full max-w-[1200px] scroll-mt-28 px-4 py-16 sm:px-10 sm:py-20 lg:px-16"
        delay={0.05}
        style={{ order: sectionOrder("knowUs") }}
      >
        {/* Atmospheric glow blob */}
        <div
          className="pointer-events-none absolute right-0 top-1/4 size-96 -translate-y-1/2 translate-x-1/4 rounded-full bg-violet-600/[0.04] blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 size-72 -translate-x-1/4 translate-y-1/4 rounded-full bg-cyan-500/[0.03] blur-[80px]"
          aria-hidden
        />

        <span className="eyebrow-pill mb-4">
          {isFr ? t.sections.knowUsEyebrow : "// Club Fundamentals"}
        </span>
        <h2 className="font-heading typo-section-heading font-extrabold tracking-tight text-white">
          <GradientHeading text={isFr ? t.sections.knowUsTitle : (knowUsConfig?.sectionTitle?.trim() || "Know Us")} />
        </h2>
        <p className="mt-5 max-w-[580px] text-base font-light leading-[1.85] text-slate-400">
          {isFr
            ? t.sections.knowUsIntro
            : knowUsConfig?.intro?.trim()
              ? knowUsConfig.intro.trim()
              : "A quick overview so new members understand our direction, culture, and learning model."}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {(isFr ? t.sections.knowUsCards : knowUsConfig?.cards?.length ? knowUsConfig.cards : knowUsDefaults).map((item, idx) => {
            const KnowIcon = knowUsIcons[idx % knowUsIcons.length]!;
            return (
              <article
                key={item.title}
                className="group relative rounded-2xl border border-transparent bg-transparent p-8 transition-all duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:border-[var(--ds-border)] hover:bg-[var(--ds-surface)] md:p-10 lg:p-12"
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="relative z-10">
                  <div className="icon-ring icon-ring-indigo mb-6 size-12">
                    <KnowIcon className="size-6" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-syne text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-[0.9rem] font-light leading-[1.85] text-slate-400">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          PARTNERS — open section, eyebrow pill + gradient heading
          ═══════════════════════════════════════════════════════════ */}
      {partnerLogos.length ? (
        <RevealSection
          id="partners"
          className="relative mx-auto w-[min(94%,1200px)] scroll-mt-28 space-y-5 px-4 py-2 sm:px-6 lg:px-8"
          delay={0.08}
        >
          <span className="eyebrow-pill mb-4">
            {isFr ? t.sections.partnersEyebrow : "// Partners"}
          </span>
          <h2 className="font-heading typo-section-heading font-extrabold tracking-tight text-white">
            <GradientHeading text={partnerTitle} />
          </h2>
          <PartnersMarquee
            logos={partnerLogos}
            gapPx={partnerGapPx}
            durationSec={partnerDurationSec}
            logoBasis={partnerBasis}
          />
        </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          WHY JOIN — open flowing, no bordered container
          Left column: highlights + description
          Right column: open cards in 2-col grid
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("whyJoin") ? (
      <RevealSection
        id="why-join"
        className="relative mx-auto w-[min(94%,1200px)] scroll-mt-28 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        delay={0.1}
        style={{ order: sectionOrder("whyJoin") }}
      >
        {/* Atmospheric glow */}
        <div
          className="pointer-events-none absolute -left-20 top-1/3 size-80 rounded-full bg-violet-600/[0.05] blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-1/4 size-64 rounded-full bg-cyan-500/[0.04] blur-[80px]"
          aria-hidden
        />

        <span className="eyebrow-pill mb-4">
          {isFr ? t.sections.whyJoinEyebrow : "// Build the future"}
        </span>

        <div className="grid gap-12 lg:grid-cols-[minmax(280px,400px)_1fr] lg:items-start">
          {/* Left — intro copy + highlights */}
          <div className="relative">
            <p className="font-jetbrains mb-4 inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span className="size-2 rounded-full bg-cyan-400" />
              {whyJoin.smallHeading}
            </p>
            <h2 className="font-syne text-3xl font-extrabold leading-[1.08] tracking-tight text-white md:text-4xl lg:text-5xl">
              <GradientHeading text={whyJoin.title} />
            </h2>
            <p className="mt-6 text-base font-light leading-[1.85] text-slate-400">{whyJoin.description}</p>

            <div className="mt-8 space-y-3">
              {(whyJoin.highlights?.length
                ? whyJoin.highlights
                : [
                    { title: "Hands-on Learning", subtitle: "Real projects, real impact" },
                    { title: "6 Specialized Cellules", subtitle: "Design · Media · Tech · More" },
                    { title: "Open to Everyone", subtitle: "Beginner or expert — you belong" },
                  ]
              ).map((h, idx) => {
                const Icon = idx % 3 === 0 ? Users : idx % 3 === 1 ? Megaphone : FileText;
                const ring =
                  idx % 3 === 0
                    ? "bg-cyan-400/10 text-cyan-400"
                    : idx % 3 === 1
                      ? "bg-fuchsia-500/10 text-fuchsia-300"
                      : "bg-emerald-500/10 text-emerald-400";
                return (
                  <div
                    key={`${h.title}-${idx}`}
                    className="flex items-center gap-4 rounded-xl border border-transparent px-5 py-4 transition-[transform,border-color,background-color] duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:translate-x-2 hover:border-[var(--ds-border)] hover:bg-[var(--ds-surface)]"
                  >
                    <div className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${ring}`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-[0.95rem] font-semibold text-white">{h.title}</p>
                      <p className="text-sm text-slate-500">{h.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — feature cards, open grid */}
          <div className="grid gap-7 sm:grid-cols-2">
            {whyJoin.cards.map((card, idx) => (
              <article
                key={card.title}
                className="group relative rounded-2xl border border-transparent p-8 transition-all duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:border-[var(--ds-border)] hover:bg-[var(--ds-surface)] md:p-10"
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <p className="font-jetbrains pointer-events-none absolute right-6 top-5 text-5xl font-medium text-violet-500/[0.08] md:text-6xl">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <div className="relative z-10 mt-8">
                  <h3 className="font-syne text-lg font-bold text-white">{card.title}</h3>
                  <p className="mt-3 text-[0.9rem] font-light leading-[1.8] text-slate-400">{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          CELLULES — open flowing, no bordered container
          Grid of cards that hover-reveal their border
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("cellules") ? (
      <RevealSection
        id="cellules"
        className="relative mx-auto w-[min(94%,1200px)] scroll-mt-28 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        delay={0.12}
        style={{ order: sectionOrder("cellules") }}
      >
        {/* Atmospheric glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/[0.03] blur-[120px]"
          aria-hidden
        />

        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow-pill mb-4">
            {isFr ? t.sections.cellulesEyebrow : "// Structure"}
          </span>
          <p className="font-jetbrains mt-4 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="h-px w-8 bg-[var(--accent-primary)]/30" />
            {cellules.eyebrow}
            <span className="h-px w-8 bg-[var(--accent-primary)]/30" />
          </p>
          <h2 className="font-syne mt-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            <GradientHeading text={cellules.title} />
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-relaxed text-slate-400">
            {cellules.subtitle}
          </p>
        </div>

        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {cellules.cards.map((card, idx) => {
            const base = cellulesCards[idx % cellulesCards.length]!;
            const Icon = resolveSectionIcon(card.iconKey, base.icon);
            return (
              <article
                key={card.title}
                className="group relative overflow-hidden rounded-2xl border border-transparent p-8 transition-all duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)] hover:border-[var(--ds-border)] hover:bg-[var(--ds-surface)] md:p-10"
              >
                {/* Left accent bar on hover */}
                <span
                  className="pointer-events-none absolute left-0 top-0 h-0 w-[3px] bg-gradient-to-b from-violet-600 to-cyan-500 transition-all duration-500 group-hover:h-full"
                  aria-hidden
                />
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <p className="font-jetbrains mb-4 text-4xl font-medium text-violet-500/[0.08] md:text-5xl">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <div className="relative z-10">
                  <div className="mb-5 inline-flex text-[1.5rem] text-white/90">
                    {card.iconImageUrl?.trim() ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.iconImageUrl}
                          alt={`${card.title} icon`}
                          className="size-7 object-contain"
                        />
                      </>
                    ) : (
                      <Icon className={`size-7 ${base.iconClass}`} strokeWidth={1.6} />
                    )}
                  </div>
                  <h3 className="font-syne text-lg font-bold text-white">{card.title}</h3>
                  <p className="mt-3 text-[0.9rem] font-light leading-[1.8] text-slate-400">
                    {card.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          PROCESS STEPS — open horizontal timeline (no box)
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("processSteps") ? (
      <RevealSection className="mx-auto w-full py-2" delay={0.14} style={{ order: sectionOrder("processSteps") }}>
        <ProcessStepsSection config={processStepsConfig} />
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          TEAM — self-contained bordered card shell (keeps hard border)
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("team") ? (
      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.16} style={{ order: sectionOrder("team") }}>
        <TeamSection title={teamTitle} members={teamMembers} />
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          FAQ — self-contained bordered section (keeps hard shell)
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("faq") ? (
      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.18} style={{ order: sectionOrder("faq") }}>
        <FaqSection config={faqConfig} />
      </RevealSection>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          APPLY — self-contained bordered section (keeps hard shell)
          ═══════════════════════════════════════════════════════════ */}
      {isVisible("apply") ? (
      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.2} style={{ order: sectionOrder("apply") }}>
        <ApplySection config={applyConfig} />
      </RevealSection>
      ) : null}
    </main>
  );
}
