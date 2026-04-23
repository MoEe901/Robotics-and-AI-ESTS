/**
 * Dev-only helper for diagnosing Firestore permission issues on public listeners.
 * Strip or narrow if logs become noisy.
 */
export function logFirestoreListenerError(context: string, err: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  const o = err as { code?: string; message?: string };
  const code = typeof o?.code === "string" ? o.code : "";
  const message = typeof o?.message === "string" ? o.message : String(err);
  if (code === "permission-denied" || message.includes("permission")) {
    console.error(`[Firestore listener] ${context}`, { code, message });
  }
}
