"use client";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/firebase";

const DOC_ID = "submissionNotifications";
const MAX = 12;

function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function normalizeList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const e = x.trim().toLowerCase();
    if (!isValidEmail(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(e);
    if (out.length >= MAX) break;
  }
  return out;
}

export default function AdminNotificationsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db(), "siteConfig", DOC_ID);
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.exists() ? normalizeList(snap.data().applyFormRecipientEmails) : [];
        setEmails(next);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
  }, []);

  const persist = useCallback(async (next: string[]) => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(
        doc(db(), "siteConfig", DOC_ID),
        { applyFormRecipientEmails: next },
        { merge: true },
      );
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }, []);

  const addEmail = () => {
    const e = input.trim().toLowerCase();
    setInput("");
    if (!isValidEmail(e)) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (emails.includes(e)) {
      setMessage("That address is already listed.");
      return;
    }
    if (emails.length >= MAX) {
      setMessage(`You can add at most ${MAX} addresses.`);
      return;
    }
    void persist([...emails, e]);
  };

  const removeAt = (idx: number) => {
    const next = emails.filter((_, i) => i !== idx);
    void persist(next);
  };

  return (
    <div className="admin-page">
      <span className="admin-eyebrow">Apply form</span>
      <h1 className="admin-page-title mt-3">Submission email recipients</h1>
      <p className="admin-page-subtitle">
        When someone submits the Apply form, a copy is sent to each address below (via Resend). If this list is
        empty, the server falls back to <span className="font-mono text-white/80">ADMIN_NOTIFICATION_EMAIL</span>{" "}
        when set.
      </p>

      {!loaded ? (
        <p className="mt-8 text-sm text-white/55">Loading…</p>
      ) : (
        <div className="mt-8 max-w-xl space-y-6">
          <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            {emails.length === 0 ? (
              <li className="text-sm text-white/50">No addresses yet — only the env fallback will be used.</li>
            ) : (
              emails.map((e, i) => (
                <li
                  key={e}
                  className="flex items-center justify-between gap-3 text-sm text-white/90"
                >
                  <span className="truncate font-mono">{e}</span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    disabled={saving}
                    className="shrink-0 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-200/90 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/45">
                Add recipient
              </label>
              <input
                type="email"
                value={input}
                onChange={(ev) => setInput(ev.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
              />
            </div>
            <button
              type="button"
              onClick={addEmail}
              disabled={saving || !input.trim()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>

          {message ? (
            <p className="text-sm text-white/70" role="status">
              {message}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
