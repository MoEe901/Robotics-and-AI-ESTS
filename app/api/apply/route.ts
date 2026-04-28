import { NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { Resend } from "resend";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import { getApplyFormNotificationRecipients } from "@/lib/submission-notifications";

const applySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  educationYear: z.string().trim().min(1),
  department: z.string().trim().min(1),
  // Must have a real TLD (≥ 2 chars) — rejects obvious dummy addresses
  email: z
    .string()
    .trim()
    .email()
    .regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, "Invalid email format."),
  // Digits only; optional leading + once; at least 6 digits
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{6,}$/, "Phone must contain only digits (optional leading +)."),
  message: z.string().trim().max(4000).optional(),
});

/** Escape HTML special characters to prevent XSS in email clients. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendApplyNotification(
  id: string,
  data: z.infer<typeof applySchema>,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[apply] RESEND_API_KEY missing, skipping email send.");
    return;
  }

  const to = await getApplyFormNotificationRecipients();
  if (to.length === 0) {
    console.warn(
      "[apply] No notification recipients. " +
        "Set siteConfig/submissionNotifications in admin or ADMIN_NOTIFICATION_EMAIL.",
    );
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const safeId = encodeURIComponent(id);

  const fields: [string, string][] = [
    ["First name", data.firstName],
    ["Last name", data.lastName],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Education year", data.educationYear],
    ["Department", data.department],
    ...(data.message ? [["Message", data.message] as [string, string]] : []),
  ];

  const rows = fields
    .map(
      ([k, v]) =>
        `<tr>` +
        `<td style="padding:6px 10px;border:1px solid #ddd;font-weight:600;">${escapeHtml(k)}</td>` +
        `<td style="padding:6px 10px;border:1px solid #ddd;">${escapeHtml(v)}</td>` +
        `</tr>`,
    )
    .join("");

  await resend.emails.send({
    from,
    to,
    subject: `New Apply submission — ${data.firstName} ${data.lastName}`,
    html:
      `<div style="font-family:Arial,sans-serif">` +
      `<h3>New club application</h3>` +
      `<table style="border-collapse:collapse">${rows}</table>` +
      `<p><a href="${site}/admin/submissions/${safeId}">Open in admin</a></p>` +
      `</div>`,
  });
}

export async function POST(request: Request) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const message =
    parsed.data.message && parsed.data.message.length > 0
      ? parsed.data.message
      : undefined;

  let ref;
  try {
    ref = await addDoc(collection(db(), "applySubmissions"), {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      educationYear: parsed.data.educationYear,
      department: parsed.data.department,
      email: parsed.data.email,
      phone: parsed.data.phone,
      ...(message ? { message } : {}),
      createdAt: serverTimestamp(),
      notificationSent: false,
      notificationError: "",
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Application write failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }

  // Send notification email — fire-and-forget so it doesn't delay the response.
  void sendApplyNotification(ref.id, parsed.data)
    .then(async () => {
      await updateDoc(ref, { notificationSent: true, notificationError: "" });
    })
    .catch(async (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[apply] email failed", msg);
      await updateDoc(ref, {
        notificationSent: false,
        notificationError: msg.slice(0, 500),
      });
    });

  return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
}
