import {
  EventsCarousel,
  type EventCarouselItem,
} from "@/components/events/events-carousel";
import { FileText, Megaphone, Palette, Users, Video, Wallet } from "lucide-react";
import { PartnersMarquee } from "@/components/content/partners-marquee";
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

const sectionClass =
  "mx-auto w-[min(94%,1100px)] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-[400ms] ease-in-out md:p-10";

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
    <main className="space-y-8 pb-20">
      <section id="events" className="mx-auto w-[min(94%,1100px)] space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{eventsTitle}</h2>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-2">
          <EventsCarousel items={carouselItems} />
        </div>
      </section>

      <section id="certificates" className="mx-auto w-[min(94%,1100px)] py-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {sectionTitle("certificates", "Know us")}
        </h2>
        <p className="mt-3 max-w-3xl text-white/75">
          {knowUsConfig?.intro?.trim()
            ? knowUsConfig.intro.trim()
            : "A quick overview of the club fundamentals so new members understand our direction, culture, and learning model."}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(knowUsConfig?.cards?.length ? knowUsConfig.cards : knowUsDefaults).map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-transparent p-0"
            >
              <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {partnerLogos.length ? (
        <section id="partners" className="mx-auto w-[min(94%,1100px)] space-y-5 py-2">
          <h2 className="text-2xl font-semibold tracking-tight">{partnerTitle}</h2>
          <PartnersMarquee
            logos={partnerLogos}
            gapPx={partnerGapPx}
            durationSec={partnerDurationSec}
            logoBasis={partnerBasis}
          />
        </section>
      ) : null}

      <section id="why-join" className="mx-auto w-[min(94%,1100px)] py-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="grid gap-[1px] bg-white/10 lg:grid-cols-[340px_1fr]">
            <article className="relative overflow-hidden bg-[#0e0e16] p-7 md:p-9">
              <div className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
              <div className="pointer-events-none absolute right-6 top-8 size-44 rounded-full bg-pink-400/15 blur-3xl animate-pulse" />

              <div className="relative z-10">
                <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
                  <span className="size-1.5 rounded-full bg-blue-400" />
                  {whyJoin.smallHeading}
                </p>
                <h2 className="mt-5 text-5xl font-semibold leading-[0.93] tracking-tight text-white md:text-6xl">
                  {whyJoin.title}
                </h2>
                <p className="mt-6 text-[15px] leading-[1.72] text-white/60">{whyJoin.description}</p>
              </div>

              <div className="relative z-10 mt-8 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-400/15 text-blue-400">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Hands-on Learning</p>
                    <p className="text-xs text-white/55">Real projects, real impact</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-pink-400/15 text-pink-400">
                    <Megaphone className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">6 Specialized Cellules</p>
                    <p className="text-xs text-white/55">Design · Media · Tech · More</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-400">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Open to Everyone</p>
                    <p className="text-xs text-white/55">Beginner or expert — you belong</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-[1px] bg-white/10 sm:grid-cols-2">
              {whyJoin.cards.map((card, idx) => (
                <article
                  key={card.title}
                  className="group relative overflow-hidden bg-[#111119] p-6 md:p-8"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-blue-400/10 via-transparent to-pink-400/10" />
                  <p className="absolute right-5 top-4 text-5xl font-semibold tracking-tight text-white/[0.06] transition-colors duration-300 group-hover:text-white/[0.1]">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                  <div className="relative z-10">
                    <div className="mb-5 h-0.5 w-0 rounded-full bg-blue-400 transition-all duration-300 group-hover:w-10" />
                    <h3 className="text-lg font-medium tracking-tight text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-[1.7] text-white/60">{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cellules" className="mx-auto w-[min(94%,1100px)] py-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-8 md:px-8 md:py-10">
          <header className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
              <span className="h-px w-6 bg-white/20" />
              {cellules.eyebrow}
              <span className="h-px w-6 bg-white/20" />
            </p>
            <h2 className="mt-4 text-5xl font-semibold tracking-tight text-white md:text-7xl">
              {cellules.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
              {cellules.subtitle}
            </p>
          </header>

          <div className="mt-8 grid gap-[2px] overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {cellules.cards.map((card, idx) => {
              const base = cellulesCards[idx % cellulesCards.length]!;
              const iconKey = (card.iconKey ?? "").trim().toLowerCase() as keyof typeof celluleIcons;
              const Icon = celluleIcons[iconKey] ?? base.icon;
              return (
                <article
                  key={card.title}
                  className="group relative overflow-hidden bg-[#111118] p-6 md:p-7"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${base.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <p className="absolute right-6 top-5 text-5xl font-semibold tracking-tight text-white/[0.06] transition-colors duration-300 group-hover:text-white/[0.1]">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                  <div className="relative z-10">
                    <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-white/5">
                      {card.iconImageUrl?.trim() ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.iconImageUrl}
                            alt={`${card.title} icon`}
                            className="size-5 object-contain"
                          />
                        </>
                      ) : (
                        <Icon className={`size-5 ${base.iconClass}`} />
                      )}
                    </div>
                    <div
                      className={`mb-4 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-9 ${base.lineClass}`}
                    />
                    <h3 className="text-lg font-medium tracking-tight text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{card.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ProcessStepsSection config={processStepsConfig} />

      <TeamSection title={teamTitle} members={teamMembers} />

      <FaqSection config={faqConfig} />

      <ApplySection config={applyConfig} />
    </main>
  );
}


