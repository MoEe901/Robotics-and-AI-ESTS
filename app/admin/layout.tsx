import type { Metadata } from "next";

import { AdminRootLayoutClient } from "@/app/admin/admin-root-layout-client";

export const metadata: Metadata = {
  title: "Admin · Robotics & AI Club",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminRootLayoutClient>{children}</AdminRootLayoutClient>;
}
