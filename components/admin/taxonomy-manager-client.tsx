"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_TEAM_CELLS,
  DEFAULT_TEAM_ROLES,
  loadTeamTaxonomy,
  saveTeamTaxonomy,
  type TeamTaxonomy,
} from "@/lib/team/role-taxonomy";

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

type ListEditorProps = {
  title: string;
  description: string;
  items: string[];
  newValue: string;
  setNewValue: (value: string) => void;
  onAdd: () => void;
  onRename: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  disabled: boolean;
};

function ListEditor({
  title,
  description,
  items,
  newValue,
  setNewValue,
  onAdd,
  onRename,
  onDelete,
  onMove,
  disabled,
}: ListEditorProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">{title}</h2>
      <p className="mt-2 text-sm text-white/60">{description}</p>

      <div className="mt-4 space-y-2">
        {items.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <input
              value={value}
              onChange={(e) => onRename(index, e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={disabled || index === 0}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/85 disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={disabled || index === items.length - 1}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/85 disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onDelete(index)}
              disabled={disabled}
              className="rounded-lg border border-red-500/35 px-3 py-2 text-xs text-red-200 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={disabled}
          placeholder={`Add custom ${title.toLowerCase().slice(0, -1)}`}
          className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-white/45">You can add, rename, reorder, and delete any entry.</p>
    </section>
  );
}

export function TaxonomyManagerClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [roles, setRoles] = useState<string[]>([...DEFAULT_TEAM_ROLES]);
  const [cells, setCells] = useState<string[]>([...DEFAULT_TEAM_CELLS]);
  const [newRole, setNewRole] = useState("");
  const [newCell, setNewCell] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const taxonomy = await loadTeamTaxonomy();
        if (!cancelled) {
          setRoles(taxonomy.roles);
          setCells(taxonomy.cells);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load taxonomy.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function reorder(values: string[], index: number, dir: -1 | 1): string[] {
    const next = [...values];
    const target = index + dir;
    if (target < 0 || target >= next.length) return next;
    const tmp = next[index];
    next[index] = next[target]!;
    next[target] = tmp!;
    return next;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: TeamTaxonomy = {
        roles: dedupeCaseInsensitive(roles),
        cells: dedupeCaseInsensitive(cells),
      };
      const saved = await saveTeamTaxonomy(payload);
      setRoles(saved.roles);
      setCells(saved.cells);
      setSuccess("Taxonomy saved.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="px-6 py-12 text-sm text-white/60">Loading roles and cells…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 pb-24">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Manage Roles & Cells</h1>
      <p className="mt-2 text-sm text-white/60">
        Global taxonomy editor for team roles and cell names. Changes apply to all member forms.
      </p>

      {error ? (
        <p className="mt-5 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
          {success}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <ListEditor
          title="Roles"
          description="Seeded defaults + custom roles. Rename, reorder, and add items here."
          items={roles}
          newValue={newRole}
          setNewValue={setNewRole}
          onAdd={() => {
            const trimmed = newRole.trim();
            if (!trimmed) return;
            setRoles((prev) => dedupeCaseInsensitive([...prev, trimmed]));
            setNewRole("");
          }}
          onRename={(index, value) =>
            setRoles((prev) => {
              const next = [...prev];
              next[index] = value;
              return next;
            })
          }
          onDelete={(index) => setRoles((prev) => prev.filter((_, i) => i !== index))}
          onMove={(index, dir) => setRoles((prev) => reorder(prev, index, dir))}
          disabled={saving}
        />
        <ListEditor
          title="Cells"
          description="Seeded defaults + custom cell names used in member profiles."
          items={cells}
          newValue={newCell}
          setNewValue={setNewCell}
          onAdd={() => {
            const trimmed = newCell.trim();
            if (!trimmed) return;
            setCells((prev) => dedupeCaseInsensitive([...prev, trimmed]));
            setNewCell("");
          }}
          onRename={(index, value) =>
            setCells((prev) => {
              const next = [...prev];
              next[index] = value;
              return next;
            })
          }
          onDelete={(index) => setCells((prev) => prev.filter((_, i) => i !== index))}
          onMove={(index, dir) => setCells((prev) => reorder(prev, index, dir))}
          disabled={saving}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save taxonomy"}
        </button>
      </div>
    </div>
  );
}
