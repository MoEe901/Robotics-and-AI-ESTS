import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export const DEFAULT_TEAM_ROLES = [
  "Supervisor",
  "Co-Supervisor",
  "President",
  "Vice President",
  "President of the Media Cell",
  "Vice President of the Media Cell",
  "Photographer",
  "Video Editor",
  "President of the Secretary Cell",
  "Vice President of the Secretary Cell",
  "Social Media Manager",
  "Feedback Manager",
  "President of the Organization Cell",
  "Vice President of the Organization Cell",
  "Event Coordinator",
  "President of the Communication Cell",
  "Vice President of the Communication Cell",
  "President of the Financial Cell",
  "Vice President of the Financial Cell",
] as const;

export const DEFAULT_TEAM_CELLS = [
  "Executive Council",
  "Organization Cellule",
  "Design Cellule",
  "Media Cellule",
  "Secretary Cellule",
  "Treasury Cellule",
  "Communication Cellule",
  "Member",
] as const;

const TAXONOMY_REF = doc(db(), "teamConfig", "taxonomy");
const TAXONOMY_FALLBACK_REF = doc(db(), "pageSections", "teamTaxonomy");

function normalizeLabel(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = normalizeLabel(raw);
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export type TeamTaxonomy = {
  roles: string[];
  cells: string[];
};

function mergeWithDefaults(raw: Partial<TeamTaxonomy> | null | undefined): TeamTaxonomy {
  return {
    roles: dedupeCaseInsensitive([
      ...DEFAULT_TEAM_ROLES,
      ...(Array.isArray(raw?.roles) ? raw.roles.filter((x): x is string => typeof x === "string") : []),
    ]),
    cells: dedupeCaseInsensitive([
      ...DEFAULT_TEAM_CELLS,
      ...(Array.isArray(raw?.cells) ? raw.cells.filter((x): x is string => typeof x === "string") : []),
    ]),
  };
}

async function collectTaxonomyFromTeamMembers(): Promise<TeamTaxonomy> {
  const snap = await getDocs(collection(db(), "teamMembers"));
  const roles: string[] = [];
  const cells: string[] = [];
  snap.forEach((d) => {
    const data = d.data() as { roles?: unknown; roleType?: unknown };
    if (typeof data.roleType === "string") cells.push(data.roleType);
    if (Array.isArray(data.roles)) {
      for (const r of data.roles) {
        if (typeof r === "string") roles.push(r);
      }
    }
  });
  return {
    roles: dedupeCaseInsensitive([...DEFAULT_TEAM_ROLES, ...roles]),
    cells: dedupeCaseInsensitive([...DEFAULT_TEAM_CELLS, ...cells]),
  };
}

export async function loadTeamTaxonomy(): Promise<TeamTaxonomy> {
  const [fromConfig, fromFallback, fromMembers] = await Promise.all([
    getDoc(TAXONOMY_REF).catch(() => null),
    getDoc(TAXONOMY_FALLBACK_REF).catch(() => null),
    collectTaxonomyFromTeamMembers(),
  ]);
  const cfg = fromConfig?.exists() ? (fromConfig.data() as Partial<TeamTaxonomy>) : null;
  const fallback = fromFallback?.exists() ? (fromFallback.data() as Partial<TeamTaxonomy>) : null;
  const mergedStored = mergeWithDefaults({
    roles: [...(cfg?.roles ?? []), ...(fallback?.roles ?? [])],
    cells: [...(cfg?.cells ?? []), ...(fallback?.cells ?? [])],
  });
  return {
    roles: dedupeCaseInsensitive([...mergedStored.roles, ...fromMembers.roles]),
    cells: dedupeCaseInsensitive([...mergedStored.cells, ...fromMembers.cells]),
  };
}

export async function saveTeamTaxonomy(next: TeamTaxonomy): Promise<TeamTaxonomy> {
  const merged = mergeWithDefaults(next);
  let wrote = false;
  try {
    await setDoc(TAXONOMY_REF, merged, { merge: true });
    wrote = true;
  } catch {
    // ignore; fallback below
  }
  if (!wrote) {
    await setDoc(TAXONOMY_FALLBACK_REF, merged, { merge: true });
  }
  return merged;
}

export async function appendCustomRole(value: string): Promise<TeamTaxonomy> {
  const nextRole = normalizeLabel(value);
  if (!nextRole) return loadTeamTaxonomy();
  const current = await loadTeamTaxonomy();
  const next = {
    ...current,
    roles: dedupeCaseInsensitive([...current.roles, nextRole]),
  };
  await setDoc(TAXONOMY_REF, next, { merge: true });
  return next;
}

export async function appendCustomCell(value: string): Promise<TeamTaxonomy> {
  const nextCell = normalizeLabel(value);
  if (!nextCell) return loadTeamTaxonomy();
  const current = await loadTeamTaxonomy();
  const next = {
    ...current,
    cells: dedupeCaseInsensitive([...current.cells, nextCell]),
  };
  await setDoc(TAXONOMY_REF, next, { merge: true });
  return next;
}
