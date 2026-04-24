"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowDown, ArrowUp, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_LOCKED,
  DEFAULT_ADMIN_SHELL_CONFIG,
  type AdminNavItem,
} from "@/components/admin/admin-shell";
import { db } from "@/lib/firebase";

export function AdminShellConfigClient() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ADMIN_SHELL_CONFIG.order);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    DEFAULT_ADMIN_SHELL_CONFIG.visibility,
  );
  const [showViewSite, setShowViewSite] = useState(DEFAULT_ADMIN_SHELL_CONFIG.showViewSite);
  const [showThemeToggle, setShowThemeToggle] = useState(
    DEFAULT_ADMIN_SHELL_CONFIG.showThemeToggle,
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const snap = await getDoc(doc(db(), "siteConfig", "adminShell"));
      if (!snap.exists()) return;
      const r = snap.data() as Record<string, unknown>;
      const rawOrder = Array.isArray(r.order)
        ? (r.order.filter((x) => typeof x === "string") as string[])
        : [];
      const known = new Set(ADMIN_NAV_ITEMS.map((i) => i.href));
      const merged = [
        ...rawOrder.filter((h) => known.has(h)),
        ...ADMIN_NAV_ITEMS.map((i) => i.href).filter((h) => !rawOrder.includes(h)),
      ];
      setOrder(merged);
      const vr =
        r.visibility && typeof r.visibility === "object"
          ? (r.visibility as Record<string, unknown>)
          : {};
      setVisibility(
        Object.fromEntries(ADMIN_NAV_ITEMS.map((i) => [i.href, vr[i.href] !== false])),
      );
      if (typeof r.showViewSite === "boolean") setShowViewSite(r.showViewSite);
      if (typeof r.showThemeToggle === "boolean") setShowThemeToggle(r.showThemeToggle);
    })();
  }, []);

  const byHref = useMemo(() => new Map(ADMIN_NAV_ITEMS.map((i) => [i.href, i])), []);

  function move(i: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[i]!;
      next[i] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await setDoc(
        doc(db(), "siteConfig", "adminShell"),
        { order, visibility, showViewSite, showThemeToggle },
        { merge: true },
      );
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  const hiddenCount = order.filter(
    (h) => !ADMIN_NAV_LOCKED.has(h) && visibility[h] === false,
  ).length;

  return (
    <section className="admin-page">
      <h1 className="admin-page-title">Admin sidebar</h1>
      <p className="admin-page-subtitle">
        Choose which admin sections appear in the left sidebar and in what order. Dashboard
        and Layout are locked so you can always get back here.
      </p>

      <div className="admin-card mt-6 space-y-2">
        {order.map((href, i) => {
          const item = byHref.get(href) as AdminNavItem | undefined;
          if (!item) return null;
          const locked = ADMIN_NAV_LOCKED.has(href);
          const Icon = item.icon;
          const isVisible = locked ? true : visibility[href] !== false;
          return (
            <div
              key={href}
              className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-2"
            >
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${item.label} up`}
                className="rounded border border-white/20 p-1 text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move ${item.label} down`}
                className="rounded border border-white/20 p-1 text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-3" />
              </button>

              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0 text-white/70" />
                <span className="truncate text-sm text-white/90">{item.label}</span>
                <span className="truncate font-mono text-[10px] text-white/40">{href}</span>
                {locked ? (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                    <Lock className="size-2.5" /> locked
                  </span>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={isVisible}
                  disabled={locked}
                  onChange={(e) =>
                    setVisibility((prev) => ({ ...prev, [href]: e.target.checked }))
                  }
                />
                visible
              </label>
            </div>
          );
        })}
      </div>

      <div className="admin-card mt-4 space-y-2 text-sm">
        <h2 className="text-sm font-semibold text-white/90">Footer</h2>
        <label className="flex items-center gap-2 text-white/80">
          <input
            type="checkbox"
            checked={showViewSite}
            onChange={(e) => setShowViewSite(e.target.checked)}
          />
          Show &quot;View site&quot; link
        </label>
        <label className="flex items-center gap-2 text-white/80">
          <input
            type="checkbox"
            checked={showThemeToggle}
            onChange={(e) => setShowThemeToggle(e.target.checked)}
          />
          Show theme toggle (light / dark mode)
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save sidebar"}
        </button>
        <span className="text-xs text-white/55">
          {hiddenCount > 0 ? `${hiddenCount} item${hiddenCount === 1 ? "" : "s"} hidden` : "All items visible"}
          {savedAt ? " · saved" : ""}
        </span>
      </div>
    </section>
  );
}
