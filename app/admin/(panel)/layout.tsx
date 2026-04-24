import { RequireAdmin } from "@/components/admin/require-admin";

export default function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
