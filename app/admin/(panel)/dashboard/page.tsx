"use client";

import { ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useAdminSession } from "@/components/admin/admin-session-context";
import { isAdminPathAllowedForRole } from "@/lib/admin-route-access";

const DASHBOARD_ITEMS = [
  {
    href: "/admin/team",
    title: "Team members",
    desc: "Add, edit, and publish profiles per academic year.",
  },
  {
    href: "/admin/events",
    title: "Events",
    desc: "Manage upcoming and past events shown on the homepage.",
  },
  {
    href: "/admin/basic",
    title: "Know us",
    desc: 'Edit the "Know us" homepage section and supporting copy.',
  },
  {
    href: "/admin/faq",
    title: "FAQ (homepage)",
    desc: "Edit the FAQ section visible on the public site.",
  },
  {
    href: "/admin/apply",
    title: "Apply / contact (homepage)",
    desc: "Configure the application form and contact block.",
  },
];

export default function AdminDashboardPage() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "YOUR_PROJECT_ID";
  const { ready, session } = useAdminSession();

  const items = useMemo(() => {
    if (!ready || !session?.ok) return DASHBOARD_ITEMS;
    return DASHBOARD_ITEMS.filter((it) => isAdminPathAllowedForRole(it.href, session.role));
  }, [ready, session]);

  const showFirestoreShortcut =
    !ready ||
    !session?.ok ||
    session.role === "admin" ||
    session.role === "editor";

  return (
    <div className="admin-page">
      <span className="admin-eyebrow">CONTROL CENTER</span>
      <h1 className="admin-page-title mt-3">Dashboard</h1>
      <p className="admin-page-subtitle">
        Manage Firestore content without opening raw JSON for every field. Expand this area over time
        (events, homepage sections, uploads).
      </p>

      <div className="mt-10 grid grid-cols-1 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="admin-card admin-card--interactive group flex items-center justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <div className="font-syne text-base font-bold text-white">{item.title}</div>
              <div className="mt-1 text-sm text-white/60">{item.desc}</div>
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-white/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#06b6d4]" />
          </Link>
        ))}

        {showFirestoreShortcut ? (
          <a
            href={`https://console.firebase.google.com/project/${projectId}/firestore`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-card admin-card--interactive group flex items-center justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <div className="font-syne text-base font-bold text-white">Open Firestore in Firebase Console</div>
              <div className="mt-1 text-sm text-white/60">External — for raw document editing.</div>
            </div>
            <ExternalLink className="size-5 shrink-0 text-white/40 transition-colors group-hover:text-[#06b6d4]" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
