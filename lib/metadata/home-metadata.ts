import type { Metadata } from "next";

const FALLBACK: Metadata = {
  title: "Robotics & AI Club · EST Safi",
  description:
    "A university tech community building the future through robotics, AI, and collaboration — EST Safi, Morocco.",
};

/**
 * Server-side read for SEO; falls back if Admin SDK is not configured (e.g. local dev without credentials).
 */
export async function buildHomeMetadata(): Promise<Metadata> {
  try {
    const { getAdminFirestore } = await import("@/lib/server/firebase-admin");
    const db = getAdminFirestore();
    const snap = await db.collection("siteContent").doc("hero").get();
    if (!snap.exists) return FALLBACK;
    const d = snap.data() as Record<string, unknown>;
    const lines = Array.isArray(d.titleLines)
      ? (d.titleLines as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [];
    const titleBase =
      lines.length > 0 ? lines.join(" ") : typeof d.description === "string" ? d.description.slice(0, 48) : null;
    const title = titleBase ? `${titleBase} · EST Safi` : (FALLBACK.title as string);
    const description =
      typeof d.description === "string" && d.description.trim()
        ? d.description.trim().slice(0, 200)
        : (FALLBACK.description as string);
    return { title, description };
  } catch {
    return FALLBACK;
  }
}
