import { Navbar } from "@/components/layout/navbar";
import { EventDocumentaryPageClient } from "@/components/events/event-documentary-page-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: "Event | Robotics & AI Club",
    description: `Event details and story — ${decodeURIComponent(slug)}`,
  };
}

export default async function EventDocumentaryPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="relative">
      <Navbar />
      <EventDocumentaryPageClient key={slug} pathSegment={slug} />
    </div>
  );
}
