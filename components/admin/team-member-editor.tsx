"use client";

import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_TEAM_VISIBILITY, type TeamMemberVisibility } from "@/lib/firebase/types";
import { db } from "@/lib/firebase";
import { SOCIAL_PLATFORMS } from "@/lib/team/contacts";
import {
  DEFAULT_TEAM_CELLS,
  DEFAULT_TEAM_ROLES,
  loadTeamTaxonomy,
} from "@/lib/team/role-taxonomy";
import {
  departmentMustBeEmpty,
  departmentsForSchoolStatus,
  SCHOOL_STATUS_OPTIONS,
  type SchoolStatusOption,
} from "@/lib/team/school-taxonomy";

type ContactDraft = {
  type: string;
  value: string;
  visible: boolean;
};

type Props = {
  memberId: string;
};

function mergeVisibilityDoc(raw: unknown): TeamMemberVisibility {
  const v =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<TeamMemberVisibility>)
      : {};
  return {
    ...DEFAULT_TEAM_VISIBILITY,
    ...v,
    showBirthday: v.showBirthday === true,
  };
}

function parseRolesFromDoc(data: DocumentData): string[] {
  const r = data.roles;
  if (!Array.isArray(r)) return [];
  return r
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
}

function parseContactsFromDoc(data: DocumentData): ContactDraft[] {
  const c = data.contacts;
  if (!Array.isArray(c) || c.length === 0) {
    return [{ type: "", value: "", visible: true }];
  }
  const out: ContactDraft[] = [];
  for (const row of c) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const type = typeof o.type === "string" ? o.type : "";
    const value = typeof o.value === "string" ? o.value : "";
    const visible = o.visible !== false;
    if (type || value) out.push({ type, value, visible });
  }
  return out.length ? out : [{ type: "", value: "", visible: true }];
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function TeamMemberEditor({ memberId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [department, setDepartment] = useState("GI");
  const [schoolStatus, setSchoolStatus] = useState("DUT 1st year");
  const [cellName, setCellName] = useState("Member");
  const [selectedRole, setSelectedRole] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [bio, setBio] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [birthday, setBirthday] = useState("");
  const [contacts, setContacts] = useState<ContactDraft[]>([
    { type: "", value: "", visible: true },
  ]);
  const [visibility, setVisibility] = useState<TeamMemberVisibility>(DEFAULT_TEAM_VISIBILITY);
  const [createdAtLabel, setCreatedAtLabel] = useState<string | null>(null);

  const [roleOptions, setRoleOptions] = useState<string[]>([...DEFAULT_TEAM_ROLES]);
  const [cellOptions, setCellOptions] = useState<string[]>([...DEFAULT_TEAM_CELLS]);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customCellInput, setCustomCellInput] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      setLoadError(null);

      try {
        const [snap, taxonomy] = await Promise.all([
          getDoc(doc(db(), "teamMembers", memberId)),
          loadTeamTaxonomy(),
        ]);
        if (cancelled) return;

        if (!snap.exists()) {
          setLoadError("Document not found.");
          return;
        }

        const data = snap.data() as DocumentData;
        const docRoles = parseRolesFromDoc(data);
        const docCell = typeof data.roleType === "string" ? data.roleType.trim() : "";
        const mergedRoles = dedupeCaseInsensitive([...taxonomy.roles, ...docRoles]);
        const mergedCells = dedupeCaseInsensitive([...taxonomy.cells, docCell || "Member"]);

        setRoleOptions(mergedRoles);
        setCellOptions(mergedCells);
        setSelectedRole(docRoles[0] ?? "");
        setCellName(docCell || "Member");

        setName(typeof data.name === "string" ? data.name : "");
        setSlug(typeof data.slug === "string" ? data.slug : "");
        setAcademicYear(typeof data.academicYear === "string" ? data.academicYear : "");

        const rawStatus =
          typeof data.schoolStatus === "string" ? data.schoolStatus.trim() : "";
        const effectiveStatus = rawStatus || "DUT 1st year";
        setSchoolStatus(effectiveStatus);

        const rawDept = typeof data.department === "string" ? data.department.trim() : "";
        if (departmentMustBeEmpty(effectiveStatus)) {
          setDepartment("");
        } else {
          const allowed = departmentsForSchoolStatus(effectiveStatus);
          setDepartment(rawDept && allowed.includes(rawDept) ? rawDept : (allowed[0] ?? ""));
        }

        setBirthday(
          typeof data.birthday === "string" ? data.birthday.trim().slice(0, 10) : "",
        );
        setOrder(typeof data.order === "number" && Number.isFinite(data.order) ? data.order : 0);
        setIsActive(data.isActive !== false);
        setImageUrl(typeof data.imageUrl === "string" ? data.imageUrl : "");
        setShortBio(typeof data.shortBio === "string" ? data.shortBio : "");
        setBio(typeof data.bio === "string" ? data.bio : "");
        setFullDescription(typeof data.fullDescription === "string" ? data.fullDescription : "");
        setContacts(parseContactsFromDoc(data));
        setVisibility(mergeVisibilityDoc(data.visibility));

        const ca = data.createdAt;
        if (ca && typeof ca === "object" && "toDate" in ca && typeof ca.toDate === "function") {
          try {
            setCreatedAtLabel((ca as { toDate: () => Date }).toDate().toISOString());
          } catch {
            setCreatedAtLabel(null);
          }
        } else {
          setCreatedAtLabel(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const contactTypeSuggestions = [...SOCIAL_PLATFORMS, "Email", "Phone", "Discord", "Other"];
  const roleChoices = useMemo(
    () => dedupeCaseInsensitive([...roleOptions, selectedRole]),
    [roleOptions, selectedRole],
  );
  const cellChoices = useMemo(
    () => dedupeCaseInsensitive([...cellOptions, cellName]),
    [cellOptions, cellName],
  );

  function setVis<K extends keyof TeamMemberVisibility>(key: K, value: TeamMemberVisibility[K]) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
  }

  function handleSchoolStatusChange(next: string) {
    setSchoolStatus(next);
    if (departmentMustBeEmpty(next)) {
      setDepartment("");
      return;
    }
    const allowed = departmentsForSchoolStatus(next);
    setDepartment((prev) => (allowed.includes(prev) ? prev : (allowed[0] ?? "")));
  }

  function handleAddCustomRole() {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    setRoleOptions((prev) => dedupeCaseInsensitive([...prev, trimmed]));
    setSelectedRole(trimmed);
    setCustomRoleInput("");
  }

  function handleAddCustomCell() {
    const trimmed = customCellInput.trim();
    if (!trimmed) return;
    setCellOptions((prev) => dedupeCaseInsensitive([...prev, trimmed]));
    setCellName(trimmed);
    setCustomCellInput("");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this team member from the database? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteDoc(doc(db(), "teamMembers", memberId));
      router.push("/admin/team");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed — check Firestore rules.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const contactsClean = contacts
      .filter((c) => c.type.trim() && c.value.trim())
      .map((c) => ({
        type: c.type.trim(),
        value: c.value.trim(),
        visible: c.visible,
      }));

    const orderNum = Number(order);
    if (!Number.isFinite(orderNum)) {
      setError("Order must be a valid number.");
      setSaving(false);
      return;
    }

    const statusTrim = schoolStatus.trim();
    if (!statusTrim) {
      setError("School status is required.");
      setSaving(false);
      return;
    }

    const cellTrim = cellName.trim();
    if (!cellTrim) {
      setError("Cell name is required.");
      setSaving(false);
      return;
    }

    let deptOut = department.trim();
    if (departmentMustBeEmpty(statusTrim)) {
      deptOut = "";
    } else {
      const allowed = departmentsForSchoolStatus(statusTrim);
      if (!deptOut || !allowed.includes(deptOut)) {
        setError("Choose a department that matches the school status.");
        setSaving(false);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim(),
      academicYear: academicYear.trim(),
      department: deptOut,
      schoolStatus: statusTrim,
      roleType: cellTrim,
      roles: selectedRole.trim() ? [selectedRole.trim()] : [],
      order: orderNum,
      isActive,
      isVisible: isActive,
      imageUrl: imageUrl.trim(),
      shortBio: shortBio.trim() || "",
      bio: bio.trim() || "",
      fullDescription: fullDescription.trim() || "",
      contacts: contactsClean,
      birthday: birthday.trim() ? birthday.trim() : deleteField(),
      visibility: {
        showEmail: visibility.showEmail,
        showPhone: visibility.showPhone,
        showSocial: visibility.showSocial,
        showFullDescription: visibility.showFullDescription,
        showBirthday: visibility.showBirthday === true,
        showWhatsApp: visibility.showWhatsApp,
        showInstagram: visibility.showInstagram,
        showSnapchat: visibility.showSnapchat,
        showLinkedIn: visibility.showLinkedIn,
        showGitHub: visibility.showGitHub,
      },
    };

    try {
      await updateDoc(doc(db(), "teamMembers", memberId), payload);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed — check Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="px-6 py-12 text-sm text-white/60">Loading member…</p>;

  if (loadError) {
    return (
      <div className="px-6 py-12">
        <p className="text-red-300/90">{loadError}</p>
        <Link href="/admin/team" className="mt-4 inline-block text-sm text-blue-300 hover:text-blue-200">
          ? Back to team list
        </Link>
      </div>
    );
  }

  const publicProfileHref = slug.trim() ? `/team/${slug.trim()}` : null;

  return (
    <form onSubmit={(ev) => void handleSave(ev)} className="mx-auto max-w-3xl px-6 py-10 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/team" className="text-xs font-medium text-blue-300 hover:text-blue-200">
            ? Team list
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Edit member</h1>
          <p className="mt-1 font-mono text-[11px] text-white/45">{memberId}</p>
          {createdAtLabel ? (
            <p className="mt-1 text-[11px] text-white/35">createdAt (read-only): {createdAtLabel}</p>
          ) : null}
          {publicProfileHref ? (
            <Link
              href={publicProfileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              View public profile ?
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting || saving}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete member"}
          </button>
          <button
            type="submit"
            disabled={saving || deleting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
          {error}
        </p>
      ) : null}

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-500/50"
            />
          </label>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Academic & org</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Academic year</span>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-500/50"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">School status</span>
            <select
              value={schoolStatus}
              onChange={(e) => handleSchoolStatusChange(e.target.value)}
              className="[color-scheme:dark] mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            >
              {!SCHOOL_STATUS_OPTIONS.includes(schoolStatus as SchoolStatusOption) && schoolStatus ? (
                <option value={schoolStatus}>{schoolStatus} (stored)</option>
              ) : null}
              {SCHOOL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Department</span>
            <select
              value={department}
              disabled={departmentMustBeEmpty(schoolStatus)}
              onChange={(e) => setDepartment(e.target.value)}
              className="[color-scheme:dark] mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {departmentMustBeEmpty(schoolStatus) ? (
                <option value="">Not applicable</option>
              ) : (
                <>
                  {department && !departmentsForSchoolStatus(schoolStatus).includes(department) ? (
                    <option value={department}>{department} (stored)</option>
                  ) : null}
                  {departmentsForSchoolStatus(schoolStatus).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Role & cell</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Cell name</span>
            <select
              value={cellName}
              onChange={(e) => setCellName(e.target.value)}
              className="[color-scheme:dark] mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            >
              {cellChoices.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Custom cell</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <input
                value={customCellInput}
                onChange={(e) => setCustomCellInput(e.target.value)}
                placeholder="Add new cell name"
                className="min-w-[230px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={handleAddCustomCell}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
              >
                + Add custom cell
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Order</span>
            <input
              type="number"
              value={Number.isFinite(order) ? order : 0}
              onChange={(e) => setOrder(Number.parseInt(e.target.value, 10) || 0)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-500/50"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-white/30"
            />
            <span className="text-sm text-white/85">
              Visible on public site for this academic year (isActive)
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Role</span>
            <p className="mt-1 text-xs text-white/50">
              Select exactly one role for this member.
            </p>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="[color-scheme:dark] mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            >
              <option value="">Not set</option>
              {roleChoices.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Custom role</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <input
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Add new role"
                className="min-w-[230px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
              >
                + Add custom role
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Media</h2>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Image URL (direct link to image file)</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
          />
        </label>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Copy</h2>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Short bio</span>
          <textarea
            value={shortBio}
            onChange={(e) => setShortBio(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Full description</span>
          <textarea
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            rows={8}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
          />
        </label>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Contacts</h2>
        <div className="space-y-3">
          {contacts.map((row, i) => (
            <div
              key={`${row.type}-${row.value}-${i}`}
              className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <label className="block sm:col-span-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Type</span>
                <input
                  list={`contact-types-${memberId}`}
                  value={row.type}
                  onChange={(e) => {
                    const next = [...contacts];
                    next[i] = { ...next[i]!, type: e.target.value };
                    setContacts(next);
                  }}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <datalist id={`contact-types-${memberId}`}>
                  {contactTypeSuggestions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>
              <label className="block sm:col-span-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Value</span>
                <input
                  value={row.value}
                  onChange={(e) => {
                    const next = [...contacts];
                    next[i] = { ...next[i]!, value: e.target.value };
                    setContacts(next);
                  }}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="flex items-end gap-2 pb-1">
                <input
                  type="checkbox"
                  checked={row.visible}
                  onChange={(e) => {
                    const next = [...contacts];
                    next[i] = { ...next[i]!, visible: e.target.checked };
                    setContacts(next);
                  }}
                  className="h-4 w-4 rounded border-white/30"
                />
                <span className="text-xs text-white/70">Visible</span>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setContacts([...contacts, { type: "", value: "", visible: true }])}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
        >
          + Add contact row
        </button>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Birthday & visibility</h2>
        <label className="block max-w-md">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Birthday</span>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-500/50"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["showFullDescription", "Show long “About” block on profile"],
              ["showEmail", "Show email contacts"],
              ["showPhone", "Show phone / SMS-style contacts"],
              ["showSocial", "Show other social (e.g. Discord)"],
              ["showWhatsApp", "Show WhatsApp"],
              ["showInstagram", "Show Instagram"],
              ["showSnapchat", "Show Snapchat"],
              ["showLinkedIn", "Show LinkedIn"],
              ["showGitHub", "Show GitHub"],
              ["showBirthday", "Show birthday on profile"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <input
                type="checkbox"
                checked={Boolean(visibility[key])}
                onChange={(e) =>
                  setVis(key, e.target.checked as TeamMemberVisibility[typeof key])
                }
                className="h-4 w-4 rounded border-white/30"
              />
              <span className="text-sm text-white/85">{label}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="mt-12 flex justify-end border-t border-white/10 pt-8">
        <button
          type="submit"
          disabled={saving || deleting}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

