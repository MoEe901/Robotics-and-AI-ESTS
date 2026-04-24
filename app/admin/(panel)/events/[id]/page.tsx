import { EventEditor } from "@/components/admin/event-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventEditPage({ params }: PageProps) {
  const { id } = await params;

  return <EventEditor key={id} eventId={id} />;
}
