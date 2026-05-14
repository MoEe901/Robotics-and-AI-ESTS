import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Firebase Admin for server-only usage (API routes, seed script).
 * Prefer `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string) or Application Default Credentials.
 */
export function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim();

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    let cred: Record<string, string>;
    try {
      cred = JSON.parse(json) as Record<string, string>;
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Firebase Admin: FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON: ${detail}`,
      );
    }
    return initializeApp({
      credential: cert(cred as Parameters<typeof cert>[0]),
      projectId: projectId || cred.project_id,
    });
  }

  if (!projectId) {
    throw new Error(
      "Firebase Admin: set FIREBASE_SERVICE_ACCOUNT_JSON, or set " +
        "FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID with Application Default Credentials.",
    );
  }
  return initializeApp({ projectId });
}

let _db: Firestore | undefined;

export function getAdminFirestore(): Firestore {
  if (!_db) {
    const app = getFirebaseAdminApp();
    _db = getFirestore(app);
    // Use REST instead of gRPC — avoids gRPC crashes on Node v26
    _db.settings({ preferRest: true });
  }
  return _db;
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}
