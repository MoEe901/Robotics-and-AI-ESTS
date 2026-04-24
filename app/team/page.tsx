import { Suspense } from "react";

import { Navbar } from "@/components/layout/navbar";
import { TeamPageClient } from "@/components/team/team-page-client";

export const metadata = {
  title: "Team | Robotics & AI Club",
  description: "Meet the Robotics & AI Club members.",
};

export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div className="relative pt-24 md:pt-28">
      <Navbar />
      <Suspense
        fallback={
          <main className="min-h-screen bg-[#08080e] px-6 pb-24 pt-8 md:px-12">
            <div className="mx-auto max-w-[1200px] space-y-4">
              <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-16 w-2/3 max-w-md animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
            </div>
            <div className="mx-auto mt-10 grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-[360px] animate-pulse rounded-[20px] border border-white/[0.07] bg-[#0d0d18]"
                />
              ))}
            </div>
          </main>
        }
      >
        <TeamPageClient />
      </Suspense>
    </div>
  );
}