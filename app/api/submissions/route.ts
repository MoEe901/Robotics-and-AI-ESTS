import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/server/firebase-admin";
import { escapeHtml } from "@/lib/escape-html";
import { getApplyFormNotificationRecipients } from "@/lib/submission-notifications";
import { sendEmail } from "@/lib/send-email";

const submissionSchema = z.object({
  formId: z.string().min(1).max(60),
  fields: z.record(z.string(), z.string().max(2000)).refine(
    (obj) => Object.keys(obj).length > 0,
  ),
  website: z.string().optional(),
});

function ipHash(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

async function sendNotification(
  id: string,
  formId: string,
  fields: Record<string, string>,
): Promise<void> {
  const to = await getApplyFormNotificationRecipients();
  if (to.length === 0) {
    console.warn(
      "[submissions] No notification recipients. " +
        "Set siteConfig/submissionNotifications in admin or ADMIN_NOTIFICATION_EMAIL.",
    );
    return;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const subjectFirst = Object.values(fields)[0] ?? "Robotics & AI Club";
  const safeFormId = escapeHtml(formId);
  const safeId = encodeURIComponent(id);
  const rows = Object.entries(fields)
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
    subject: `New ${formId} submission — ${subjectFirst}`,
    html:
      `<div style="font-family:Arial,sans-serif;max-width:600px;">` +
      `<h2 style="color:#1a1a2e;">New ${safeFormId} submission</h2>` +
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
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  // Honeypot field -- bots fill it, real users never see it.
  if ((parsed.data.website || "").trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ua = request.headers.get("user-agent") || "unknown";
  const ip = getClientIp(request);
  const uaKey = `${ua}#${ipHash(ip)}`;

  const db = getAdminFirestore();

  // Rate limit check
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  let recentCount = 0;
  try {
    const recent = await db
      .collection("submissions")
      .where("userAgent", "==", uaKey)
      .where("submittedAt", ">=", oneHourAgo)
      .limit(10)
      .get();
    recentCount = recent.size;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[submissions] rate-limit read skipped:", msg);
    }
  }

  if (recentCount >= 5) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions." },
      { status: 429 },
    );
  }

  let refId: string;
  try {
    const ref = await db.collection("submissions").add({
      formId: parsed.data.formId,
      fields: parsed.data.fields,
      submittedAt: FieldValue.serverTimestamp(),
      userAgent: uaKey,
      status: "new",
      readAt: null,
      notes: "",
      notificationSent: false,
      notificationError: "",
    });
    refId = ref.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[submissions] write failed", msg);
    return NextResponse.json(
      { ok: false, error: "Submission could not be saved." },
      { status: 500 },
    );
  }

  void sendNotification(refId, parsed.data.formId, parsed.data.fields)
    .then(async () => {
      await db.collection("submissions").doc(refId).update({
        notificationSent: true,
        notificationError: "",
      });
    })
    .catch(async (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[submissions] email failed", msg);
      await db.collection("submissions").doc(refId).update({
        notificationSent: false,
        notificationError: msg.slice(0, 500),
      });
    });

  return NextResponse.json({ ok: true, id: refId }, { status: 201 });
}
