"use client";

import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";

type DocData = {
  formId: string;
  fields: Record<string, string>;
  status: "new" | "read" | "archived";
  submittedAt: string;
  notes: string;
};

/* ── template helpers ─────────────────────────────────────── */

function buildReviewTemplate(name: string) {
  return [
    `Dear ${name},`,
    "",
    "Thank you for submitting your application to the Robotics & AI Club. We would like to confirm that we have received it successfully.",
    "",
    "Our team is currently reviewing all applications. We will get back to you as soon as possible with an update on your status.",
    "",
    "If you have any questions in the meantime, please do not hesitate to reply to this email.",
    "",
    "Best regards,",
    "Robotics & AI Club",
    "EST Safi, Morocco",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    `Cher(e) ${name},`,
    "",
    "Nous vous remercions d'avoir soumis votre candidature au Club Robotique & IA. Nous confirmons que nous l'avons bien reçue.",
    "",
    "Notre équipe examine actuellement toutes les candidatures. Nous reviendrons vers vous dès que possible avec une mise à jour concernant votre statut.",
    "",
    "Si vous avez des questions entre-temps, n'hésitez pas à répondre à cet e-mail.",
    "",
    "Cordialement,",
    "Club Robotique & IA",
    "EST Safi, Maroc",
  ].join("\n");
}

function buildAcceptTemplate(name: string) {
  return [
    `Dear ${name},`,
    "",
    "We are delighted to inform you that your application to the Robotics & AI Club has been accepted! Welcome to the team.",
    "",
    "As a next step, please:",
    "  1. Join our communication channels (links will be shared during onboarding)",
    "  2. Attend the upcoming orientation session",
    "  3. Review the club charter available on our website",
    "",
    "We are excited to have you on board and look forward to building great things together.",
    "",
    "If you have any questions, feel free to reply to this email.",
    "",
    "Best regards,",
    "Robotics & AI Club",
    "EST Safi, Morocco",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    `Cher(e) ${name},`,
    "",
    "Nous avons le plaisir de vous informer que votre candidature au Club Robotique & IA a été acceptée ! Bienvenue dans l'équipe.",
    "",
    "Prochaines étapes :",
    "  1. Rejoignez nos canaux de communication (les liens seront partagés lors de l'intégration)",
    "  2. Participez à la prochaine session d'orientation",
    "  3. Consultez la charte du club disponible sur notre site web",
    "",
    "Nous sommes ravis de vous accueillir et avons hâte de construire de grandes choses ensemble.",
    "",
    "Si vous avez des questions, n'hésitez pas à répondre à cet e-mail.",
    "",
    "Cordialement,",
    "Club Robotique & IA",
    "EST Safi, Maroc",
  ].join("\n");
}

/* ── component ────────────────────────────────────────────── */

export function SubmissionDetailClient({ id }: { id: string }) {
  const [row, setRow] = useState<DocData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* template editor state */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<"review" | "accept">("review");
  const [editorSubject, setEditorSubject] = useState("");
  const [editorBody, setEditorBody] = useState("");

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

  const applicantName = useMemo(() => {
    if (!row) return "";
    const first = row.fields.firstName || "";
    const last = row.fields.lastName || "";
    if (first && last) return `${first} ${last}`;
    return row.fields.fullName || first || "Applicant";
  }, [row]);

  const applicantEmail = useMemo(() => row?.fields.email || "", [row]);

  /* open the editor with the right template pre-filled */
  const openEditor = useCallback(
    (kind: "review" | "accept") => {
      const name = applicantName.split(" ")[0] || "Applicant";
      setEditorKind(kind);
      if (kind === "review") {
        setEditorSubject("Application Received — Robotics & AI Club / Candidature reçue — Club Robotique & IA");
        setEditorBody(buildReviewTemplate(name));
      } else {
        setEditorSubject("Application Accepted — Robotics & AI Club / Candidature acceptée — Club Robotique & IA");
        setEditorBody(buildAcceptTemplate(name));
      }
      setEditorOpen(true);
    },
    [applicantName],
  );

  /* send: copy body + open mailto */
  function sendTemplate() {
    const mailto = `mailto:${applicantEmail}?subject=${encodeURIComponent(editorSubject)}&body=${encodeURIComponent(editorBody)}`;
    navigator.clipboard.writeText(editorBody).catch(() => {});
    window.open(mailto, "_blank");
    setEditorOpen(false);
  }

  async function setStatus(status: "read" | "archived") {
    try {
      await updateDoc(doc(db(), "submissions", id), {
        status,
        readAt: new Date(),
        notes: row?.notes || "",
      });
      setRow((prev) => (prev ? { ...prev, status } : prev));
    } catch (e) {
      console.error("[submission-detail] setStatus failed", e);
      setError(e instanceof Error ? e.message : "Failed to update status.");
    }
  }

  async function saveNote() {
    try {
      await updateDoc(doc(db(), "submissions", id), { notes: row?.notes || "" });
    } catch (e) {
      console.error("[submission-detail] saveNote failed", e);
      setError(e instanceof Error ? e.message : "Failed to save note.");
    }
  }

  async function remove() {
    if (!confirm("Delete this submission?")) return;
    try {
      await deleteDoc(doc(db(), "submissions", id));
      window.location.href = "/admin/submissions";
    } catch (e) {
      console.error("[submission-detail] remove failed", e);
      setError(e instanceof Error ? e.message : "Failed to delete submission.");
    }
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

        {applicantEmail ? (
          <>
            <button
              type="button"
              onClick={() => openEditor("review")}
              className={`${actionBtn} border-amber-400/30 text-amber-300 hover:bg-amber-500/10`}
            >
              Under review
            </button>
            <button
              type="button"
              onClick={() => openEditor("accept")}
              className={`${actionBtn} border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10`}
            >
              Accept
            </button>
          </>
        ) : null}

        <Link
          href="/admin/submissions"
          className={`${actionBtn} border-white/15 text-white/80 hover:bg-white/10`}
        >
          Back
        </Link>
      </div>

      {/* ── template editor modal ── */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-[#0d1117] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-base font-semibold text-white">
                {editorKind === "review" ? "Under Review Reply" : "Acceptance Reply"}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="text-white/50 hover:text-white/90"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block text-sm">
                <span className="text-white/60">To</span>
                <input
                  readOnly
                  value={applicantEmail}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Subject</span>
                <input
                  value={editorSubject}
                  onChange={(e) => setEditorSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/35"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Body — edit freely before sending</span>
                <textarea
                  value={editorBody}
                  onChange={(e) => setEditorBody(e.target.value)}
                  rows={18}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 p-3 font-mono text-[13px] leading-relaxed text-white outline-none focus:border-white/35"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendTemplate}
                className={`rounded-lg px-5 py-2 text-sm font-medium text-white ${
                  editorKind === "review"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                Copy &amp; open mail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── fields ── */}
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

      {/* ── notes ── */}
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
