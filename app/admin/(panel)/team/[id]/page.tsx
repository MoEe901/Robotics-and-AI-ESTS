import { TeamMemberEditor } from "@/components/admin/team-member-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminTeamMemberEditPage({ params }: PageProps) {
  const { id } = await params;

  return <TeamMemberEditor key={id} memberId={id} />;
}
