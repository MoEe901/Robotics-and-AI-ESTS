import { redirect } from "next/navigation";

/** Redirect legacy /admin/nav to canonical /admin/navbar route. */
export default function AdminNavRedirect() {
  redirect("/admin/navbar");
}
