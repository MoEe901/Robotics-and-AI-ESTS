import { Suspense } from "react";

import { TeamAdminClient } from "@/components/admin/team-admin-client";

export default function AdminTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-12 text-sm text-white/60">Loading team admin…</div>
      }
    >
      <TeamAdminClient />
    </Suspense>
  );
}
