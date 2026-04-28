import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

import { getFirebaseAdminApp } from "@/lib/server/firebase-admin";

/**
 * POST /api/admin/resend-invite
 *
 * Generates a fresh password-reset link for any existing Firebase Auth user
 * and returns it so the caller can share it manually.
 *
 * Body: { email: string }
 *
 * Caller must be a provisioned admin (adminUsers/{uid}.role === "admin").
 */
export async function POST(request: NextRequest) {
  // ── 1. Verify caller's ID token ───────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  // ── 2. Verify caller is admin ─────────────────────────────────────────
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

  // ── 3. Parse body ─────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const email =
    typeof (body as Record<string, unknown>).email === "string"
      ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
      : "";
  if (!email) {
    return NextResponse.json(
      { error: "Missing required field: email." },
      { status: 400 },
    );
  }

  // ── 4. Confirm user exists in Firebase Auth ───────────────────────────
  try {
    await admin.auth(app).getUserByEmail(email);
  } catch {
    return NextResponse.json(
      { error: "No Firebase Auth account found for that email." },
      { status: 404 },
    );
  }

  // ── 5. Generate password-reset link ──────────────────────────────────
  const siteUrl =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") ||
    "http://localhost:3000";

  try {
    const link = await admin.auth(app).generatePasswordResetLink(email, {
      url: `${siteUrl}/admin/login`,
    });
    return NextResponse.json({ link });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate link.",
      },
      { status: 500 },
    );
  }
}
