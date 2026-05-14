import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/server/firebase-admin";
import { escapeHtml } from "@/lib/escape-html";
import { getApplyFormNotificationRecipients } from "@/lib/submission-notifications";
import { sendEmail } from "@/lib/send-email";

const applySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  educationYear: z.string().trim().min(1),
  department: z.string().trim().min(1),
  email: z
    .string()
    .trim()
    .email()
    .regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, "Invalid email format."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{6,}$/, "Phone must contain only digits (optional leading +)."),
  message: z.string().trim().max(4000).optional(),
});

async function sendApplyNotification(
  id: string,
  data: z.infer<typeof applySchema>,
): Promise<void> {
  const to = await getApplyFormNotificationRecipients();
  if (to.length === 0) {
    console.warn(
      "[apply] No notification recipients. " +
        "Set siteConfig/submissionNotifications in admin or ADMIN_NOTIFICATION_EMAIL.",
    );
    return;
  }

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
        `<td style="padding:8px 12px;border:1px solid #e0e0e0;font-weight:600;background:#f8f9fa;">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 12px;border:1px solid #e0e0e0;">${escapeHtml(v)}</td>` +
        `</tr>`,
    )
    .join("");

  await sendEmail({
    to,
    subject: `New Apply submission — ${data.firstName} ${data.lastName}`,
    html:
      `<div style="font-family:Arial,sans-serif;max-width:600px;">` +
      `<h2 style="color:#1a1a2e;">New Club Application</h2>` +
      `<table style="border-collapse:collapse;width:100%;margin:16px 0;">${rows}</table>` +
      `<p style="margin-top:16px;"><a href="${site}/admin/submissions/${safeId}" style="color:#0066cc;">Open in admin panel</a></p>` +
      `<hr style="border:none;border-top:1px solid #eee;margin-top:24px;">` +
      `<p style="font-size:12px;color:#999;">Robotics & AI Club · EST Safi, Morocco</p>` +
      `</div>`,
  });
}

export async function POST(request: Request) {
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

  const db = getAdminFirestore();

  let refId: string;
  try {
    const ref = await db.collection("applySubmissions").add({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      educationYear: parsed.data.educationYear,
      department: parsed.data.department,
      email: parsed.data.email,
      phone: parsed.data.phone,
      ...(message ? { message } : {}),
      createdAt: FieldValue.serverTimestamp(),
      notificationSent: false,
      notificationError: "",
    });
    refId = ref.id;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Application write failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }

  void sendApplyNotification(refId, parsed.data)
    .then(async () => {
      await db.collection("applySubmissions").doc(refId).update({
        notificationSent: true,
        notificationError: "",
      });
    })
    .catch(async (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[apply] email failed", msg);
      await db.collection("applySubmissions").doc(refId).update({
        notificationSent: false,
        notificationError: msg.slice(0, 500),
      });
    });

  return NextResponse.json({ success: true, id: refId }, { status: 201 });
}
