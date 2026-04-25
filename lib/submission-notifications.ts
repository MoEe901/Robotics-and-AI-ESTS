import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

const DOC_ID = "submissionNotifications";

function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * Reads `siteConfig/submissionNotifications.applyFormRecipientEmails` (public read).
 * Falls back to `ADMIN_NOTIFICATION_EMAIL` env when the list is empty or missing.
 */
export async function getApplyFormNotificationRecipients(): Promise<string[]> {
  const envFallback = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  try {
    const snap = await getDoc(doc(db(), "siteConfig", DOC_ID));
    if (!snap.exists()) {
      return envFallback && isValidEmail(envFallback) ? [envFallback] : [];
    }
    const raw = snap.data() as Record<string, unknown>;
    const arr = Array.isArray(raw.applyFormRecipientEmails)
      ? raw.applyFormRecipientEmails
      : [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of arr) {
      if (typeof x !== "string") continue;
      const e = x.trim().toLowerCase();
      if (!isValidEmail(e) || seen.has(e)) continue;
      seen.add(e);
      out.push(e);
      if (out.length >= 12) break;
    }
    if (out.length > 0) return out;
  } catch {
    /* Firestore read failed — fall through */
  }
  return envFallback && isValidEmail(envFallback) ? [envFallback] : [];
}
