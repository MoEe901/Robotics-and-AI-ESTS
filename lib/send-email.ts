import nodemailer from "nodemailer";

import { getAdminFirestore } from "@/lib/server/firebase-admin";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
};

/**
 * Reads the active email credentials from Firestore (siteConfig/emailSettings).
 * Falls back to GMAIL_USER / GMAIL_APP_PASSWORD env vars if Firestore has nothing.
 * Returns null if notifications are disabled or no credentials are available.
 */
async function getEmailCredentials(): Promise<{
  user: string;
  pass: string;
  senderName: string;
} | null> {
  try {
    const db = getAdminFirestore();
    const snap = await db.doc("siteConfig/emailSettings").get();

    if (snap.exists) {
      const data = snap.data() as Record<string, unknown>;

      // Check the enabled flag — if explicitly false, skip
      if (data.enabled === false) {
        console.info("[send-email] Notifications disabled in admin panel, skipping.");
        return null;
      }

      const email = typeof data.activeEmail === "string" ? data.activeEmail.trim() : "";
      const password = typeof data.activePassword === "string" ? data.activePassword.trim() : "";
      const senderName =
        typeof data.senderName === "string" && data.senderName.trim()
          ? data.senderName.trim()
          : "Robotics & AI Club";

      if (email && password) {
        return { user: email, pass: password, senderName };
      }
    }
  } catch (err) {
    console.warn("[send-email] Could not read Firestore email settings, trying env vars.", err);
  }

  // Fallback to env vars
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("[send-email] No email credentials available, skipping.");
    return null;
  }

  return { user, pass, senderName: "Robotics & AI Club" };
}

/**
 * Send an email via Gmail SMTP using Nodemailer.
 * Reads credentials from Firestore admin settings (with env fallback).
 * Respects the enabled/disabled toggle from the admin panel.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const creds = await getEmailCredentials();
  if (!creds) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: creds.user, pass: creds.pass },
  });

  const recipients = Array.isArray(to) ? to.join(", ") : to;

  await transporter.sendMail({
    from: `"${creds.senderName}" <${creds.user}>`,
    to: recipients,
    subject,
    html,
  });
}
