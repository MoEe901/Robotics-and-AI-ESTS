"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";
import type { EventDoc } from "@/lib/firebase/types";

type Row = { id: string; data: EventDoc };

function sortRows(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => {
    const oa = typeof a.data.order === "number" ? a.data.order : 9999;
    const ob = typeof b.data.order === "number" ? b.data.order : 9999;
    if (oa !== ob) return oa - ob;
    return String(a.data.title ?? "").localeCompare(String(b.data.title ?? ""));
  });
}

export function EventsAdminClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db(), "events"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Row[] = [];
        snap.forEach((d) => next.push({ id: d.id, data: d.data() as EventDoc }));
        setRows(sortRows(next));
        setError(null);
      },
      (e) => setError(e.message),
    );
    return () => unsub();
  }, []);

  const maxOrder = useMemo(() => {
    let m = 0;
    for (const r of rows) {
      if (typeof r.data.order === "number" && r.data.order > m) m = r.data.order;
    }
    return m;
  }, [rows]);

  const addEvent = useCallback(async () => {
    setAdding(true);
    setError(null);
    try {
      const slug = `event-${Date.now()}`;
      const ref = await addDoc(collection(db(), "events"), {
        title: "Untitled event",
        slug,
        order: maxOrder + 1,
        isActive: true,
        isFeatured: false,
      });
      router.push(`/admin/events/${ref.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create event");
    } finally {
      setAdding(false);
    }
  }, [maxOrder, router]);

  const toggleField = useCallback(async (id: string, field: "isActive" | "isFeatured", value: boolean) => {
    setBusyId(id);
    setError(null);
    try {
      await updateDoc(doc(db(), "events", id), { [field]: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Events</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Control homepage visibility with{" "}
            <span className="text-white/80">Show on site</span> (<code className="text-white/70">isActive</code>
            ). Hidden events stay editable here and in Firestore.
          </p>
        </div>
        <button
          type="button"
          disabled={adding}
          onClick={() => void addEvent()}
          className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/[0.12] disabled:opacity-50"
        >
          {adding ? "Creating…" : "New event"}
        </button>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <ul className="mt-10 space-y-3">
        {rows.length === 0 ? (
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-white/55">
            No events yet. Create one to show it on the homepage (when{" "}
            <span className="text-white/75">Show on site</span> is on).
          </li>
        ) : null}
        {rows.map((r) => {
          const active = r.data.isActive !== false;
          const featured = Boolean(r.data.isFeatured);
          const title = typeof r.data.title === "string" && r.data.title.trim() ? r.data.title.trim() : "(no title)";
          const busy = busyId === r.id;
          return (
            <li
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/events/${r.id}`}
                  className="text-sm font-semibold text-white hover:text-blue-200"
                >
                  {title}
                </Link>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
                  <span>order: {typeof r.data.order === "number" ? r.data.order : "—"}</span>
                  {typeof r.data.slug === "string" && r.data.slug ? (
                    <span className="truncate">slug: {r.data.slug}</span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!active ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                      Hidden from site
                    </span>
                  ) : null}
                  {featured ? (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
                      Featured
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-white/20 bg-black/40"
                    checked={active}
                    disabled={busy}
                    onChange={(ev) => void toggleField(r.id, "isActive", ev.target.checked)}
                  />
                  Show on site
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-white/20 bg-black/40"
                    checked={featured}
                    disabled={busy}
                    onChange={(ev) => void toggleField(r.id, "isFeatured", ev.target.checked)}
                  />
                  Featured
                </label>
                <Link
                  href={`/admin/events/${r.id}`}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:border-white/30 hover:text-white"
                >
                  Edit
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
