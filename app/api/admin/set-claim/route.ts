import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore, getAdminAuth } from "@/lib/server/firebase-admin";

/**
 * POST /api/admin/set-claim
 *
 * Reads the role stored in adminUsers/{targetUid} and writes it as a
 * Firebase Custom Claim `adminRole` on that user's auth token.
 *
 * Body: { targetUid: string }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const idToken = authHeader.slice(7);

  const auth = getAdminAuth();
  const db = getAdminFirestore();

  let callerUid: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const targetUid =
    typeof (body as Record<string, unknown>).targetUid === "string"
      ? ((body as Record<string, unknown>).targetUid as string).trim()
      : "";
  if (!targetUid) {
    return NextResponse.json({ error: "Missing required field: targetUid." }, { status: 400 });
  }

  const callerSnap = await db.collection("adminUsers").doc(callerUid).get();
  const callerData = callerSnap.data();
  const callerIsAdmin = callerSnap.exists && callerData?.active !== false && callerData?.role === "admin";
  const isSelf = targetUid === callerUid;

  if (!callerIsAdmin && !isSelf) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const targetSnap = await db.collection("adminUsers").doc(targetUid).get();

  if (!targetSnap.exists) {
    await auth.setCustomUserClaims(targetUid, { adminRole: null });
    return NextResponse.json({ uid: targetUid, adminRole: null });
  }

  const targetData = targetSnap.data();
  const role = targetData?.active === false ? null : (targetData?.role ?? null);

  await auth.setCustomUserClaims(targetUid, { adminRole: role ?? null });

  return NextResponse.json({ uid: targetUid, adminRole: role });
}
