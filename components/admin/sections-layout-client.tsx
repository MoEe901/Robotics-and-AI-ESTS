"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";

const KNOWN = ["hero", "events", "knowUs", "whyJoin", "cellules", "processSteps", "team", "faq", "apply", "footer"] as const;
type Id = (typeof KNOWN)[number];

export function SectionsLayoutClient() {
  const [order, setOrder] = useState<Id[]>([...KNOWN]);
  const [visibility, setVisibility] = useState<Record<Id, boolean>>({
    hero: true,
    events: true,
    knowUs: true,
    whyJoin: true,
    cellules: true,
    processSteps: true,
    team: true,
    faq: true,
    apply: true,
    footer: true,
  });

  useEffect(() => {
    void (async () => {
      const snap = await getDoc(doc(db(), "siteConfig", "sections"));
      if (!snap.exists()) return;
      const r = snap.data() as Record<string, unknown>;
      const o = Array.isArray(r.order) ? r.order.filter((x): x is Id => typeof x === "string" && KNOWN.includes(x as Id)) : [];
      if (o.length) setOrder([...o, ...KNOWN.filter((x) => !o.includes(x))]);
      const vr = r.visibility && typeof r.visibility === "object" ? (r.visibility as Record<string, unknown>) : {};
      setVisibility((prev) => {
        const next = { ...prev };
        for (const id of KNOWN) next[id] = vr[id] !== false;
        return next;
      });
    })();
  }, []);

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
    await setDoc(doc(db(), "siteConfig", "sections"), { order, visibility }, { merge: true });
    alert("Sections updated.");
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Homepage Layout</h1>
      <p className="admin-page-subtitle">Toggle section visibility and order with arrows.</p>
      <div className="admin-card mt-6 space-y-2">
        {order.map((id, i) => (
          <div key={id} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded border border-white/10 p-2">
            <button type="button" onClick={() => move(i, -1)} className="rounded border border-white/20 p-1"><ArrowUp className="size-3" /></button>
            <button type="button" onClick={() => move(i, 1)} className="rounded border border-white/20 p-1"><ArrowDown className="size-3" /></button>
            <span className="font-mono text-sm">{id}</span>
            <label className="text-xs text-white/80"><input type="checkbox" checked={visibility[id]} onChange={(e) => setVisibility((prev) => ({ ...prev, [id]: e.target.checked }))} /> visible</label>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => void save()} className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white">Save layout</button>
    </div>
  );
}
