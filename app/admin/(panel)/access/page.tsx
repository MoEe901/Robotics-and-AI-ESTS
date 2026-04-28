"use client";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { auth, db } from "@/lib/firebase";

// ─── Role definitions ────────────────────────────────────────────────────────

const ROLES = ["admin", "editor", "moderator", "viewer"] as const;
type Role = (typeof ROLES)[number];

const ROLE_META: Record<Role, { color: string; description: string }> = {
  admin: {
    color: "bg-red-500/20 text-red-300 border border-red-500/30",
    description:
      "Full access — all pages, settings, and user management.",
  },
  editor: {
    color: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    description:
      "Edit content, teams, events, and pages. " +
      "No access to layout, access panel, or submissions.",
  },
  moderator: {
    color: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    description: "Dashboard and form submissions only.",
  },
  viewer: {
    color: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    description: "Read-only access to the dashboard only.",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminUserRow = {
  id: string;
  email: string;
  role: Role;
  active: boolean;
  updatedAt?: string;
  dirty?: boolean;
};

type InviteResult = {
  uid: string;
  email: string;
  isNewUser: boolean;
  inviteSent: boolean;
  inviteLink?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRow(id: string, raw: Record<string, unknown>): AdminUserRow {
  const roleRaw =
    typeof raw.role === "string"
      ? raw.role.trim().toLowerCase()
      : "viewer";
  const role = (ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as Role)
    : "viewer";
  let updatedAt: string | undefined;
  const ts = raw.updatedAt as { toDate?: () => Date } | null;
  if (ts && typeof ts.toDate === "function") {
    updatedAt = ts.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return {
    id,
    email: typeof raw.email === "string" ? raw.email : "",
    role,
    active: raw.active !== false,
    updatedAt,
  };
}

// ─── Small reusable components ────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 " +
        "text-[11px] font-semibold " +
        ROLE_META[role].color
      }
    >
      {role}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className={
        "ml-1 rounded px-1.5 py-0.5 text-[10px] transition " +
        "text-white/40 hover:bg-white/10 hover:text-white/80"
      }
    >
      {copied ? "✓" : "copy"}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAccessPage() {
  // Server-truth rows
  const [serverRows, setServerRows] = useState<AdminUserRow[]>([]);
  // Display rows — merges server data with unsaved local edits
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Create-form fields
  const [newUid, setNewUid] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("viewer");
  const [newActive, setNewActive] = useState(true);

  // Signed-in user info
  const [currentUid, setCurrentUid] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  // Filter/search
  const [filterRole, setFilterRole] = useState<Role | "all">("all");
  const [search, setSearch] = useState("");

  // Role legend visibility
  const [showLegend, setShowLegend] = useState(false);

  // Email-to-UID lookup
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Invite-by-email
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviteActive, setInviteActive] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<
    InviteResult | { error: string } | null
  >(null);

  // Resend invite per-row
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendLinks, setResendLinks] = useState<
    Record<string, { link?: string; error?: string }>
  >({});

  // ── Sync custom claim for a UID ──────────────────────────────────────────
  // Sets adminRole custom claim via Admin SDK so Firestore list rules work.
  // After syncing the CALLER's own claim, force-refreshes the ID token so
  // the new claim is active immediately without waiting for auto-refresh.
  async function syncClaim(
    targetUid: string,
    isSelf = false,
  ): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) return;
      const token = await getIdToken(user);
      await fetch("/api/admin/set-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUid }),
      });
      // If we just synced our own claim, force-refresh the token so the new
      // claim is included in all subsequent Firestore rule evaluations.
      if (isSelf) {
        await getIdToken(user, /* forceRefresh */ true);
      }
    } catch {
      // Non-fatal — page will still work, list may show permissions error
      // until token auto-refreshes (≤ 1 hour).
    }
  }

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), (u) => {
      setCurrentUid(u?.uid ?? "");
      setCurrentEmail(u?.email ?? "");
      // Bootstrap custom claim for the signed-in user on every auth state
      // change so the adminUsers list rule passes immediately.
      if (u?.uid) void syncClaim(u.uid, /* isSelf */ true);
    });
    return () => unsub();
  }, []);

  // ── Firestore listener ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db(), "adminUsers"),
      (snap) => {
        const next = snap.docs
          .map((d) =>
            toRow(d.id, d.data() as Record<string, unknown>),
          )
          .sort((a, b) => a.id.localeCompare(b.id));
        setServerRows(next);
        // Preserve local dirty edits when server pushes an update
        setRows((prev) =>
          next.map((serverRow) => {
            const local = prev.find((r) => r.id === serverRow.id);
            return local?.dirty ? local : serverRow;
          }),
        );
        setLoaded(true);
      },
      (error) => {
        setLoaded(true);
        setMessage(error.message);
      },
    );
    return () => unsub();
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────
  const activeCount = useMemo(
    () => serverRows.filter((r) => r.active).length,
    [serverRows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((u) => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        u.id.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [rows, filterRole, search]);

  const canCreate = newUid.trim().length > 0 && !savingId;

  // ── Email-to-UID lookup ──────────────────────────────────────────────────
  async function handleLookup() {
    const email = lookupEmail.trim().toLowerCase();
    if (!email) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("Not signed in.");
      const token = await getIdToken(user);
      const res = await fetch(
        `/api/admin/lookup-user?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = (await res.json()) as {
        uid?: string;
        email?: string;
        displayName?: string | null;
        error?: string;
      };
      if (!res.ok || !json.uid) {
        setLookupError(json.error ?? "Lookup failed.");
        return;
      }
      // Auto-fill the create form
      setNewUid(json.uid);
      setNewEmail(json.email ?? email);
      setLookupEmail("");
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Lookup failed.",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  // ── Invite by email ──────────────────────────────────────────────────────
  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("Not signed in.");
      const token = await getIdToken(user);
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
          active: inviteActive,
        }),
      });
      const json = (await res.json()) as
        | InviteResult
        | { error: string };
      if (!res.ok || "error" in json) {
        setInviteResult({
          error:
            "error" in json ? json.error : "Invite failed.",
        });
        return;
      }
      setInviteResult(json);
      // Reset form on success
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteActive(true);
    } catch (err) {
      setInviteResult({
        error: err instanceof Error ? err.message : "Invite failed.",
      });
    } finally {
      setInviteLoading(false);
    }
  }

  // ── Resend invite ────────────────────────────────────────────────────────
  async function handleResendInvite(targetEmail: string, targetUid: string) {
    if (!targetEmail) return;
    setResendingId(targetUid);
    setResendLinks((prev) => ({ ...prev, [targetUid]: {} }));
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("Not signed in.");
      const token = await getIdToken(user);
      const res = await fetch("/api/admin/resend-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: targetEmail }),
      });
      const json = (await res.json()) as { link?: string; error?: string };
      if (!res.ok || !json.link) {
        setResendLinks((prev) => ({
          ...prev,
          [targetUid]: { error: json.error ?? "Failed to generate link." },
        }));
        return;
      }
      setResendLinks((prev) => ({
        ...prev,
        [targetUid]: { link: json.link },
      }));
    } catch (err) {
      setResendLinks((prev) => ({
        ...prev,
        [targetUid]: {
          error: err instanceof Error ? err.message : "Failed.",
        },
      }));
    } finally {
      setResendingId(null);
    }
  }

  // ── Local edit helper ────────────────────────────────────────────────────
  function updateLocal(
    id: string,
    patch: Partial<Omit<AdminUserRow, "id">>,
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...patch, dirty: true } : r,
      ),
    );
  }

  // ── Upsert (create or update) ────────────────────────────────────────────
  async function upsertUser(
    targetUid: string,
    payload: Omit<AdminUserRow, "id" | "dirty" | "updatedAt">,
  ) {
    setSavingId(targetUid);
    setMessage(null);
    try {
      await setDoc(
        doc(db(), "adminUsers", targetUid),
        {
          role: payload.role,
          active: payload.active,
          email: payload.email.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      // Clear dirty flag — server will echo the write back via onSnapshot
      setRows((prev) =>
        prev.map((r) =>
          r.id === targetUid ? { ...r, dirty: false } : r,
        ),
      );
      setMessage("Saved.");
      // Sync custom claim for the saved user so Firestore list rules stay
      // current. Also refresh own token if we just updated our own role.
      const isSelf = targetUid === currentUid;
      void syncClaim(targetUid, isSelf);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save.",
      );
    } finally {
      setSavingId(null);
    }
  }

  // ── Create handler ───────────────────────────────────────────────────────
  async function handleCreate() {
    const targetUid = newUid.trim();
    if (!targetUid) return;
    await upsertUser(targetUid, {
      role: newRole,
      active: newActive,
      email: newEmail.trim(),
    });
    setNewUid("");
    setNewEmail("");
    setNewRole("viewer");
    setNewActive(true);
  }

  // ── Remove handler (guarded) ─────────────────────────────────────────────
  async function removeUser(targetUid: string, userEmail: string) {
    // Self-lockout guard
    if (targetUid === currentUid) {
      setMessage(
        "You cannot remove your own account from this panel.",
      );
      return;
    }
    // Confirmation dialog
    const label = userEmail.trim() || targetUid;
    const confirmed = window.confirm(
      `Remove admin access for "${label}"?\n\n` +
        "This deletes their adminUsers document. " +
        "They will lose all access on their next page load.",
    );
    if (!confirmed) return;

    setSavingId(targetUid);
    setMessage(null);
    try {
      await deleteDoc(doc(db(), "adminUsers", targetUid));
      setMessage("User removed.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to remove user.",
      );
    } finally {
      setSavingId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      <span className="admin-eyebrow">Access control</span>
      <h1 className="admin-page-title mt-3">Users &amp; roles</h1>
      <p className="admin-page-subtitle">
        Manage{" "}
        <span className="font-mono text-white/80">adminUsers</span>{" "}
        directly from this panel. Use each person&apos;s Firebase Auth{" "}
        <span className="font-mono text-white/80">uid</span> as the
        document ID.
      </p>

      {/* ── Signed-in user banner ── */}
      <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
        <p>
          Signed in as{" "}
          <span className="font-mono text-cyan-200">
            {currentEmail || "unknown"}
          </span>
        </p>
        <p className="mt-0.5">
          UID:{" "}
          <span className="font-mono text-cyan-200">
            {currentUid || "not signed in"}
          </span>
          {currentUid && <CopyButton text={currentUid} />}
        </p>
      </div>

      {/* ── Role legend ── */}
      <button
        type="button"
        onClick={() => setShowLegend((v) => !v)}
        className="mt-4 text-xs text-blue-300 underline underline-offset-2 hover:text-blue-200"
      >
        {showLegend ? "Hide role legend" : "Show role legend"}
      </button>
      {showLegend && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div
              key={r}
              className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <RoleBadge role={r} />
              <p className="text-xs leading-relaxed text-white/60">
                {ROLE_META[r].description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Invite by email ── */}
      <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">
          Invite user by email
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Creates a Firebase Auth account, assigns the chosen role, and
          sends the user a &quot;Set your password&quot; link by email —
          no Firebase Console needed.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-white/60 sm:col-span-2">
            Email address
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleInvite();
              }}
              placeholder="name@example.com"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
          </label>
          <label className="text-xs text-white/60">
            Role
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as Role)
              }
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            >
              {ROLES.map((r) => (
                <option
                  key={r}
                  value={r}
                  className="bg-slate-900 text-white"
                >
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={inviteActive}
              onChange={(e) => setInviteActive(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5"
            />
            Active immediately
          </label>
          <button
            type="button"
            onClick={() => void handleInvite()}
            disabled={!inviteEmail.trim() || inviteLoading}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviteLoading ? "Sending invite..." : "Send invite"}
          </button>
        </div>

        {/* Invite result */}
        {inviteResult && !("error" in inviteResult) && (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-3 text-xs">
            <p className="font-semibold text-green-300">
              {inviteResult.isNewUser
                ? "Account created"
                : "Role updated"}
              {" — "}
              <span className="font-mono">{inviteResult.email}</span>
            </p>
            <p className="mt-1 text-white/60">
              UID:{" "}
              <span className="font-mono text-white/80">
                {inviteResult.uid}
              </span>
              <CopyButton text={inviteResult.uid} />
            </p>
            {inviteResult.isNewUser && (
              <p className="mt-1 text-white/60">
                {inviteResult.inviteSent
                  ? "Invite email sent with password-set link."
                  : "Account created but email not sent (RESEND not configured)."}
                {!inviteResult.inviteSent &&
                  inviteResult.inviteLink && (
                    <span>
                      {" "}
                      Share this link manually:{" "}
                      <a
                        href={inviteResult.inviteLink}
                        className="break-all text-blue-300 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {inviteResult.inviteLink}
                      </a>
                    </span>
                  )}
              </p>
            )}
          </div>
        )}
        {inviteResult && "error" in inviteResult && (
          <p className="mt-3 text-xs text-red-300/90">
            {inviteResult.error}
          </p>
        )}
      </div>

      {/* ── Add / update user form ── */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">
          Manual entry
        </h2>
        <p className="mt-1 text-xs text-white/40">
          For users who already have a Firebase Auth account.
          Paste their UID directly to provision or update their role.
        </p>

        {/* Email lookup helper */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <p className="text-xs font-medium text-white/70">
            Find UID by email
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">
            Looks up a Firebase Auth account and auto-fills the form below.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={lookupEmail}
              onChange={(e) => {
                setLookupEmail(e.target.value);
                setLookupError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLookup();
              }}
              placeholder="name@example.com"
              type="email"
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void handleLookup()}
              disabled={!lookupEmail.trim() || lookupLoading}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lookupLoading ? "Looking up..." : "Look up"}
            </button>
          </div>
          {lookupError && (
            <p className="mt-2 text-xs text-red-300/90">
              {lookupError}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs text-white/60">
            Firebase Auth UID
            <input
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              placeholder="firebase-auth-uid"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
          </label>
          <label className="text-xs text-white/60">
            Email{" "}
            <span className="text-white/30">(label only — not used for auth)</span>
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
          </label>
          <label className="text-xs text-white/60">
            Role
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            >
              {ROLES.map((r) => (
                <option
                  key={r}
                  value={r}
                  className="bg-slate-900 text-white"
                >
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-white/80">
            <input
              type="checkbox"
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5"
            />
            Active
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!canCreate}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create / update user
          </button>
          <button
            type="button"
            onClick={() => {
              if (!currentUid) return;
              setNewUid(currentUid);
              if (currentEmail) setNewEmail(currentEmail);
            }}
            disabled={!currentUid || Boolean(savingId)}
            className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Use my UID
          </button>
        </div>
        {newUid.trim() &&
          currentUid &&
          newUid.trim() !== currentUid && (
            <p className="mt-3 text-xs text-amber-200/90">
              You are provisioning a different UID than your own.
            </p>
          )}
      </div>

      {/* ── Current users list ── */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        {/* List header + filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">
            Current users
            {loaded && (
              <span className="ml-2 text-xs font-normal text-white/40">
                {activeCount} active / {serverRows.length} total
              </span>
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or UID..."
              className="w-44 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
            <select
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value as Role | "all")
              }
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            >
              <option value="all" className="bg-slate-900">
                All roles
              </option>
              {ROLES.map((r) => (
                <option
                  key={r}
                  value={r}
                  className="bg-slate-900"
                >
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty states */}
        {!loaded && (
          <p className="mt-3 text-sm text-white/60">
            Loading users...
          </p>
        )}
        {loaded && serverRows.length === 0 && (
          <p className="mt-3 text-sm text-white/60">
            No users yet. Add the first one above.
          </p>
        )}
        {loaded &&
          serverRows.length > 0 &&
          filteredRows.length === 0 && (
            <p className="mt-3 text-sm text-white/60">
              No users match the current filter.
            </p>
          )}

        {/* User rows */}
        <div className="mt-4 space-y-3">
          {filteredRows.map((u) => {
            const isSelf = u.id === currentUid;
            return (
              <div
                key={u.id}
                className={
                  "rounded-xl border p-3 transition " +
                  (u.dirty
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-white/10 bg-black/20")
                }
              >
                {/* Row header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <RoleBadge role={u.role} />
                    <p className="truncate font-mono text-xs text-cyan-300">
                      {u.id}
                    </p>
                    <CopyButton text={u.id} />
                    {isSelf && (
                      <span className="rounded-full border border-white/20 px-1.5 py-0.5 text-[10px] text-white/50">
                        you
                      </span>
                    )}
                    {u.dirty && (
                      <span className="text-[10px] text-amber-300/80">
                        unsaved
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeUser(u.id, u.email)}
                    disabled={savingId === u.id || isSelf}
                    title={
                      isSelf
                        ? "You cannot remove your own account"
                        : "Remove this user"
                    }
                    className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-200/90 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>

                {/* Email + last updated */}
                {u.email && (
                  <p className="mt-1.5 text-xs text-white/50">
                    {u.email}
                  </p>
                )}
                {u.updatedAt && (
                  <p className="mt-0.5 text-[10px] text-white/30">
                    Last updated {u.updatedAt}
                  </p>
                )}

                {/* Edit fields */}
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="text-xs text-white/60">
                    Email
                    <input
                      value={u.email}
                      onChange={(e) =>
                        updateLocal(u.id, { email: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    Role
                    <select
                      value={u.role}
                      onChange={(e) =>
                        updateLocal(u.id, {
                          role: e.target.value as Role,
                        })
                      }
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
                    >
                      {ROLES.map((r) => (
                        <option
                          key={r}
                          value={r}
                          className="bg-slate-900 text-white"
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 self-end text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={u.active}
                      onChange={(e) =>
                        updateLocal(u.id, { active: e.target.checked })
                      }
                      className="size-4 rounded border-white/20 bg-white/5"
                    />
                    Active
                  </label>
                </div>

                {/* Save + resend row */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void upsertUser(u.id, {
                        email: u.email,
                        role: u.role,
                        active: u.active,
                      })
                    }
                    disabled={Boolean(savingId) || !u.dirty}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingId === u.id ? "Saving..." : "Save changes"}
                  </button>
                  {u.email && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleResendInvite(u.email, u.id)
                      }
                      disabled={resendingId === u.id}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {resendingId === u.id
                        ? "Generating..."
                        : "Get invite link"}
                    </button>
                  )}
                </div>

                {/* Resend result */}
                {resendLinks[u.id] && (
                  <div className="mt-2">
                    {resendLinks[u.id].link ? (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs">
                        <p className="text-green-300 font-medium mb-1">
                          Password-set link (expires in 1 hour):
                        </p>
                        <a
                          href={resendLinks[u.id].link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-blue-300 underline"
                        >
                          {resendLinks[u.id].link}
                        </a>
                        <CopyButton text={resendLinks[u.id].link!} />
                      </div>
                    ) : (
                      <p className="text-xs text-red-300/90">
                        {resendLinks[u.id].error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status message */}
      {message && (
        <p className="mt-4 text-sm text-white/70">{message}</p>
      )}

      <p className="mt-6 text-sm text-white/60">
        Admin access is managed exclusively through this panel. All
        roles are enforced via the{" "}
        <span className="font-mono text-white/80">adminUsers</span>{" "}
        Firestore collection.
      </p>
      <p className="mt-3 text-sm text-white/60">
        <Link
          href="/admin/dashboard"
          className="text-blue-300 hover:text-blue-200"
        >
          Dashboard
        </Link>
      </p>
    </div>
  );
}
