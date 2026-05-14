import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore, getAdminAuth } from "@/lib/server/firebase-admin";

/**
 * GET /api/admin/lookup-user?email=name@example.com
 *
 * Looks up a Firebase Auth user by email and returns their UID.
 */
export async function GET(request: NextRequest) {
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

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Missing required query parameter: email." }, { status: 400 });
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email ?? email,
      displayName: userRecord.displayName ?? null,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/user-not-found") {
      return NextResponse.json({ error: "No Firebase Auth account found for this email address." }, { status: 404 });
    }
    return NextResponse.json({ error: "Lookup failed. Check server logs." }, { status: 500 });
  }
}
