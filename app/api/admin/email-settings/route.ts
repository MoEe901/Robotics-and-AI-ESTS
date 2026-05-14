import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore, getAdminAuth } from "@/lib/server/firebase-admin";

const DOC_PATH = "siteConfig/emailSettings";

/**
 * GET /api/admin/email-settings
 *
 * Returns the current email settings (credentials are masked for security).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const auth = getAdminAuth();
  const db = getAdminFirestore();

  let callerUid: string;
  try {
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const callerSnap = await db.collection("adminUsers").doc(callerUid).get();
  const callerData = callerSnap.data();
  if (!callerSnap.exists || callerData?.active === false || callerData?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const snap = await db.doc(DOC_PATH).get();
  const data = snap.exists ? (snap.data() as Record<string, unknown>) : {};

  // Fall back to env vars if Firestore has no email/password yet
  const envUser = process.env.GMAIL_USER ?? "";
  const envPass = process.env.GMAIL_APP_PASSWORD ?? "";

  const activeEmail =
    typeof data.activeEmail === "string" && data.activeEmail.trim()
      ? data.activeEmail.trim()
      : envUser;
  const activePassword =
    typeof data.activePassword === "string" && data.activePassword.trim()
      ? data.activePassword.trim()
      : envPass;

  // Mask the password for display
  const masked = activePassword
    ? activePassword.slice(0, 4) + "••••••••" + activePassword.slice(-2)
    : "";

  // Parse saved presets — mask their passwords too
  const presetsRaw = Array.isArray(data.presets) ? data.presets : [];
  const presets = presetsRaw.map((p: Record<string, unknown>) => ({
    email: typeof p.email === "string" ? p.email : "",
    password: typeof p.password === "string"
      ? p.password.slice(0, 4) + "••••••••" + p.password.slice(-2)
      : "",
    label: typeof p.label === "string" ? p.label : "",
  }));

  return NextResponse.json({
    enabled: data.enabled !== false,
    activeEmail,
    activePasswordMasked: masked,
    hasPassword: activePassword.length > 0,
    senderName: typeof data.senderName === "string" && data.senderName.trim()
      ? data.senderName.trim()
      : "Robotics & AI Club",
    presets,
  });
}

/**
 * POST /api/admin/email-settings
 *
 * Updates email settings. All fields optional (merge).
 * Body: { enabled?, activeEmail?, activePassword?, senderName?, presets?, action? }
 *
 * action: "activate-preset" + presetIndex — copies a preset into active slot
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const auth = getAdminAuth();
  const db = getAdminFirestore();

  let callerUid: string;
  try {
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const callerSnap = await db.collection("adminUsers").doc(callerUid).get();
  const callerData = callerSnap.data();
  if (!callerSnap.exists || callerData?.active === false || callerData?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ref = db.doc(DOC_PATH);
  const existing = await ref.get();
  const current = existing.exists ? (existing.data() as Record<string, unknown>) : {};

  // Handle "activate-preset" action
  if (body.action === "activate-preset" && typeof body.presetIndex === "number") {
    const presets = Array.isArray(current.presets) ? current.presets : [];
    const preset = presets[body.presetIndex] as Record<string, unknown> | undefined;
    if (!preset) {
      return NextResponse.json({ error: "Preset not found." }, { status: 404 });
    }
    await ref.set(
      {
        activeEmail: preset.email,
        activePassword: preset.password,
        senderName: preset.label || current.senderName || "Robotics & AI Club",
      },
      { merge: true },
    );
    return NextResponse.json({ ok: true, message: "Preset activated." });
  }

  // Handle "delete preset" action
  if (typeof body.deletePresetIndex === "number") {
    const presets = Array.isArray(current.presets) ? [...current.presets] : [];
    if (body.deletePresetIndex >= 0 && body.deletePresetIndex < presets.length) {
      presets.splice(body.deletePresetIndex, 1);
      await ref.set({ presets }, { merge: true });
      return NextResponse.json({ ok: true, message: "Preset removed." });
    }
    return NextResponse.json({ error: "Invalid preset index." }, { status: 400 });
  }

  // Build update
  const update: Record<string, unknown> = {};

  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  if (typeof body.activeEmail === "string") update.activeEmail = body.activeEmail.trim();
  if (typeof body.activePassword === "string") update.activePassword = body.activePassword.trim();
  if (typeof body.senderName === "string") update.senderName = body.senderName.trim();

  // Save presets (full array replacement)
  if (Array.isArray(body.presets)) {
    update.presets = body.presets
      .slice(0, 10)
      .map((p: Record<string, unknown>) => ({
        email: typeof p.email === "string" ? p.email.trim() : "",
        password: typeof p.password === "string" ? p.password.trim() : "",
        label: typeof p.label === "string" ? p.label.trim() : "",
      }))
      .filter((p: { email: string }) => p.email.length > 0);
  }

  // Save current active into presets if "saveToPresets" flag
  if (body.saveToPresets === true) {
    const email = (update.activeEmail as string) || (current.activeEmail as string) || "";
    const password = (update.activePassword as string) || (current.activePassword as string) || "";
    const label = (update.senderName as string) || (current.senderName as string) || "";
    if (email && password) {
      const existingPresets = Array.isArray(current.presets) ? [...current.presets] : [];
      // Don't duplicate
      const alreadyExists = existingPresets.some(
        (p: Record<string, unknown>) => p.email === email,
      );
      if (!alreadyExists) {
        existingPresets.push({ email, password, label });
        update.presets = existingPresets.slice(0, 10);
      }
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, message: "Nothing to update." });
  }

  await ref.set(update, { merge: true });
  return NextResponse.json({ ok: true, message: "Email settings saved." });
}
