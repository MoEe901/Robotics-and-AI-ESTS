"use client";

import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";

type ActivityRow = { id: string; title: string; isVisible: boolean; createdAt: string };

export function ActivityAdminClient() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const q = query(collection(db(), "activity"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = data.createdAt as { toDate?: () => Date } | undefined;
          return {
            id: d.id,
            title: typeof data.title === "string" ? data.title : "",
            isVisible: data.isVisible !== false,
            createdAt: ts?.toDate ? ts.toDate().toISOString() : "",
          };
        }),
      );
    });
  }, []);

  async function createItem() {
    if (!title.trim()) return;
    await addDoc(collection(db(), "activity"), {
      title: title.trim(),
      isVisible: true,
      createdAt: serverTimestamp(),
    });
    setTitle("");
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Live activity</h1>
      <div className="admin-card mt-4 flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm" placeholder="Activity title" />
        <button type="button" onClick={() => void createItem()} className="rounded border border-white/25 px-3 py-2 text-sm">Post</button>
      </div>

      {rows.length === 0 ? (
        <div className="admin-card mt-4 flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <p className="text-base font-medium text-white/80">No activity posts yet</p>
          <p className="max-w-sm text-sm text-white/55">
            Create a post above and it will appear on the homepage&apos;s Live Activity card within ~1 second.
          </p>
        </div>
      ) : (
        <div className="admin-card mt-4 space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded border border-white/10 p-3">
              <div>
                <p className="text-sm text-white">{row.title}</p>
                <p className="text-xs text-white/55">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/70">
                  <input type="checkbox" checked={row.isVisible} onChange={(e) => void updateDoc(doc(db(), "activity", row.id), { isVisible: e.target.checked })} /> visible
                </label>
                <button type="button" onClick={() => void deleteDoc(doc(db(), "activity", row.id))} className="rounded border border-red-400/30 px-2 py-1 text-xs text-red-200">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
