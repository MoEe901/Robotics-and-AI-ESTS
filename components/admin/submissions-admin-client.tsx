"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";

type Row = {
  id: string;
  formId: string;
  status: "new" | "read" | "archived";
  submittedAt: string;
  fields: Record<string, string>;
};

function toCsv(rows: Row[]): string {
  const lines = ["id,formId,status,submittedAt,preview"]; 
  for (const r of rows) {
    const preview = Object.values(r.fields)[0] || "";
    const esc = (s: string) => `"${s.replaceAll('"', '""')}"`;
    lines.push([esc(r.id), esc(r.formId), esc(r.status), esc(r.submittedAt), esc(preview)].join(","));
  }
  return lines.join("\n");
}

export function SubmissionsAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formFilter, setFormFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const q = query(collection(db(), "submissions"), orderBy("submittedAt", "desc"));
    return onSnapshot(q, (snap) => {
      const next: Row[] = snap.docs.map((d) => {
        const r = d.data() as Record<string, unknown>;
        const ts = r.submittedAt as { toDate?: () => Date } | undefined;
        return {
          id: d.id,
          formId: typeof r.formId === "string" ? r.formId : "unknown",
          status: r.status === "read" || r.status === "archived" ? r.status : "new",
          submittedAt: ts?.toDate ? ts.toDate().toISOString() : "",
          fields: r.fields && typeof r.fields === "object" ? (r.fields as Record<string, string>) : {},
        };
      });
      setRows(next);
    });
  }, []);

  const forms = useMemo(() => Array.from(new Set(rows.map((r) => r.formId))), [rows]);
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (formFilter !== "all" && r.formId !== formFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const text = `${r.formId} ${Object.values(r.fields).join(" ")}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        if (fromDate) {
          const lower = new Date(`${fromDate}T00:00:00.000Z`).getTime();
          const t = r.submittedAt ? new Date(r.submittedAt).getTime() : 0;
          if (!t || t < lower) return false;
        }
        if (toDate) {
          const upper = new Date(`${toDate}T23:59:59.999Z`).getTime();
          const t = r.submittedAt ? new Date(r.submittedAt).getTime() : 0;
          if (!t || t > upper) return false;
        }
        return true;
      }),
    [rows, statusFilter, formFilter, search, fromDate, toDate],
  );

  async function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Submissions</h1>
      <div className="admin-card mt-4 flex flex-wrap items-center gap-2">
        <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)} className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm">
          <option value="all">All forms</option>
          {forms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm" />
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm" />
        <button type="button" onClick={() => void exportCsv()} className="rounded border border-white/25 px-2 py-1 text-xs">Export CSV</button>
      </div>

      <div className="admin-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-white/60"><th>Status</th><th>Form</th><th>Submitted</th><th>Preview</th><th /></tr></thead>
          <tbody>
            {filtered.map((r) => {
              const preview = Object.values(r.fields)[0] || "-";
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-2"><span className="rounded-full border border-white/20 px-2 py-0.5 text-xs">{r.status}</span></td>
                  <td>{r.formId}</td>
                  <td className="text-xs text-white/60">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</td>
                  <td className="max-w-[260px] truncate">{preview}</td>
                  <td className="py-2 text-right"><Link href={`/admin/submissions/${r.id}`} className="text-cyan-300">Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
