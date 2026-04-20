"use client";

import { signOut } from "firebase/auth";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { auth } from "@/lib/firebase";

type Props = {
  children: React.ReactNode;
};

type AdminThemeMode = "light" | "dark";

const ADMIN_THEME_KEY = "admin-theme";
const ADMIN_THEME_EVENT = "admin-theme-change";

function resolveAdminInitialTheme(): AdminThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(ADMIN_THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function subscribeAdminTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_THEME_KEY) onStoreChange();
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADMIN_THEME_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADMIN_THEME_EVENT, onCustom);
  };
}

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const hideNav = pathname === "/admin/login";
  const theme = useSyncExternalStore<AdminThemeMode>(
    subscribeAdminTheme,
    resolveAdminInitialTheme,
    () => "dark",
  );

  const toggleTheme = () => {
    const next: AdminThemeMode = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(ADMIN_THEME_KEY, next);
    window.dispatchEvent(new Event(ADMIN_THEME_EVENT));
  };

  return (
    <div
      className="admin-root min-h-screen [background:var(--admin-bg)] [color:var(--admin-fg)]"
      data-admin-theme={theme}
    >
      {!hideNav ? (
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <Link href="/admin/dashboard" className="text-sm font-semibold tracking-tight">
            Club admin
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-xs font-medium text-white/75">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch admin to light mode" : "Switch admin to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className="inline-flex items-center justify-center rounded-full border border-white/15 p-1.5 text-white/80 hover:border-white/25 hover:text-white"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
            <Link className="hover:text-white" href="/admin/dashboard">
              Dashboard
            </Link>
            <Link className="hover:text-white" href="/admin/team">
              Team members
            </Link>
            <Link className="hover:text-white" href="/admin/team/taxonomy">
              Roles & cells
            </Link>
            <Link className="hover:text-white" href="/admin/events">
              Events
            </Link>
            <Link className="text-blue-300 hover:text-blue-200" href="/">
              View site
            </Link>
            <button
              type="button"
              onClick={() => void signOut(auth()).then(() => {
                window.location.href = "/admin/login";
              })}
              className="rounded-full border border-white/15 px-3 py-1 text-white/70 hover:border-white/25 hover:text-white"
            >
              Sign out
            </button>
          </nav>
        </header>
      ) : null}
      <main>{children}</main>
    </div>
  );
}
