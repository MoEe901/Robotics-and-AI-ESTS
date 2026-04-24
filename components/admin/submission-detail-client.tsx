"use client";

import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";

type DocData = {
  formId: string;
  fields: Record<string, string>;
  status: "new" | "read" | "archived";
  submittedAt: string;
  notes: string;
};

export function SubmissionDetailClient({ id }: { id: string }) {
  const [row, setRow] = useState<DocData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "submissions", id));
        if (!snap.exists()) {
          if (!cancelled) setError("Submission not found.");
          return;
        }
        const r = snap.data() as Record<string, unknown>;
        const ts = r.submittedAt as { toDate?: () => Date } | undefined;
        if (!cancelled) {
          setRow({
            formId: typeof r.formId === "string" ? r.formId : "unknown",
            fields: r.fields && typeof r.fields === "object" ? (r.fields as Record<string, string>) : {},
            status: r.status === "read" || r.status === "archived" ? r.status : "new",
            submittedAt: ts?.toDate ? ts.toDate().toISOString() : "",
            notes: typeof r.notes === "string" ? r.notes : "",
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load submission.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const mailto = useMemo(() => {
    if (!row) return "";
    const email = row.fields.email || "";
    const name = row.fields.firstName || row.fields.fullName || "there";
    return `mailto:${email}?subject=${encodeURIComponent("Thanks for your submission")}&body=${encodeURIComponent(`Hi ${name},\n\nThanks for your submission to Robotics & AI Club.`)}`;
  }, [row]);

  async function copyReplyTemplate() {
    if (!mailto) return;
    try {
      await navigator.clipboard.writeText(mailto);
      alert("Reply template copied.");
    } catch {
      alert("Could not copy template.");
    }
  }

  async function setStatus(status: "read" | "archived") {
    await updateDoc(doc(db(), "submissions", id), {
      status,
      readAt: new Date(),
      notes: row?.notes || "",
    });
    setRow((prev) => (prev ? { ...prev, status } : prev));
  }

  async function saveNote() {
    await updateDoc(doc(db(), "submissions", id), { notes: row?.notes || "" });
  }

  async function remove() {
    if (!confirm("Delete this submission?")) return;
    await deleteDoc(doc(db(), "submissions", id));
    window.location.href = "/admin/submissions";
  }

  if (error) return <div className="admin-page">{error}</div>;
  if (!row) return <div className="admin-page">Loading...</div>;

  const actionBtn = "rounded-lg border px-4 py-2 text-sm transition-colors";

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Submission</h1>
      <p className="admin-page-subtitle">
        {row.formId} &middot; {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void setStatus("read")}
          className={`${actionBtn} border-white/20 text-white/90 hover:bg-white/10`}
        >
          Mark read
        </button>
        <button
          type="button"
          onClick={() => void setStatus("archived")}
          className={`${actionBtn} border-white/20 text-white/90 hover:bg-white/10`}
        >
          Archive
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          className={`${actionBtn} border-rose-400/30 text-rose-300 hover:bg-rose-500/10`}
        >
          Delete
        </button>
        {mailto ? (
          <button
            type="button"
            onClick={() => void copyReplyTemplate()}
            className={`${actionBtn} border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10`}
          >
            Copy reply template
          </button>
        ) : null}
        <Link
          href="/admin/submissions"
          className={`${actionBtn} border-white/15 text-white/80 hover:bg-white/10`}
        >
          Back
        </Link>
      </div>

      <div className="admin-card mt-6 space-y-5 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white/90">Fields</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {Object.entries(row.fields).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{k}</dt>
              <dd className="mt-1 break-words text-sm text-white/90">{v || <span className="text-white/40">&mdash;</span>}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="admin-card mt-6 space-y-3 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white/90">Notes</h2>
        <textarea
          value={row.notes}
          onChange={(e) => setRow((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
          className="min-h-[140px] w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
          placeholder="Internal notes about this submission (only admins see this)."
        />
        <button
          type="button"
          onClick={() => void saveNote()}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          Save note
        </button>
      </div>
    </div>
  );
}
