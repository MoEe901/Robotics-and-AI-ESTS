"use client";

import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { auth, db } from "@/lib/firebase";

const ROLES = ["admin", "editor", "moderator", "viewer"] as const;
type Role = (typeof ROLES)[number];

type AdminUserRow = {
  id: string;
  email: string;
  role: Role;
  active: boolean;
};

function toRow(id: string, raw: Record<string, unknown>): AdminUserRow {
  const roleRaw = typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "viewer";
  const role = (ROLES as readonly string[]).includes(roleRaw) ? (roleRaw as Role) : "viewer";
  return {
    id,
    email: typeof raw.email === "string" ? raw.email : "",
    role,
    active: raw.active !== false,
  };
}

export default function AdminAccessPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [active, setActive] = useState(true);
  const [currentUid, setCurrentUid] = useState<string>("");
  const [currentEmail, setCurrentEmail] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), (u) => {
      setCurrentUid(u?.uid ?? "");
      setCurrentEmail(u?.email ?? "");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db(), "adminUsers"),
      (snap) => {
        const next = snap.docs
          .map((d) => toRow(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => a.id.localeCompare(b.id));
        setRows(next);
        setLoaded(true);
      },
      (error) => {
        setLoaded(true);
        setMessage(error.message);
      },
    );
    return () => unsub();
  }, []);

  const canCreate = useMemo(() => uid.trim().length > 0 && !savingId, [uid, savingId]);

  async function upsertUser(targetUid: string, payload: Omit<AdminUserRow, "id">) {
    setSavingId(targetUid);
    setMessage(null);
    try {
      await setDoc(
        doc(db(), "adminUsers", targetUid),
        {
          role: payload.role,
          active: payload.active,
          email: payload.email.trim(),
        },
        { merge: true },
      );
      setMessage("Saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate() {
    const targetUid = uid.trim();
    if (!targetUid) return;
    await upsertUser(targetUid, { role, active, email: email.trim() });
    setUid("");
    setEmail("");
    setRole("viewer");
    setActive(true);
  }

  async function removeUser(targetUid: string) {
    setSavingId(targetUid);
    setMessage(null);
    try {
      await deleteDoc(doc(db(), "adminUsers", targetUid));
      setMessage("User removed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to remove user.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="admin-page">
      <span className="admin-eyebrow">Access control</span>
      <h1 className="admin-page-title mt-3">Users & roles</h1>
      <p className="admin-page-subtitle">
        Manage <span className="font-mono text-white/80">adminUsers</span> directly from the admin shell. Use each
        person&apos;s Firebase Auth <span className="font-mono text-white/80">uid</span> as document ID.
      </p>
      <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
        <p>
          Current signed-in account:{" "}
          <span className="font-mono text-cyan-200">{currentEmail || "unknown"}</span>
        </p>
        <p>
          Current UID:{" "}
          <span className="font-mono text-cyan-200">{currentUid || "not signed in"}</span>
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Add / invite user</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs text-white/60">
            UID (document ID)
            <input
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="firebase-auth-uid"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
          </label>
          <label className="text-xs text-white/60">
            Email (optional)
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            />
          </label>
          <label className="text-xs text-white/60">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-white/80">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5"
            />
            Active
          </label>
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={!canCreate}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create / update user
        </button>
        <button
          type="button"
          onClick={() => {
            if (!currentUid) return;
            setUid(currentUid);
            if (currentEmail) setEmail(currentEmail);
          }}
          disabled={!currentUid || Boolean(savingId)}
          className="ml-2 mt-4 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use my UID
        </button>
        {uid.trim() && currentUid && uid.trim() !== currentUid ? (
          <p className="mt-3 text-xs text-amber-200/90">
            You are provisioning a different UID than the currently signed-in user.
          </p>
        ) : null}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Current users</h2>
        {!loaded ? <p className="mt-3 text-sm text-white/60">Loading users…</p> : null}
        {loaded && rows.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">No users yet. Add the first one above.</p>
        ) : null}
        <div className="mt-4 space-y-3">
          {rows.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-white/10 bg-black/20 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-cyan-300">{u.id}</p>
                <button
                  type="button"
                  onClick={() => void removeUser(u.id)}
                  disabled={savingId === u.id}
                  className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-200/90 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="text-xs text-white/60">
                  Email
                  <input
                    value={u.email}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) => (x.id === u.id ? { ...x, email: e.target.value } : x)),
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Role
                  <select
                    value={u.role}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) => (x.id === u.id ? { ...x, role: e.target.value as Role } : x)),
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-slate-900 text-white">
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
                      setRows((prev) =>
                        prev.map((x) => (x.id === u.id ? { ...x, active: e.target.checked } : x)),
                      )
                    }
                    className="size-4 rounded border-white/20 bg-white/5"
                  />
                  Active
                </label>
              </div>
              <button
                type="button"
                onClick={() => void upsertUser(u.id, { email: u.email, role: u.role, active: u.active })}
                disabled={Boolean(savingId)}
                className="mt-3 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          ))}
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-white/70">{message}</p> : null}

      <p className="mt-6 text-sm text-white/60">
        Legacy full access (email allowlist) still applies for accounts in{" "}
        <span className="font-mono text-white/80">NEXT_PUBLIC_ADMIN_EMAILS</span>.
      </p>
      <p className="mt-3 text-sm text-white/60">
        <Link href="/admin/dashboard" className="text-blue-300 hover:text-blue-200">
          ← Dashboard
        </Link>
      </p>
    </div>
  );
}
