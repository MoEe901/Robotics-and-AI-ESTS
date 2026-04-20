import Link from "next/link";

export default function AdminDashboardPage() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "YOUR_PROJECT_ID";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
      <p className="mt-2 text-sm text-white/60">
        Manage Firestore content without opening raw JSON for every field. Expand this area over time
        (events, homepage sections, uploads).
      </p>

      <ul className="mt-10 space-y-3">
        <li>
          <Link
            href="/admin/team"
            className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            Team members
            <span className="text-white/45">→</span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/events"
            className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            Events
            <span className="text-white/45">→</span>
          </Link>
        </li>
        <li>
          <a
            href={`https://console.firebase.google.com/project/${projectId}/firestore`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4 text-sm font-medium text-white/85 transition hover:border-white/25"
          >
            Open Firestore in Firebase Console
            <span className="text-white/45">↗</span>
          </a>
        </li>
      </ul>

    </div>
  );
}
