"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AdminSessionDenied, AdminSessionInfo } from "@/lib/admin-access-client";
import { resolveAdminSession } from "@/lib/admin-access-client";
import { auth } from "@/lib/firebase";

export type ResolvedAdminSession =
  | (AdminSessionInfo & { user: User })
  | { ok: false; reason: AdminSessionDenied["reason"]; user: User | null };

type Ctx = {
  ready: boolean;
  session: ResolvedAdminSession | null;
  refresh: () => void;
};

const AdminSessionContext = createContext<Ctx | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<ResolvedAdminSession | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), async (user) => {
      if (!user) {
        setSession(null);
        setReady(true);
        return;
      }
      try {
        const r = await resolveAdminSession(user);
        if (r.ok) {
          setSession({ ...r, user });
        } else {
          setSession({ ok: false, reason: r.reason, user });
        }
      } catch (error) {
        // If rules are not deployed yet, avoid crashing the app and treat as not provisioned.
        console.warn("[admin] resolveAdminSession failed:", error);
        setSession({ ok: false, reason: "not_provisioned", user });
      }
      setReady(true);
    });
    return () => unsub();
  }, [tick]);

  const value = useMemo(() => ({ ready, session, refresh }), [ready, session, refresh]);

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): Ctx {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used under AdminSessionProvider");
  }
  return ctx;
}

/** Safe outside provider (e.g. tests): returns null. */
export function useAdminSessionOptional(): Ctx | null {
  return useContext(AdminSessionContext);
}
