"use client";

import { doc, onSnapshot, type DocumentReference, type FirestoreError } from "firebase/firestore";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { db } from "@/lib/firebase";
import { logFirestoreListenerError } from "@/lib/firebase/firestore-listener-log";

export type FirestoreDocState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Subscribes to a single Firestore document. `path` is stable (e.g. `siteContent/hero`).
 * Memoizes the DocumentReference so changing unrelated state does not re-subscribe.
 */
export function useFirestoreDoc<T>(
  path: string | null,
  parse: (raw: Record<string, unknown>, id: string) => T | null,
): FirestoreDocState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<Error | null>(null);
  const parseRef = useRef(parse);
  useLayoutEffect(() => {
    parseRef.current = parse;
  }, [parse]);

  const ref = useMemo<DocumentReference | null>(() => {
    if (!path) return null;
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2 || parts.length % 2 !== 0) {
      console.warn("[useFirestoreDoc] Invalid path:", path);
      return null;
    }
    return doc(db(), ...(parts as [string, string, ...string[]]));
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    const run = (fn: () => void) => {
      queueMicrotask(() => {
        if (!cancelled) fn();
      });
    };

    if (!ref) {
      run(() => {
        setData(null);
        setLoading(false);
        setError(null);
      });
      return () => {
        cancelled = true;
      };
    }

    run(() => {
      setLoading(true);
      setError(null);
    });

    const unsub = onSnapshot(
      ref,
      (snap) => {
        try {
          if (!snap.exists()) {
            setData(null);
          } else {
            const parsed = parseRef.current(snap.data() as Record<string, unknown>, snap.id);
            setData(parsed);
          }
          setLoading(false);
        } catch (e) {
          console.error("[useFirestoreDoc] parse error", e);
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      },
      (err: FirestoreError) => {
        logFirestoreListenerError(`useFirestoreDoc path=${path ?? "null"}`, err);
        console.error("[useFirestoreDoc] snapshot error", path, err);
        setError(err);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [path, ref]);

  return { data, loading, error };
}
