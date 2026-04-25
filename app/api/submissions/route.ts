import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { Resend } from "resend";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import { getApplyFormNotificationRecipients } from "@/lib/submission-notifications";

const submissionSchema = z.object({
  formId: z.string().min(1).max(60),
  fields: z.record(z.string(), z.string().max(2000)).refine((obj) => Object.keys(obj).length > 0),
  website: z.string().optional(),
});

function ipHash(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getClientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function sendNotification(id: string, formId: string, fields: Record<string, string>): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[submissions] RESEND_API_KEY missing, skipping email send.");
    return;
  }
  const to = await getApplyFormNotificationRecipients();
  if (to.length === 0) {
    console.warn(
      "[submissions] No notification recipients — set siteConfig/submissionNotifications in admin or ADMIN_NOTIFICATION_EMAIL.",
    );
    return;
  }
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const first = Object.values(fields)[0] || "Robotics & AI Club";
  const rows = Object.entries(fields)
    .map(
      ([k, v]) =>
        `<tr><td style=\"padding:6px 10px;border:1px solid #ddd;font-weight:600;\">${k}</td><td style=\"padding:6px 10px;border:1px solid #ddd;\">${v}</td></tr>`,
    )
    .join("");

  await resend.emails.send({
    from,
    to: to.length === 1 ? to[0]! : to,
    subject: `New ${formId} submission — ${first}`,
    html: `<div style="font-family:Arial,sans-serif"><h3>New ${formId} submission</h3><table style="border-collapse:collapse">${rows}</table><p><a href="${site}/admin/submissions/${id}">Open in admin</a></p></div>`,
  });
}

export async function POST(request: Request) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Firebase is not configured.", status: 503 }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON.", status: 400 }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload.", status: 400 }, { status: 400 });
  }

  if ((parsed.data.website || "").trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ua = request.headers.get("user-agent") || "unknown";
  const ip = getClientIp(request);
  const uaKey = `${ua}#${ipHash(ip)}`;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  let recentCount = 0;
  try {
    const recent = await getDocs(
      query(collection(db(), "submissions"), where("userAgent", "==", uaKey), limit(25)),
    );
    for (const d of recent.docs) {
      const t = d.data().submittedAt;
      if (typeof t?.toMillis === "function" && t.toMillis() >= oneHourAgo) recentCount += 1;
    }
  } catch (e) {
    // Rules may intentionally block anonymous reads on submissions.
    // Keep create path functional; stronger rate limiting should move to Redis/service layer.
    if (process.env.NODE_ENV === "development") {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[submissions] rate-limit read skipped:", msg);
    }
  }
  // Production-grade rate limiting needs Redis; this MVP is Firestore-based only.
  if (recentCount >= 5) {
    return NextResponse.json({ ok: false, error: "Too many submissions.", status: 429 }, { status: 429 });
  }

  let ref;
  try {
    ref = await addDoc(collection(db(), "submissions"), {
      formId: parsed.data.formId,
      fields: parsed.data.fields,
      submittedAt: serverTimestamp(),
      userAgent: uaKey,
      status: "new",
      readAt: null,
      notes: "",
      notificationSent: false,
      notificationError: "",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg, status: 403 }, { status: 403 });
  }

  void sendNotification(ref.id, parsed.data.formId, parsed.data.fields)
    .then(async () => {
      await updateDoc(ref, { notificationSent: true, notificationError: "" });
    })
    .catch(async (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[submissions] email failed", msg);
      await updateDoc(ref, { notificationSent: false, notificationError: msg.slice(0, 500) });
    });

  return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
}
