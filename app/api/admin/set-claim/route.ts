import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

import { getFirebaseAdminApp } from "@/lib/server/firebase-admin";

/**
 * POST /api/admin/set-claim
 *
 * Reads the role stored in adminUsers/{targetUid} and writes it as a
 * Firebase Custom Claim `adminRole` on that user's auth token.
 *
 * This is required so Firestore security rules can check
 * `request.auth.token.adminRole` in list operations without calling
 * get() on the same collection being queried (which Firestore forbids).
 *
 * Body: { targetUid: string }
 *
 * Caller must be a provisioned admin (adminUsers/{uid}.role === "admin").
 * A user may also sync their OWN claim (targetUid === callerUid).
 */
export async function POST(request: NextRequest) {
  // ── 1. Verify caller's ID token ───────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }
  const idToken = authHeader.slice(7);

  const app = getFirebaseAdminApp();
  let callerUid: string;
  try {
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 },
    );
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const targetUid =
    typeof (body as Record<string, unknown>).targetUid === "string"
      ? ((body as Record<string, unknown>).targetUid as string).trim()
      : "";
  if (!targetUid) {
    return NextResponse.json(
      { error: "Missing required field: targetUid." },
      { status: 400 },
    );
  }

  // ── 3. Verify caller is admin OR syncing their own claim ──────────────
  const callerSnap = await admin
    .firestore(app)
    .collection("adminUsers")
    .doc(callerUid)
    .get();
  const callerData = callerSnap.data();
  const callerIsAdmin =
    callerSnap.exists &&
    callerData?.active !== false &&
    callerData?.role === "admin";
  const isSelf = targetUid === callerUid;

  if (!callerIsAdmin && !isSelf) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 },
    );
  }

  // ── 4. Read the target's current role from adminUsers ─────────────────
  const targetSnap = await admin
    .firestore(app)
    .collection("adminUsers")
    .doc(targetUid)
    .get();

  if (!targetSnap.exists) {
    // No adminUsers doc — clear the claim so a removed user loses access
    await admin
      .auth(app)
      .setCustomUserClaims(targetUid, { adminRole: null });
    return NextResponse.json({ uid: targetUid, adminRole: null });
  }

  const targetData = targetSnap.data();
  const role =
    targetData?.active === false ? null : (targetData?.role ?? null);

  // ── 5. Write the custom claim ──────────────────────────────────────────
  await admin
    .auth(app)
    .setCustomUserClaims(targetUid, { adminRole: role ?? null });

  return NextResponse.json({ uid: targetUid, adminRole: role });
}
