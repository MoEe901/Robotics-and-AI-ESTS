import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";

export type ProvisionedAdminRole =
  | "admin"
  | "editor"
  | "moderator"
  | "viewer";

export type AdminSessionInfo = {
  ok: true;
  role: ProvisionedAdminRole;
};

export type AdminSessionDenied = {
  ok: false;
  reason: "not_signed_in" | "not_provisioned";
};

/**
 * Resolves the admin session for a Firebase Auth user.
 * Requires an `adminUsers/{uid}` document with `active != false`
 * and a known `role` value.
 */
export async function resolveAdminSession(
  user: User | null,
): Promise<AdminSessionInfo | AdminSessionDenied> {
  if (!user?.uid) return { ok: false, reason: "not_signed_in" };
  const snap = await getDoc(doc(db(), "adminUsers", user.uid));
  if (!snap.exists()) return { ok: false, reason: "not_provisioned" };
  const d = snap.data() as Record<string, unknown>;
  if (d.active === false) return { ok: false, reason: "not_provisioned" };
  const roleRaw =
    typeof d.role === "string" ? d.role.trim().toLowerCase() : "";
  const role = (
    ["admin", "editor", "moderator", "viewer"] as const
  ).includes(roleRaw as ProvisionedAdminRole)
    ? (roleRaw as ProvisionedAdminRole)
    : null;
  if (!role) return { ok: false, reason: "not_provisioned" };
  return { ok: true, role };
}
