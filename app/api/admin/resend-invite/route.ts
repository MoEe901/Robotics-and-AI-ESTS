import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore, getAdminAuth } from "@/lib/server/firebase-admin";

/**
 * POST /api/admin/resend-invite
 *
 * Generates a fresh password-reset link for any existing Firebase Auth user
 * and returns it so the caller can share it manually.
 *
 * Body: { email: string }
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

  const callerSnap = await db.collection("adminUsers").doc(callerUid).get();
  const callerData = callerSnap.data();
  if (!callerSnap.exists || callerData?.active === false || callerData?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin role required." }, { status: 403 });
  }

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
    return NextResponse.json({ error: "Missing required field: email." }, { status: 400 });
  }

  try {
    await auth.getUserByEmail(email);
  } catch {
    return NextResponse.json({ error: "No Firebase Auth account found for that email." }, { status: 404 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";

  try {
    const link = await auth.generatePasswordResetLink(email, { url: `${siteUrl}/admin/login` });
    return NextResponse.json({ link });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate link." },
      { status: 500 },
    );
  }
}
