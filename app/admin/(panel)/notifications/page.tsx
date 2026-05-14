"use client";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import { useAdminSession } from "@/components/admin/admin-session-context";
import { db } from "@/lib/firebase";

/* ──────────────────────────────────────────────────────────
   Constants & helpers
   ────────────────────────────────────────────────────────── */
const DOC_ID = "submissionNotifications";
const MAX_RECIPIENTS = 12;

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
    if (out.length >= MAX_RECIPIENTS) break;
  }
  return out;
}

type Preset = { email: string; password: string; label: string };

/* ──────────────────────────────────────────────────────────
   Styles
   ────────────────────────────────────────────────────────── */
const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20";
const cardCls =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4";
const btnPrimary =
  "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
export default function AdminNotificationsPage() {
  const { session } = useAdminSession();
  const user = session && "user" in session ? session.user : null;

  /* ── Recipients state ── */
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [recipientsLoaded, setRecipientsLoaded] = useState(false);
  const [recipientsSaving, setRecipientsSaving] = useState(false);
  const [recipientsMsg, setRecipientsMsg] = useState<string | null>(null);

  /* ── Email settings state ── */
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [activeEmail, setActiveEmail] = useState("");
  const [activePassword, setActivePassword] = useState("");
  const [activePasswordMasked, setActivePasswordMasked] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [senderName, setSenderName] = useState("Robotics & AI Club");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Load recipients (realtime) ── */
  useEffect(() => {
    const ref = doc(db(), "siteConfig", DOC_ID);
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.exists()
          ? normalizeList(snap.data().applyFormRecipientEmails)
          : [];
        setEmails(next);
        setRecipientsLoaded(true);
      },
      () => setRecipientsLoaded(true),
    );
  }, []);

  /* ── Load email settings from API ── */
  const loadSettings = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/email-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load settings.");
      const data = await res.json();
      setEnabled(data.enabled !== false);
      setActiveEmail(data.activeEmail || "");
      setActivePasswordMasked(data.activePasswordMasked || "");
      setHasPassword(data.hasPassword || false);
      setSenderName(data.senderName || "Robotics & AI Club");
      setPresets(data.presets || []);
      setActivePassword("");
    } catch {
      setSettingsMsg("Could not load email settings.");
    } finally {
      setSettingsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  /* ── Recipients persist ── */
  const persistRecipients = useCallback(
    async (next: string[]) => {
      setRecipientsSaving(true);
      setRecipientsMsg(null);
      try {
        await setDoc(
          doc(db(), "siteConfig", DOC_ID),
          { applyFormRecipientEmails: next },
          { merge: true },
        );
        setRecipientsMsg("Saved.");
      } catch (e) {
        setRecipientsMsg(
          e instanceof Error ? e.message : "Could not save.",
        );
      } finally {
        setRecipientsSaving(false);
      }
    },
    [],
  );

  const addEmail = () => {
    const e = input.trim().toLowerCase();
    setInput("");
    if (!isValidEmail(e)) {
      setRecipientsMsg("Enter a valid email address.");
      return;
    }
    if (emails.includes(e)) {
      setRecipientsMsg("That address is already listed.");
      return;
    }
    if (emails.length >= MAX_RECIPIENTS) {
      setRecipientsMsg(`You can add at most ${MAX_RECIPIENTS} addresses.`);
      return;
    }
    void persistRecipients([...emails, e]);
  };

  const removeAt = (idx: number) => {
    void persistRecipients(emails.filter((_, i) => i !== idx));
  };

  /* ── Email settings save ── */
  const saveSettings = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setSettingsMsg(data.message || "Saved.");
      await loadSettings();
    } catch (e) {
      setSettingsMsg(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveActive = () => {
    const patch: Record<string, unknown> = {
      activeEmail: activeEmail.trim(),
      senderName: senderName.trim(),
      enabled,
    };
    if (activePassword.trim()) {
      patch.activePassword = activePassword.trim();
    }
    void saveSettings(patch);
  };

  const handleSaveAndAddPreset = () => {
    const patch: Record<string, unknown> = {
      activeEmail: activeEmail.trim(),
      senderName: senderName.trim(),
      enabled,
      saveToPresets: true,
    };
    if (activePassword.trim()) {
      patch.activePassword = activePassword.trim();
    }
    void saveSettings(patch);
  };

  const handleActivatePreset = (idx: number) => {
    void saveSettings({ action: "activate-preset", presetIndex: idx });
  };

  const handleDeletePreset = async (idx: number) => {
    if (!user) return;
    // We need to get the actual presets from server (with real passwords), remove one, and save
    // Since we only have masked passwords, we use a special delete action
    const token = await user.getIdToken();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deletePresetIndex: idx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setSettingsMsg("Preset removed.");
      await loadSettings();
    } catch (e) {
      setSettingsMsg(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Notifications & Email
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Configure the sender email account, manage saved presets, set
          recipient addresses, and enable or disable all email notifications.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* ═══════════════════════════════════════════
            Section 1: Email sender settings
            ═══════════════════════════════════════════ */}
        <div className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
              Sender account (Gmail SMTP)
            </p>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Get App Password →
            </a>
          </div>

          {/* Enable / disable toggle */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/30"
            />
            <span>
              <span className="block text-sm font-medium text-white">
                Email notifications enabled
              </span>
              <span className="block text-[11px] text-white/50">
                When off, no emails will be sent even if credentials are set.
                Turn this off to pause all notifications without removing your
                account.
              </span>
            </span>
          </label>

          {!settingsLoaded ? (
            <p className="text-sm text-white/55">Loading settings…</p>
          ) : (
            <>
              <label className="block text-sm">
                <span className="text-white/70">Sender display name</span>
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Robotics & AI Club"
                  className={inputCls}
                />
                <span className="mt-1 block text-[11px] text-white/40">
                  The name that appears in the &quot;From&quot; field of
                  outgoing emails.
                </span>
              </label>

              <label className="block text-sm">
                <span className="text-white/70">Gmail address</span>
                <input
                  type="email"
                  value={activeEmail}
                  onChange={(e) => setActiveEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className={inputCls}
                />
              </label>

              <label className="block text-sm">
                <span className="text-white/70">
                  App Password{" "}
                  {hasPassword && !activePassword ? (
                    <span className="font-mono text-emerald-400/70">
                      (set: {activePasswordMasked})
                    </span>
                  ) : null}
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={activePassword}
                    onChange={(e) => setActivePassword(e.target.value)}
                    placeholder={
                      hasPassword
                        ? "Leave empty to keep current password"
                        : "Paste your 16-character app password"
                    }
                    className={inputCls + " pr-16"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] uppercase tracking-wider text-white/50 hover:text-white/80"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <span className="mt-1 block text-[11px] text-white/40">
                  Generate one at{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400/80 underline"
                  >
                    myaccount.google.com/apppasswords
                  </a>{" "}
                  (requires 2-Step Verification).
                </span>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveActive}
                  disabled={settingsSaving || !activeEmail.trim()}
                  className={btnPrimary}
                >
                  {settingsSaving ? "Saving…" : "Save settings"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndAddPreset}
                  disabled={
                    settingsSaving ||
                    !activeEmail.trim() ||
                    (!activePassword.trim() && !hasPassword)
                  }
                  className={btnOutline}
                  title="Save current settings and add to saved presets"
                >
                  Save & add to presets
                </button>
              </div>
            </>
          )}

          {settingsMsg ? (
            <p
              className={`rounded-xl border px-4 py-3 text-sm ${
                settingsMsg.toLowerCase().includes("fail") ||
                settingsMsg.toLowerCase().includes("error") ||
                settingsMsg.toLowerCase().includes("could not")
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
              }`}
            >
              {settingsMsg}
            </p>
          ) : null}
        </div>

        {/* ═══════════════════════════════════════════
            Section 2: Saved presets
            ═══════════════════════════════════════════ */}
        <div className={cardCls}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
            Saved email presets
          </p>
          <p className="text-[11px] text-white/40">
            Previously used sender accounts. Click &quot;Use&quot; to switch
            to a saved preset instantly.
          </p>

          {presets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/50">
              No saved presets yet. Use &quot;Save &amp; add to presets&quot;
              above to save the current sender account for later.
            </p>
          ) : (
            <div className="space-y-2">
              {presets.map((p, i) => (
                <div
                  key={`preset-${i}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    {p.label ? (
                      <p className="text-xs font-medium text-white/70">
                        {p.label}
                      </p>
                    ) : null}
                    <p className="truncate font-mono text-sm text-white/90">
                      {p.email}
                    </p>
                    <p className="font-mono text-[11px] text-white/40">
                      {p.password}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleActivatePreset(i)}
                      disabled={settingsSaving}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePreset(i)}
                      disabled={settingsSaving}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            Section 3: Recipient addresses
            ═══════════════════════════════════════════ */}
        <div className={cardCls}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
            Notification recipients
          </p>
          <p className="text-[11px] text-white/40">
            When someone submits the Apply form, a notification email is sent
            to each address below.
          </p>

          {!recipientsLoaded ? (
            <p className="text-sm text-white/55">Loading…</p>
          ) : (
            <>
              <ul className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4">
                {emails.length === 0 ? (
                  <li className="text-sm text-white/50">
                    No recipient addresses yet.
                  </li>
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
                        disabled={recipientsSaving}
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
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") {
                        ev.preventDefault();
                        addEmail();
                      }
                    }}
                    placeholder="name@example.com"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  onClick={addEmail}
                  disabled={recipientsSaving || !input.trim()}
                  className={btnPrimary}
                >
                  {recipientsSaving ? "Saving…" : "Add"}
                </button>
              </div>

              {recipientsMsg ? (
                <p className="text-sm text-white/70" role="status">
                  {recipientsMsg}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
