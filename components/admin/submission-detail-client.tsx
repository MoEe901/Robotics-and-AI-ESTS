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

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Submission</h1>
      <p className="admin-page-subtitle">
        {row.formId} - {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void setStatus("read")} className="rounded border border-white/20 px-3 py-1 text-sm">Mark read</button>
        <button type="button" onClick={() => void setStatus("archived")} className="rounded border border-white/20 px-3 py-1 text-sm">Archive</button>
        <button type="button" onClick={() => void remove()} className="rounded border border-rose-400/30 px-3 py-1 text-sm text-rose-300">Delete</button>
        {mailto ? (
          <button type="button" onClick={() => void copyReplyTemplate()} className="rounded border border-cyan-400/30 px-3 py-1 text-sm text-cyan-300">
            Copy reply template
          </button>
        ) : null}
        <Link href="/admin/submissions" className="rounded border border-white/15 px-3 py-1 text-sm">Back</Link>
      </div>

      <div className="admin-card mt-4 space-y-3">
        {Object.entries(row.fields).map(([k, v]) => (
          <div key={k}>
            <p className="text-xs uppercase tracking-wide text-white/50">{k}</p>
            <p className="text-sm text-white/90">{v}</p>
          </div>
        ))}
      </div>

      <div className="admin-card mt-4">
        <p className="text-sm text-white/75">Notes</p>
        <textarea value={row.notes} onChange={(e) => setRow((prev) => (prev ? { ...prev, notes: e.target.value } : prev))} className="mt-2 min-h-[120px] w-full rounded border border-white/15 bg-black/20 p-2 text-sm" />
        <button type="button" onClick={() => void saveNote()} className="mt-2 rounded border border-white/20 px-3 py-1 text-sm">Save note</button>
      </div>
    </div>
  );
}
