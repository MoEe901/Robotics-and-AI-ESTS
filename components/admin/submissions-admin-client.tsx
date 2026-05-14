"use client";

import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { db } from "@/lib/firebase";

type Row = {
  id: string;
  formId: string;
  status: "new" | "read" | "archived";
  submittedAt: string;
  fields: Record<string, string>;
};

/* ── CSV helpers ──────────────────────────────────────────── */

function esc(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(rows: Row[]): string {
  /* Collect every unique field key across all rows */
  const fieldKeysSet = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r.fields)) fieldKeysSet.add(k);
  }
  const fieldKeys = Array.from(fieldKeysSet);

  /* Readable header labels */
  const labelMap: Record<string, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    year: "Year",
    department: "Department",
    message: "Message",
  };

  const headers = [
    "Submission ID",
    "Form",
    "Status",
    "Submitted At",
    ...fieldKeys.map((k) => labelMap[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())),
  ];

  const lines: string[] = [headers.map(esc).join(",")];

  for (const r of rows) {
    const date = r.submittedAt
      ? new Date(r.submittedAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const statusLabel = r.status === "new" ? "New" : r.status === "read" ? "Read" : "Archived";
    const cols = [
      esc(r.id),
      esc(r.formId),
      esc(statusLabel),
      esc(date),
      ...fieldKeys.map((k) => esc(r.fields[k] || "")),
    ];
    lines.push(cols.join(","));
  }

  /* Add BOM for Excel to recognize UTF-8 */
  return "﻿" + lines.join("\r\n");
}

/** Parse a CSV string back into rows. Handles quoted fields with commas/newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;
  /* Strip BOM */
  const s = text.startsWith("﻿") ? text.slice(1) : text;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(cell);
        cell = "";
      } else if (ch === "\r") {
        /* skip */
      } else if (ch === "\n") {
        current.push(cell);
        cell = "";
        rows.push(current);
        current = [];
      } else {
        cell += ch;
      }
    }
  }
  if (cell || current.length) {
    current.push(cell);
    rows.push(current);
  }
  return rows;
}

/* ── component ────────────────────────────────────────────── */

export function SubmissionsAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formFilter, setFormFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    a.download = `submissions-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── restore from CSV ── */
  async function handleRestore(file: File) {
    setRestoreStatus("Reading file...");
    try {
      const text = await file.text();
      const csvRows = parseCsv(text);
      if (csvRows.length < 2) {
        setRestoreStatus("CSV is empty or has no data rows.");
        return;
      }

      const headers = csvRows[0]!;
      /* Map readable headers back to internal keys */
      const reverseLabel: Record<string, string> = {
        "Submission ID": "__id",
        "Form": "__formId",
        "Status": "__status",
        "Submitted At": "__submittedAt",
        "First Name": "firstName",
        "Last Name": "lastName",
        "Full Name": "fullName",
        "Email": "email",
        "Phone": "phone",
        "Year": "year",
        "Department": "department",
        "Message": "message",
      };

      /* Also handle original camelCase headers from older exports */
      const idxMap: { key: string; idx: number }[] = headers.map((h, i) => ({
        key: reverseLabel[h.trim()] || h.trim().replace(/\s+(.)/g, (_: string, c: string) => c.toUpperCase()).replace(/^(.)/, (c: string) => c.toLowerCase()),
        idx: i,
      }));

      const idIdx = idxMap.find((m) => m.key === "__id")?.idx;
      const formIdx = idxMap.find((m) => m.key === "__formId")?.idx;
      const statusIdx = idxMap.find((m) => m.key === "__status")?.idx;
      const dateIdx = idxMap.find((m) => m.key === "__submittedAt")?.idx;

      if (idIdx === undefined) {
        setRestoreStatus("Could not find 'Submission ID' column. Make sure you're uploading a file exported from this page.");
        return;
      }

      const existingIds = new Set(rows.map((r) => r.id));
      let restored = 0;
      let skipped = 0;

      for (let i = 1; i < csvRows.length; i++) {
        const cols = csvRows[i]!;
        const docId = cols[idIdx]?.trim();
        if (!docId) continue;

        /* Skip if already exists in Firestore */
        if (existingIds.has(docId)) {
          skipped++;
          continue;
        }

        const formId = formIdx !== undefined ? (cols[formIdx]?.trim() || "unknown") : "unknown";
        const statusRaw = statusIdx !== undefined ? (cols[statusIdx]?.trim().toLowerCase() || "new") : "new";
        const status = statusRaw === "read" || statusRaw === "archived" ? statusRaw : "new";
        const dateStr = dateIdx !== undefined ? (cols[dateIdx]?.trim() || "") : "";

        /* Parse the date back */
        let submittedAt: Timestamp | null = null;
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) submittedAt = Timestamp.fromDate(parsed);
        }

        /* Build fields from remaining columns */
        const fields: Record<string, string> = {};
        for (const m of idxMap) {
          if (m.key.startsWith("__")) continue;
          const val = cols[m.idx]?.trim() || "";
          if (val) fields[m.key] = val;
        }

        await setDoc(doc(db(), "submissions", docId), {
          formId,
          status,
          submittedAt: submittedAt || Timestamp.now(),
          fields,
          notes: "",
          restoredFromCsv: true,
        });
        restored++;
      }

      setRestoreStatus(
        restored > 0
          ? `Restored ${restored} submission${restored > 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} already existed, skipped)` : ""}.`
          : skipped > 0
            ? `All ${skipped} submissions already exist — nothing to restore.`
            : "No valid rows found in CSV.",
      );
    } catch (e) {
      setRestoreStatus(e instanceof Error ? e.message : "Failed to restore CSV.");
    }
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
            onClick={exportCsv}
            className="rounded-lg border border-white/25 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-emerald-400/30 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
          >
            Restore CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleRestore(f);
              e.target.value = "";
            }}
          />
        </div>

        {restoreStatus && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-900/15 px-4 py-2.5 text-sm text-emerald-200">
            <span className="flex-1">{restoreStatus}</span>
            <button
              type="button"
              onClick={() => setRestoreStatus(null)}
              className="text-emerald-400/60 hover:text-emerald-300"
            >
              ✕
            </button>
          </div>
        )}
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
                      <span className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this submission?")) {
                              void deleteDoc(doc(db(), "submissions", r.id));
                            }
                          }}
                          className="text-rose-400/70 hover:text-rose-300"
                        >
                          Delete
                        </button>
                        <Link href={`/admin/submissions/${r.id}`} className="text-cyan-300 hover:text-cyan-200">
                          Open
                        </Link>
                      </span>
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
