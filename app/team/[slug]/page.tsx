import { Navbar } from "@/components/layout/navbar";
import { TeamMemberProfilePageClient } from "@/components/team/team-member-profile-page-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: "Team Member | Robotics & AI Club",
    description: `Realtime team member profile for ${slug}`,
  };
}

export default async function TeamMemberPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="relative">
      <Navbar />
      <TeamMemberProfilePageClient key={slug} slug={slug} />
    </div>
  );
}