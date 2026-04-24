"use client";

import { onSnapshot, type FirestoreError, type Query } from "firebase/firestore";

import { logFirestoreListenerError } from "@/lib/firebase/firestore-listener-log";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type FirestoreCollectionState<T> = {
  data: T[];
  loading: boolean;
  error: Error | null;
};

/**
 * Subscribes to a Firestore Query built in a stable `useMemo` upstream.
 * Pass the same memoized `query` reference until constraints should change.
 */
export function useFirestoreCollection<T>(
  queryRef: Query | null,
  parseDoc: (raw: Record<string, unknown>, id: string) => T | null,
  /** Pass a stable label (e.g. `faq questions`) so dev logs identify the listener. */
  listenerLabel = "useFirestoreCollection",
): FirestoreCollectionState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(queryRef));
  const [error, setError] = useState<Error | null>(null);
  const parseRef = useRef(parseDoc);
  useLayoutEffect(() => {
    parseRef.current = parseDoc;
  }, [parseDoc]);

  useEffect(() => {
    let cancelled = false;
    const run = (fn: () => void) => {
      queueMicrotask(() => {
        if (!cancelled) fn();
      });
    };

    if (!queryRef) {
      run(() => {
        setData([]);
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
      queryRef,
      (snap) => {
        try {
          const rows: T[] = [];
          for (const d of snap.docs) {
            const row = parseRef.current(d.data() as Record<string, unknown>, d.id);
            if (row !== null) rows.push(row);
          }
          setData(rows);
          setLoading(false);
        } catch (e) {
          console.error("[useFirestoreCollection] parse error", e);
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      },
      (err: FirestoreError) => {
        if (process.env.NODE_ENV === "development") {
          const path = String((queryRef as unknown as { _query?: { path?: unknown } })?._query?.path ?? "unknown");
          console.error("[firestore]", {
            path,
            code: err.code,
            message: err.message,
          });
        }
        logFirestoreListenerError(`useFirestoreCollection label=${listenerLabel}`, err);
        console.error("[useFirestoreCollection] snapshot error", listenerLabel, err);
        setError(err);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [listenerLabel, queryRef]);

  return { data, loading, error };
}
