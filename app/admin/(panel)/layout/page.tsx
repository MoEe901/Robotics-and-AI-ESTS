import { AdminShellConfigClient } from "@/components/admin/admin-shell-config-client";
import { SectionsLayoutClient } from "@/components/admin/sections-layout-client";

export default function AdminLayoutPage() {
  return (
    <>
      <SectionsLayoutClient />
      <AdminShellConfigClient />
    </>
  );
}
