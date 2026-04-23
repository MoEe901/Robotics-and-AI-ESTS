import * as admin from "firebase-admin";

/**
 * Firebase Admin for server-only usage (metadata, seed script).
 * Prefer `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string) or Application Default Credentials.
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (admin.apps.length) {
    return admin.app();
  }
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim();

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    const cred = JSON.parse(json) as admin.ServiceAccount;
    return admin.initializeApp({
      credential: admin.credential.cert(cred),
      projectId: projectId || cred.projectId,
    });
  }

  if (!projectId) {
    throw new Error(
      "Firebase Admin: set FIREBASE_SERVICE_ACCOUNT_JSON, or set FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID with Application Default Credentials.",
    );
  }
  return admin.initializeApp({ projectId });
}

export function getAdminFirestore(): admin.firestore.Firestore {
  getFirebaseAdminApp();
  return admin.firestore();
}
