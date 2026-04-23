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
import { PartnersMarquee } from "@/components/content/partners-marquee";
import { RevealSection } from "@/components/motion/reveal-section";
import { ApplySection } from "@/components/content/apply-section";
import { FaqSection } from "@/components/content/faq-section";
import { ProcessStepsSection } from "@/components/content/process-steps-section";
import { TeamSection } from "@/components/team/team-section";
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

const celluleIcons = {
  users: Users,
  palette: Palette,
  video: Video,
  file: FileText,
  wallet: Wallet,
  megaphone: Megaphone,
} as const;

function buildCarouselItems(events: EventItem[]): EventCarouselItem[] {
  if (!events.length) return [];
  return events.map((event) => ({
    id: event._id,
    title: event.title,
    dateLabel: event.date
      ? new Date(event.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Date TBA",
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
}: HomeSectionsProps) {
  const eventsTitle =
    sections.find((item) => item.sectionType === "events")?.title ??
    sectionTitle("events", "Events");
  const teamTitle =
    sections.find((item) => item.sectionType === "team")?.title ??
    sectionTitle("team", "Team");

  const carouselItems = buildCarouselItems(events);
  const partnerLogos = partnersConfig?.logos ?? [];
  const partnerTitle = partnersConfig?.title?.trim() || "Our Partners & Collaborations All the Time";
  const partnerGapPx = partnerLogos.length <= 2 ? 96 : partnerLogos.length === 3 ? 72 : 52;
  const partnerDurationSec = Math.max(10, Math.round(partnerLogos.length * 3.5));
  const partnerBasis =
    partnerLogos.length <= 2
      ? "clamp(170px, 23vw, 260px)"
      : partnerLogos.length === 3
        ? "clamp(150px, 20vw, 230px)"
        : "clamp(120px, 16vw, 200px)";

  const whyJoin = whyJoinConfig ?? {
    smallHeading: "Shaping the Future with Robotics & AI",
    title: "Why Join the Robotics & AI Club",
    description:
      "Join a community of passionate students exploring robotics and artificial intelligence. Through hands-on projects, mentorship, and collaboration, you'll gain practical skills and turn ideas into real-world solutions.",
    cards: whyJoinCards,
  };
  const cellules = cellulesConfig ?? {
    eyebrow: "Robotics & AI Club",
    title: "Our Cellules",
    subtitle:
      "Six specialized teams. One shared mission. Together, we handle everything that keeps our club running — from creative vision to operations and beyond.",
    cards: cellulesCards,
  };

  return (
    <main className="perspective-page space-y-8 pb-20">
      <RevealSection
        id="events"
        className="mx-auto w-[min(94%,1200px)] scroll-mt-28 space-y-6 px-4 sm:px-6 lg:px-8"
        delay={0}
      >
        <span className="font-jetbrains mb-2 block text-[10px] uppercase tracking-[0.3em] text-cyan-400">
          {"// Upcoming & Past"}
        </span>
        <h2 className="font-syne text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          {(() => {
            const parts = eventsTitle.trim().split(/\s+/);
            if (parts.length === 1) {
              return <span className="hero-title-grad">{parts[0]}</span>;
            }
            return (
              <>
                <span className="text-white">{parts.slice(0, -1).join(" ")} </span>
                <span className="hero-title-grad">{parts[parts.length - 1]}</span>
              </>
            );
          })()}
        </h2>
        <div className="card-lift-3d rounded-[20px] border border-violet-500/15 bg-[#111422]/80 py-2 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
          <EventsCarousel items={carouselItems} />
        </div>
      </RevealSection>

      <RevealSection
        id="know"
        className="mx-auto w-full max-w-[1200px] scroll-mt-28 bg-[#0d0f1a] px-4 py-16 sm:px-10 sm:py-20 lg:px-16"
        delay={0.05}
      >
        <span className="font-jetbrains mb-2 block text-[10px] uppercase tracking-[0.3em] text-cyan-400">
          {"// Club Fundamentals"}
        </span>
        <h2 className="font-syne text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          Know <span className="hero-title-grad">Us</span>
        </h2>
        <p className="mt-4 max-w-[550px] text-[0.95rem] font-light leading-[1.9] text-slate-400">
          {knowUsConfig?.intro?.trim()
            ? knowUsConfig.intro.trim()
            : "A quick overview so new members understand our direction, culture, and learning model."}
        </p>
        <div className="mt-10 grid gap-px bg-violet-500/10 md:grid-cols-3">
          {(knowUsConfig?.cards?.length ? knowUsConfig.cards : knowUsDefaults).map((item, idx) => {
            const KnowIcon = knowUsIcons[idx % knowUsIcons.length]!;
            return (
              <article
                key={item.title}
                className="card-lift-3d bg-[#0d0f1a] p-8 transition-colors hover:bg-violet-500/[0.04] md:p-10"
              >
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.08] text-violet-200">
                  <KnowIcon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-syne text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-[0.83rem] font-light leading-[1.85] text-slate-400">{item.description}</p>
              </article>
            );
          })}
        </div>
      </RevealSection>

      {partnerLogos.length ? (
        <RevealSection
          id="partners"
          className="mx-auto w-[min(94%,1200px)] scroll-mt-28 space-y-5 px-4 py-2 sm:px-6 lg:px-8"
          delay={0.08}
        >
          <span className="font-jetbrains mb-2 block text-[10px] uppercase tracking-[0.3em] text-cyan-400">
            {"// Partners"}
          </span>
          <h2 className="font-syne text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
            {partnerTitle}
          </h2>
          <PartnersMarquee
            logos={partnerLogos}
            gapPx={partnerGapPx}
            durationSec={partnerDurationSec}
            logoBasis={partnerBasis}
          />
        </RevealSection>
      ) : null}

      <RevealSection
        id="why-join"
        className="mx-auto w-[min(94%,1200px)] scroll-mt-28 px-4 py-2 sm:px-6 lg:px-8"
        delay={0.1}
      >
        <span className="font-jetbrains mb-2 block text-[10px] uppercase tracking-[0.3em] text-cyan-400">
          {"// Build the future"}
        </span>
        <div className="overflow-hidden rounded-3xl border border-violet-500/10 bg-violet-500/[0.02]">
          <div className="grid gap-px bg-violet-500/10 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <article className="relative overflow-hidden bg-[#0d0f1a] p-7 md:p-9">
              <div className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-violet-600/15 blur-3xl" />
              <div className="pointer-events-none absolute right-6 top-8 size-44 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative z-10">
                <p className="font-jetbrains inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  {whyJoin.smallHeading}
                </p>
                <h2 className="font-syne mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
                  {whyJoin.title}
                </h2>
                <p className="mt-6 text-[15px] font-light leading-[1.85] text-slate-400">{whyJoin.description}</p>
              </div>

              <div className="relative z-10 mt-8 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] px-4 py-3 transition hover:translate-x-1.5 hover:border-violet-500/30 hover:bg-violet-500/[0.07]">
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Hands-on Learning</p>
                    <p className="text-xs text-slate-500">Real projects, real impact</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] px-4 py-3 transition hover:translate-x-1.5 hover:border-violet-500/30 hover:bg-violet-500/[0.07]">
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-300">
                    <Megaphone className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">6 Specialized Cellules</p>
                    <p className="text-xs text-slate-500">Design · Media · Tech · More</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] px-4 py-3 transition hover:translate-x-1.5 hover:border-violet-500/30 hover:bg-violet-500/[0.07]">
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Open to Everyone</p>
                    <p className="text-xs text-slate-500">Beginner or expert — you belong</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-px bg-violet-500/10 sm:grid-cols-2">
              {whyJoin.cards.map((card, idx) => (
                <article
                  key={card.title}
                  className="card-lift-3d group relative overflow-hidden bg-[#0d0f1a] p-6 transition-colors hover:bg-violet-500/[0.05] md:p-8"
                >
                  <p className="font-jetbrains pointer-events-none absolute right-5 top-4 text-4xl font-medium text-violet-500/[0.12] md:text-5xl">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                  <div className="relative z-10 mt-6">
                    <h3 className="font-syne text-[0.95rem] font-bold text-white">{card.title}</h3>
                    <p className="mt-3 text-[0.78rem] font-light leading-[1.8] text-slate-400">{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        id="cellules"
        className="mx-auto w-[min(94%,1200px)] scroll-mt-28 px-4 py-2 sm:px-6 lg:px-8"
        delay={0.12}
      >
        <span className="font-jetbrains mb-2 block text-[10px] uppercase tracking-[0.3em] text-cyan-400">
          {"// Structure"}
        </span>
        <div className="overflow-hidden rounded-3xl border border-violet-500/10 bg-violet-500/[0.02]">
          <header className="border-b border-violet-500/[0.08] px-5 py-10 text-center md:px-8 md:py-12">
            <p className="font-jetbrains inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
              <span className="h-px w-6 bg-violet-500/25" />
              {cellules.eyebrow}
              <span className="h-px w-6 bg-violet-500/25" />
            </p>
            <h2 className="font-syne mt-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              {cellules.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-slate-400 md:text-base">
              {cellules.subtitle}
            </p>
          </header>

          <div className="grid gap-px bg-violet-500/10 sm:grid-cols-2 lg:grid-cols-3">
            {cellules.cards.map((card, idx) => {
              const base = cellulesCards[idx % cellulesCards.length]!;
              const iconKey = (card.iconKey ?? "").trim().toLowerCase() as keyof typeof celluleIcons;
              const Icon = celluleIcons[iconKey] ?? base.icon;
              return (
                <article
                  key={card.title}
                  className="card-lift-3d group relative overflow-hidden bg-[#0d0f1a] p-6 transition-colors hover:bg-violet-500/[0.04] md:p-8"
                >
                  <span
                    className="pointer-events-none absolute left-0 top-0 h-0 w-[3px] bg-gradient-to-b from-violet-600 to-cyan-500 transition-all duration-500 group-hover:h-full"
                    aria-hidden
                  />
                  <p className="font-jetbrains mb-3 text-3xl font-medium text-violet-500/[0.12] md:text-4xl">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex text-[1.35rem] text-white/90">
                      {card.iconImageUrl?.trim() ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.iconImageUrl}
                            alt={`${card.title} icon`}
                            className="size-6 object-contain"
                          />
                        </>
                      ) : (
                        <Icon className={`size-6 ${base.iconClass}`} strokeWidth={1.75} />
                      )}
                    </div>
                    <h3 className="font-syne text-[0.95rem] font-bold text-white">{card.title}</h3>
                    <p className="mt-2 text-[0.78rem] font-light leading-[1.8] text-slate-400">
                      {card.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.14}>
        <ProcessStepsSection config={processStepsConfig} />
      </RevealSection>

      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.16}>
        <TeamSection title={teamTitle} members={teamMembers} />
      </RevealSection>

      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.18}>
        <FaqSection config={faqConfig} />
      </RevealSection>

      <RevealSection className="mx-auto w-[min(94%,1100px)] py-2" delay={0.2}>
        <ApplySection config={applyConfig} />
      </RevealSection>
    </main>
  );
}


