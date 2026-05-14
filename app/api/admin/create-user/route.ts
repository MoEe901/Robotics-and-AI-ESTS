import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore, getAdminAuth } from "@/lib/server/firebase-admin";
import { sendEmail } from "@/lib/send-email";

const ROLES = ["admin", "editor", "moderator", "viewer"] as const;
type Role = (typeof ROLES)[number];

/**
 * POST /api/admin/create-user
 *
 * Creates a Firebase Auth user by email (if they don't already exist),
 * writes an adminUsers/{uid} document with the given role, and sends
 * an invite email with a password-set link.
 *
 * Body: { email: string, role: Role, active?: boolean }
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

  const raw = body as Record<string, unknown>;
  const emailRaw = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!emailRaw) {
    return NextResponse.json({ error: "Missing required field: email." }, { status: 400 });
  }
  const email = emailRaw.toLowerCase();

  const roleRaw = typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "viewer";
  if (!(ROLES as readonly string[]).includes(roleRaw)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${ROLES.join(", ")}.` },
      { status: 400 },
    );
  }
  const role = roleRaw as Role;
  const active = raw.active !== false;

  let uid: string;
  let isNewUser = false;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
  } catch (err) {
    if ((err as { code?: string }).code !== "auth/user-not-found") {
      return NextResponse.json({ error: "Auth lookup failed." }, { status: 500 });
    }
    try {
      const created = await auth.createUser({ email });
      uid = created.uid;
      isNewUser = true;
    } catch (createErr) {
      return NextResponse.json(
        { error: createErr instanceof Error ? createErr.message : "Failed to create Firebase Auth user." },
        { status: 500 },
      );
    }
  }

  const ts = FieldValue.serverTimestamp();
  try {
    await db.collection("adminUsers").doc(uid).set(
      {
        email,
        role,
        active,
        updatedAt: ts,
        ...(isNewUser ? { createdAt: ts } : {}),
      },
      { merge: true },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write adminUsers document." },
      { status: 500 },
    );
  }

  try {
    await auth.setCustomUserClaims(uid, { adminRole: active ? role : null });
  } catch {
    // Non-fatal
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";

  let inviteSent = false;
  let inviteLink: string | undefined;

  if (isNewUser) {
    try {
      inviteLink = await auth.generatePasswordResetLink(email, { url: `${siteUrl}/admin/login` });

      await sendEmail({
        to: email,
        subject: "You have been invited to the admin panel",
        html: [
          "<p>You have been added to the Robotics &amp; AI Club",
          ` admin panel with the <strong>${role}</strong> role.</p>`,
          "<p>Click the link below to set your password and sign in:</p>",
          `<p><a href="${inviteLink}">Set your password</a></p>`,
          "<p>After setting your password, sign in at:<br>",
          `<a href="${siteUrl}/admin/login">${siteUrl}/admin/login</a></p>`,
          "<p><em>This link expires in 1 hour.</em></p>",
        ].join(""),
      });
      inviteSent = true;
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({
    uid,
    email,
    isNewUser,
    inviteSent,
    inviteLink: !inviteSent ? inviteLink : undefined,
  });
}
