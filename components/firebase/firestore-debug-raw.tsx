"use client";

import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect } from "react";

import { db, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Phase-1 debug: ONE raw subscription for the whole app (dev-only).
 * Do not duplicate per page — avoids triple listeners and excess reads.
 */
export function FirestoreDebugRawTeamMembers() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    console.log("ENV CHECK:", {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    });

    if (!isFirebaseConfigured()) {
      console.warn(
        "[Firebase] Skipping Firestore debug listener — fill web/.env.local with all NEXT_PUBLIC_FIREBASE_* values from Firebase Console, then restart `npm run dev`.",
      );
      return;
    }

    const unsub = onSnapshot(
      query(
        collection(db(), "teamMembers"),
        where("isActive", "==", true),
        where("isVisible", "==", true),
        limit(200),
      ),
      (snapshot) => {
        console.log("[Firestore DEBUG] RAW SNAPSHOT SIZE:", snapshot.size);
        if (snapshot.size === 0) {
          console.warn(
            "[Firestore DEBUG] snapshot.size === 0 — check: empty collection, collection name, or security rules",
          );
        }
      },
      (error) => {
        console.error("[Firestore ERROR]:", error);
        const code = error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : "";
        if (code) console.error("[Firestore ERROR] code:", code);
      },
    );

    return () => unsub();
  }, []);

  return null;
}
