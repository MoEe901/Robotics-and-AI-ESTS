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
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="mx-auto w-[min(94%,1100px)] px-4 pb-24 pt-28 md:px-6 md:pt-32">
            <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-10 w-48 animate-pulse rounded-lg bg-white/10" />
                <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
              </div>
              <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
            </div>
            <div className="mt-8 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
                />
              ))}
            </div>
          </main>
        }
      >
        <TeamPageClient />
      </Suspense>
    </>
  );
}