import { getApps, initializeApp, setLogLevel, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function messagingSenderIdValue(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  );
}

/** Non-throwing check for API routes / guards (same fields as runtime assert). */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey?.trim() &&
      firebaseConfig.authDomain?.trim() &&
      firebaseConfig.projectId?.trim() &&
      firebaseConfig.storageBucket?.trim() &&
      firebaseConfig.appId?.trim() &&
      messagingSenderIdValue()?.trim(),
  );
}

function assertFirebaseConfigForRuntime(): void {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.appId?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  if (!messagingSenderIdValue()?.trim()) {
    missing.push("NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID or NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  }
  if (missing.length) {
    throw new Error(
      `Firebase misconfigured — missing or empty: ${missing.join(", ")}. Fix .env.local (projectId empty causes Firestore path projects//...).`,
    );
  }

  if (process.env.NODE_ENV === "development") {
    const pid = firebaseConfig.projectId!.trim();
    console.log("[Firebase] PROJECT_ID:", pid);
    if (!pid) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID resolved empty after trim");
    }
  }
}

// Suppress noisy transport-level warnings (e.g. "WebChannelConnection ... transport errored.
// Name: undefined Message: undefined") — these are benign retries from long-polling HTTP aborts.
// Real permission errors still surface via each onSnapshot's error callback.
if (typeof window !== "undefined") {
  setLogLevel("error");
}

let appSingleton: FirebaseApp | undefined;
let dbSingleton: Firestore | undefined;
let storageSingleton: FirebaseStorage | undefined;
let authSingleton: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  assertFirebaseConfigForRuntime();
  if (!appSingleton) {
    appSingleton = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return appSingleton;
}

/**
 * Firestore client — lazy init, validated projectId, long-polling (avoids flaky streams in dev / some networks).
 * Do not use IndexedDB persistence here (multi-tab / Turbopack / quota issues).
 * experimentalLongPollingOptions.timeoutSeconds: proactively recycle each HTTP long-poll request
 * before the browser aborts it, which eliminates "transport errored Name: undefined" noise.
 */
export function db(): Firestore {
  if (!dbSingleton) {
    dbSingleton = initializeFirestore(getFirebaseApp(), {
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: { timeoutSeconds: 30 },
    });
  }
  return dbSingleton;
}

export function storage(): FirebaseStorage {
  if (!storageSingleton) {
    storageSingleton = getStorage(getFirebaseApp());
  }
  return storageSingleton;
}

/** Firebase Auth — use only from client components (browser). */
export function auth(): Auth {
  assertFirebaseConfigForRuntime();
  if (!authSingleton) {
    authSingleton = getAuth(getFirebaseApp());
  }
  return authSingleton;
}
