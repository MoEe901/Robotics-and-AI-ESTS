import {
  EventsCarousel,
  type EventCarouselItem,
} from "@/components/events/events-carousel";
import { TeamSection } from "@/components/team/team-section";
import type { EventItem, PageSection } from "@/lib/firebase/types";
import type { TeamMemberListItem } from "@/lib/team/types";

const sectionClass =
  "mx-auto w-[min(94%,1100px)] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-[400ms] ease-in-out md:p-10";

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

export function HomeSections({ events, teamMembers, sections }: HomeSectionsProps) {
  const eventsTitle =
    sections.find((item) => item.sectionType === "events")?.title ??
    sectionTitle("events", "Events");
  const teamTitle =
    sections.find((item) => item.sectionType === "team")?.title ??
    sectionTitle("team", "Team");

  const carouselItems = buildCarouselItems(events);

  return (
    <main className="space-y-8 pb-20">
      <section id="events" className="space-y-6">
        <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">{eventsTitle}</h2>
        </div>
        <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-y border-white/[0.06] bg-gradient-to-b from-black/20 via-transparent to-black/25 py-2">
          <EventsCarousel items={carouselItems} />
        </div>
      </section>

      <section id="certificates" className={sectionClass}>
        <h2 className="text-2xl font-semibold tracking-tight">
          {sectionTitle("certificates", "Know us")}
        </h2>
        <p className="mt-3 text-white/75">
          Highlight certified workshops, challenge completions, and competition milestones.
        </p>
      </section>

      <TeamSection title={teamTitle} members={teamMembers} />

      <section id="faq" className={sectionClass}>
        <h2 className="text-2xl font-semibold tracking-tight">
          {sectionTitle("faq", "FAQ")}
        </h2>
      </section>

      <section id="apply" className={sectionClass}>
        <h2 className="text-2xl font-semibold tracking-tight">
          {sectionTitle("contact", "Apply")}
        </h2>
      </section>
    </main>
  );
}


