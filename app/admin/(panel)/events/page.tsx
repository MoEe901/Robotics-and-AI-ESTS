import { Suspense } from "react";

import { EventsAdminClient } from "@/components/admin/events-admin-client";

export default function AdminEventsPage() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-sm text-white/60">Loading events…</div>}>
      <EventsAdminClient />
    </Suspense>
  );
}
