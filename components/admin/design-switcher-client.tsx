"use client";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { SiteDesign } from "@/lib/design";

const DESIGNS: { id: SiteDesign; title: string; description: string; preview: string }[] = [
  {
    id: "futuristic",
    title: "Futuristic",
    description:
      "Dark, neon-accented theme with glass morphism, violet/cyan gradients, scan-lines, and a techy grid backdrop.",
    preview: "🌌",
  },
  {
    id: "editorial",
    title: "Editorial",
    description:
      "Warm, cream & terracotta palette with Instrument Serif typography, paper-grain texture, and kinetic scroll reveals.",
    preview: "📰",
  },
];

export function DesignSwitcherClient() {
  const [active, setActive] = useState<SiteDesign>("futuristic");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(
      doc(db(), "siteConfig", "design"),
      (snap) => {
        if (!snap.exists()) {
          setActive("futuristic");
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        setActive(data.activeDesign === "editorial" ? "editorial" : "futuristic");
      },
      () => setActive("futuristic"),
    );
  }, []);

  const handleSelect = async (design: SiteDesign) => {
    if (design === active || saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db(), "siteConfig", "design"), { activeDesign: design }, { merge: true });
    } catch (err) {
      console.error("Failed to update design:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-syne text-2xl font-bold tracking-tight">Site design</h1>
        <p className="mt-1 text-sm text-[var(--admin-fg)]/60">
          Choose the visual theme for the public-facing site. Changes take effect immediately.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {DESIGNS.map((d) => {
          const isActive = d.id === active;
          return (
            <button
              key={d.id}
              type="button"
              disabled={saving}
              onClick={() => handleSelect(d.id)}
              className={[
                "group relative flex flex-col items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all",
                isActive
                  ? "border-[#7c3aed] bg-[rgba(124,58,237,0.08)] shadow-[0_0_24px_-6px_rgba(124,58,237,0.35)]"
                  : "border-[var(--admin-fg)]/10 hover:border-[var(--admin-fg)]/25 hover:bg-[var(--admin-fg)]/[0.03]",
              ].join(" ")}
            >
              {/* Active badge */}
              {isActive && (
                <span className="absolute right-4 top-4 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Active
                </span>
              )}

              {/* Preview icon */}
              <span className="text-4xl">{d.preview}</span>

              {/* Title */}
              <h2 className="font-syne text-lg font-bold tracking-tight">{d.title}</h2>

              {/* Description */}
              <p className="text-sm leading-relaxed text-[var(--admin-fg)]/60">{d.description}</p>

              {/* Action hint */}
              {!isActive && (
                <span className="mt-auto text-xs font-medium text-[#7c3aed] opacity-0 transition-opacity group-hover:opacity-100">
                  Click to activate →
                </span>
              )}
            </button>
          );
        })}
      </div>

      {saving && (
        <p className="mt-6 text-center text-sm text-[var(--admin-fg)]/50">Applying design…</p>
      )}
    </div>
  );
}
