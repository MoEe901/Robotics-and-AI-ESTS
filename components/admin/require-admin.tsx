"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isAllowlistedAdmin } from "@/lib/admin-allowlist";
import { auth } from "@/lib/firebase";

type Props = {
  children: React.ReactNode;
};

export function RequireAdmin({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), async (user) => {
      if (!user?.email || !isAllowlistedAdmin(user.email)) {
        if (user) await signOut(auth());
        setAllowed(false);
        setReady(true);
        router.replace("/admin/login");
        return;
      }
      setAllowed(true);
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <p className="px-6 py-16 text-sm text-white/60">
        Checking admin session…
      </p>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
