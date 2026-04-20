"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_TEAM_VISIBILITY } from "@/lib/firebase/types";
import { db } from "@/lib/firebase";
import {
  academicYearMatchesFilter,
  getCurrentAcademicYearLabel,
  isValidAcademicYearLabel,
  normalizeAcademicYearLabel,
  shiftAcademicYear,
  YEAR_LABEL_RE,
} from "@/lib/team/academic-year";

type Row = {
  id: string;
  data: DocumentData;
};

function sortYearLabelsDescending(years: string[]): string[] {
  return [...years].sort((a, b) => {
    const ma = a.match(YEAR_LABEL_RE);
    const mb = b.match(YEAR_LABEL_RE);
    if (ma && mb) return Number(mb[1]) - Number(ma[1]);
    return b.localeCompare(a);
  });
}

export function TeamAdminClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkToggling, setBulkToggling] = useState<"show" | "hide" | null>(null);

  const yearParam = searchParams.get("year");

  const showAllYears = yearParam === "all";

  const selectedYear = useMemo(() => {
    if (showAllYears) return null;
    if (!yearParam) return getCurrentAcademicYearLabel();
    const n = normalizeAcademicYearLabel(yearParam);
    return isValidAcademicYearLabel(n) ? n : getCurrentAcademicYearLabel();
  }, [yearParam, showAllYears]);

  useEffect(() => {
    if (yearParam === null) {
      router.replace(
        `${pathname}?year=${encodeURIComponent(getCurrentAcademicYearLabel())}`,
        { scroll: false },
      );
    }
  }, [yearParam, pathname, router]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db(), "teamMembers"),
      (snap) => {
        const next: Row[] = [];
        snap.forEach((d) => next.push({ id: d.id, data: d.data() }));
        next.sort((a, b) =>
          String(a.data.name ?? "").localeCompare(String(b.data.name ?? "")),
        );
        setRows(next);
        setError(null);
      },
      (e) => setError(e.message),
    );
    return () => unsub();
  }, []);

  const discoveredYears = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const y = r.data.academicYear;
      if (typeof y !== "string") continue;
      const n = normalizeAcademicYearLabel(y.trim());
      if (isValidAcademicYearLabel(n)) set.add(n);
    }
    set.add(getCurrentAcademicYearLabel());
    if (selectedYear && !showAllYears) set.add(selectedYear);
    return sortYearLabelsDescending(Array.from(set));
  }, [rows, selectedYear, showAllYears]);

  const filteredRows = useMemo(() => {
    if (showAllYears || selectedYear === null) return rows;
    return rows.filter((r) =>
      academicYearMatchesFilter(
        typeof r.data.academicYear === "string" ? r.data.academicYear : "",
        selectedYear,
      ),
    );
  }, [rows, selectedYear, showAllYears]);

  const navigateYear = useCallback(
    (next: string | "all") => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") {
        params.set("year", "all");
      } else {
        params.set("year", next);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const projectId = useMemo(
    () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    [],
  );

  const prevYear =
    !showAllYears && selectedYear ? shiftAcademicYear(selectedYear, -1) : null;
  const nextYear =
    !showAllYears && selectedYear ? shiftAcademicYear(selectedYear, 1) : null;
  const currentYearLabel = getCurrentAcademicYearLabel();

  async function handleAddMember() {
    setAdding(true);
    setError(null);
    const academicYearForNew =
      showAllYears || !selectedYear ? currentYearLabel : selectedYear;
    try {
      const ref = await addDoc(collection(db(), "teamMembers"), {
        name: "New member",
        slug: `member-${Date.now()}`,
        roleType: "Member",
        roles: [],
        academicYear: academicYearForNew,
        department: "GI",
        schoolStatus: "DUT 1st year",
        imageUrl: "",
        order: 0,
        isActive: false,
        createdAt: serverTimestamp(),
        visibility: DEFAULT_TEAM_VISIBILITY,
      });
      router.push(`/admin/team/${ref.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create member.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleVisibility(rowId: string, current: boolean) {
    setTogglingId(rowId);
    setError(null);
    try {
      await updateDoc(doc(db(), "teamMembers", rowId), { isActive: !current });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update visibility.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleWholeList(nextVisible: boolean) {
    if (!filteredRows.length) return;
    setBulkToggling(nextVisible ? "show" : "hide");
    setError(null);
    try {
      const batch = writeBatch(db());
      for (const row of filteredRows) {
        batch.update(doc(db(), "teamMembers", row.id), { isActive: nextVisible });
      }
      await batch.commit();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update whole list visibility.");
    } finally {
      setBulkToggling(null);
    }
  }

  return (
    <div className="px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Team members</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Live list from <span className="font-mono">teamMembers</span>, filtered by academic year.
            Duplicate people across years usually need{" "}
            <span className="text-white/85">separate documents</span> per year so roles and status can
            differ. Use the <span className="text-white/85">Visible</span> toggle below to show/hide
            members on the selected year.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/team/taxonomy"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Manage Roles & Cells
          </Link>
          <button
            type="button"
            onClick={() => void handleAddMember()}
            disabled={adding}
            className="rounded-xl border border-blue-500/40 bg-blue-600/20 px-4 py-2.5 text-sm font-semibold text-blue-100 hover:bg-blue-600/30 disabled:opacity-50"
          >
            {adding ? "Creating…" : "+ Add member"}
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Academic year
          </span>
          {showAllYears ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              All years
            </span>
          ) : selectedYear ? (
            <>
              <button
                type="button"
                disabled={!prevYear}
                onClick={() => prevYear && navigateYear(prevYear)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                ← {prevYear ?? "—"}
              </button>
              <span className="rounded-full border border-blue-500/35 bg-blue-500/15 px-3 py-1 font-mono text-xs font-semibold text-blue-100">
                {selectedYear}
              </span>
              <button
                type="button"
                disabled={!nextYear}
                onClick={() => nextYear && navigateYear(nextYear)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {nextYear ?? "—"} →
              </button>
              {selectedYear !== currentYearLabel ? (
                <button
                  type="button"
                  onClick={() => navigateYear(currentYearLabel)}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100/95 hover:bg-amber-500/20"
                >
                  Current ({currentYearLabel})
                </button>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <span className="text-[11px] uppercase tracking-wider text-white/45">Jump to</span>
            <select
              value={showAllYears ? "all" : (selectedYear ?? currentYearLabel)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") navigateYear("all");
                else navigateYear(v);
              }}
              className="[color-scheme:dark] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
            >
              <option value="all">All years ({rows.length})</option>
              {discoveredYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-white/40">
        Rows with no year set count as matching every year (same rule as the public directory). Tip: open
        this page with{" "}
        <span className="font-mono text-white/55">
          ?year={currentYearLabel}
        </span>{" "}
        or <span className="font-mono text-white/55">?year=all</span>.
      </p>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-white/55">
        Showing{" "}
        <span className="font-semibold text-white/90">{filteredRows.length}</span>
        {showAllYears ? (
          <> of {rows.length} total</>
        ) : selectedYear ? (
          <>
            {" "}
            for <span className="font-mono text-white/85">{selectedYear}</span>
          </>
        ) : null}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!filteredRows.length || bulkToggling !== null}
          onClick={() => void handleToggleWholeList(true)}
          className="rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 disabled:opacity-40"
        >
          {bulkToggling === "show" ? "Updating…" : "Show whole list"}
        </button>
        <button
          type="button"
          disabled={!filteredRows.length || bulkToggling !== null}
          onClick={() => void handleToggleWholeList(false)}
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 disabled:opacity-40"
        >
          {bulkToggling === "hide" ? "Updating…" : "Hide whole list"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/45">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Year</th>
              <th className="px-4 py-3 font-semibold">Visible</th>
              <th className="px-4 py-3 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-white/50">
                  No members for this filter. Use{" "}
                  <span className="text-white/75">+ Add member</span> to create one for{" "}
                  {showAllYears ? (
                    <>the current year ({currentYearLabel})</>
                  ) : (
                    <span className="font-mono text-white/80">{selectedYear}</span>
                  )}
                  , or switch year above.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/[0.06] text-white/85 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 font-medium">{String(r.data.name ?? "—")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/65">
                    {String(r.data.slug ?? "—")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {String(r.data.academicYear ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={togglingId === r.id}
                      onClick={() =>
                        void handleToggleVisibility(r.id, r.data.isActive !== false)
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        r.data.isActive === false
                          ? "border-white/20 bg-white/5 text-white/70"
                          : "border-emerald-500/35 bg-emerald-500/15 text-emerald-100"
                      } disabled:opacity-50`}
                    >
                      {togglingId === r.id
                        ? "Updating…"
                        : r.data.isActive === false
                          ? "Hidden"
                          : "Visible"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/team/${r.id}`}
                      className="inline-block rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Edit
                    </Link>
                    {projectId ? (
                      <a
                        href={`https://console.firebase.google.com/project/${projectId}/firestore/databases/default/data/~2FteamMembers~2F${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-300 hover:text-blue-200"
                      >
                        Console
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
