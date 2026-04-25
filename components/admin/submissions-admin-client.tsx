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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formFilter, setFormFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const q = query(collection(db(), "submissions"), orderBy("submittedAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
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
        setLoadError(null);
      },
      (e) => {
        setRows([]);
        setLoadError(e instanceof Error ? e.message : "Could not load submissions.");
      },
    );
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

  const inputCls =
    "rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none";

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Submissions</h1>
      <p className="admin-page-subtitle">
        Filter, search, and export form submissions received from the public site.
      </p>

      <div className="admin-card mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)} className={inputCls}>
            <option value="all">All forms</option>
            {forms.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`${inputCls} min-w-[200px] flex-1`}
          />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
          <button
            type="button"
            onClick={() => void exportCsv()}
            className="rounded-lg border border-white/25 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-card mt-6 overflow-x-auto p-5 sm:p-6">
        {loadError ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100/90">
            {loadError}
          </p>
        ) : null}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-sm font-medium text-white/80">No submissions match your filters</p>
            <p className="max-w-sm text-xs text-white/55">
              Try clearing the date range or search term. New submissions appear here automatically within ~1 second.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/60">
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Form</th>
                <th className="pb-3 pr-4">Submitted</th>
                <th className="pb-3 pr-4">Preview</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const preview = Object.values(r.fields)[0] || "-";
                return (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="py-3 pr-4">
                      <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs">{r.status}</span>
                    </td>
                    <td className="py-3 pr-4">{r.formId}</td>
                    <td className="py-3 pr-4 text-xs text-white/60">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}
                    </td>
                    <td className="max-w-[260px] truncate py-3 pr-4">{preview}</td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/submissions/${r.id}`} className="text-cyan-300 hover:text-cyan-200">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
