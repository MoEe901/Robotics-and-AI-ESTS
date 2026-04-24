import { SubmissionDetailClient } from "@/components/admin/submission-detail-client";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubmissionDetailClient id={id} />;
}
