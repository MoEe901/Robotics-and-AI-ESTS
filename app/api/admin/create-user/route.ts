import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { getFirebaseAdminApp } from "@/lib/server/firebase-admin";

const ROLES = ["admin", "editor", "moderator", "viewer"] as const;
type Role = (typeof ROLES)[number];

/**
 * POST /api/admin/create-user
 *
 * Creates a Firebase Auth user by email (if they don't already exist),
 * writes an adminUsers/{uid} document with the given role, and sends
 * an invite email with a password-set link via Resend.
 *
 * Body: { email: string, role: Role, active?: boolean }
 *
 * Requires a valid Firebase ID token in the Authorization header
 * belonging to a provisioned admin (adminUsers/{uid}.role === "admin").
 */
export async function POST(request: NextRequest) {
  // ── 1. Verify the caller's ID token ──────────────────────────────────
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

  // ── 2. Verify caller has admin role ───────────────────────────────────
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

  // ── 3. Parse and validate request body ───────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const raw = body as Record<string, unknown>;
  const emailRaw = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!emailRaw) {
    return NextResponse.json(
      { error: "Missing required field: email." },
      { status: 400 },
    );
  }
  const email = emailRaw.toLowerCase();

  const roleRaw =
    typeof raw.role === "string"
      ? raw.role.trim().toLowerCase()
      : "viewer";
  if (!(ROLES as readonly string[]).includes(roleRaw)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${ROLES.join(", ")}.` },
      { status: 400 },
    );
  }
  const role = roleRaw as Role;
  const active = raw.active !== false;

  // ── 4. Get or create the Firebase Auth account ────────────────────────
  let uid: string;
  let isNewUser = false;

  try {
    const existing = await admin.auth(app).getUserByEmail(email);
    uid = existing.uid;
  } catch (err) {
    if ((err as { code?: string }).code !== "auth/user-not-found") {
      return NextResponse.json(
        { error: "Auth lookup failed." },
        { status: 500 },
      );
    }
    // User doesn't exist — create them
    try {
      const created = await admin.auth(app).createUser({ email });
      uid = created.uid;
      isNewUser = true;
    } catch (createErr) {
      return NextResponse.json(
        {
          error:
            createErr instanceof Error
              ? createErr.message
              : "Failed to create Firebase Auth user.",
        },
        { status: 500 },
      );
    }
  }

  // ── 5. Write adminUsers document ──────────────────────────────────────
  const ts = admin.firestore.FieldValue.serverTimestamp();
  try {
    await admin
      .firestore(app)
      .collection("adminUsers")
      .doc(uid)
      .set(
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
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to write adminUsers document.",
      },
      { status: 500 },
    );
  }

  // ── 6. Set custom claim so Firestore list rules work without get() ───────
  // Best-effort — failure does not block the response.
  try {
    await admin
      .auth(app)
      .setCustomUserClaims(uid, { adminRole: active ? role : null });
  } catch {
    // Non-fatal
  }

  // ── 7. Send invite email (new users only, best-effort) ─────────────────
  const siteUrl =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") ||
    "http://localhost:3000";
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  let inviteSent = false;
  let inviteLink: string | undefined;

  if (isNewUser) {
    try {
      inviteLink = await admin
        .auth(app)
        .generatePasswordResetLink(email, {
          url: `${siteUrl}/admin/login`,
        });

      if (resendKey && fromEmail) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: fromEmail,
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
      }
    } catch {
      // Non-fatal — user and Firestore doc are already created.
      // The caller can see inviteSent: false and share the link manually.
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
