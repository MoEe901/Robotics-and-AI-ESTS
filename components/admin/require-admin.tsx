"use client";

import { signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAdminSession } from "@/components/admin/admin-session-context";
import { isAdminPathAllowedForRole } from "@/lib/admin-route-access";
import { auth } from "@/lib/firebase";

type Props = {
  children: React.ReactNode;
};

export function RequireAdmin({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, session } = useAdminSession();

  useEffect(() => {
    if (!ready) return;

    void (async () => {
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      if (!session.ok) {
        if (session.user) await signOut(auth());
        router.replace("/admin/login");
        return;
      }
      const full = session.mode === "legacy" || session.role === "admin";
      if (!isAdminPathAllowedForRole(pathname, session.role, full)) {
        router.replace("/admin/dashboard");
      }
    })();
  }, [ready, session, pathname, router]);

  if (!ready) {
    return (
      <p className="px-6 py-16 text-sm text-white/60">
        Checking admin session…
      </p>
    );
  }

  if (!session?.ok) {
    return null;
  }

  const full = session.mode === "legacy" || session.role === "admin";
  if (!isAdminPathAllowedForRole(pathname, session.role, full)) {
    return (
      <p className="px-6 py-16 text-sm text-white/60">
        Redirecting…
      </p>
    );
  }

  return <>{children}</>;
}
