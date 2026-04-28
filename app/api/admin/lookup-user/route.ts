import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

import { getFirebaseAdminApp } from "@/lib/server/firebase-admin";

/**
 * GET /api/admin/lookup-user?email=name@example.com
 *
 * Looks up a Firebase Auth user by email and returns their UID.
 * Requires a valid Firebase ID token in the Authorization header
 * belonging to a provisioned admin (adminUsers/{uid}.role === "admin").
 */
export async function GET(request: NextRequest) {
  // ── 1. Verify the caller's ID token ──────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }
  const idToken = authHeader.slice(7);

  let callerUid: string;
  try {
    const app = getFirebaseAdminApp();
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 },
    );
  }

  // ── 2. Verify caller has admin role in adminUsers ─────────────────────
  const app = getFirebaseAdminApp();
  const callerSnap = await admin
    .firestore(app)
    .collection("adminUsers")
    .doc(callerUid)
    .get();
  const callerData = callerSnap.data();
  if (
    !callerSnap.exists ||
    callerData?.active === false ||
    callerData?.role !== "admin"
  ) {
    return NextResponse.json(
      { error: "Forbidden. Admin role required." },
      { status: 403 },
    );
  }

  // ── 3. Validate query param ───────────────────────────────────────────
  const email = request.nextUrl.searchParams
    .get("email")
    ?.trim()
    .toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "Missing required query parameter: email." },
      { status: 400 },
    );
  }

  // ── 4. Look up Firebase Auth user by email ────────────────────────────
  try {
    const userRecord = await admin.auth(app).getUserByEmail(email);
    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email ?? email,
      displayName: userRecord.displayName ?? null,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/user-not-found") {
      return NextResponse.json(
        {
          error:
            "No Firebase Auth account found for this email address.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Lookup failed. Check server logs." },
      { status: 500 },
    );
  }
}
