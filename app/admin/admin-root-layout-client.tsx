"use client";

import { AdminSessionProvider } from "@/components/admin/admin-session-context";
import { AdminShell } from "@/components/admin/admin-shell";

export function AdminRootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}
