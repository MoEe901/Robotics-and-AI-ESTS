"use client";

import { useEffect, useState } from "react";

import { MemberProfile } from "@/components/team/member-profile";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { subscribeToMemberBySlug } from "@/lib/firebase/realtime";
import type { TeamMemberProfile } from "@/lib/team/types";
import { useTeamStore } from "@/store/teamStore";
import { useLanguage } from "@/lib/i18n/context";

type TeamMemberProfilePageClientProps = {
  slug: string;
};

export function TeamMemberProfilePageClient({ slug }: TeamMemberProfilePageClientProps) {
  const { t } = useLanguage();
  const clientMounted = useClientMounted();
  const setProfileForSlug = useTeamStore((s) => s.setProfileForSlug);

  /** False until the slug subscription has fired at least once (success or error). */
  const [subscriptionSettled, setSubscriptionSettled] = useState(false);

  useEffect(() => {
    const unsub = subscribeToMemberBySlug(
      slug,
      (row) => {
        if (row) setProfileForSlug(slug, row);
        else setProfileForSlug(slug, null);
        setSubscriptionSettled(true);
      },
      () => {
        setSubscriptionSettled(true);
      },
    );

    return () => unsub();
  }, [setProfileForSlug, slug]);

  const member: TeamMemberProfile | undefined = useTeamStore((s) => s.profilesBySlug[slug]);
  const awaitingLive = !member && !subscriptionSettled;

  // Update browser tab title with locale-aware text
  // Use setTimeout to override Next.js server metadata after React reconciliation
  const { locale } = useLanguage();
  useEffect(() => {
    if (!member) return;
    const suffix = locale === "fr" ? "Club Robotique & IA" : "Robotics & AI Club";
    const title = `${member.name} | ${suffix}`;
    document.title = title;
    const t = setTimeout(() => { document.title = title; }, 100);
    return () => clearTimeout(t);
  }, [member, locale]);

  if (!clientMounted) {
    return <div className="min-h-[50vh]" suppressHydrationWarning aria-hidden />;
  }

  if (!member && awaitingLive) {
    return (
      <p className="mx-auto w-[min(94%,720px)] px-4 pb-24 pt-24 text-sm text-[#6b6a80] md:pt-28">
        {t.memberProfilePage.loading}
      </p>
    );
  }

  if (!member) {
    return (
      <p className="mx-auto w-[min(94%,720px)] px-4 pb-24 pt-24 text-sm text-[#6b6a80] md:pt-28">
        {t.memberProfilePage.notFound}
      </p>
    );
  }

  return <MemberProfile member={member} />;
}
