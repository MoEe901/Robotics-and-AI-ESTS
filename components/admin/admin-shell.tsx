"use client";

import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import {
  Calendar,
  ExternalLink,
  FileEdit,
  HelpCircle,
  Info,
  Inbox,
  Activity,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Moon,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { auth, db } from "@/lib/firebase";

type Props = { children: React.ReactNode };
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

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/hero", label: "Hero & stats", icon: Sparkles },
  { href: "/admin/team", label: "Team members", icon: Users },
  { href: "/admin/team/taxonomy", label: "Roles & cells", icon: SlidersHorizontal },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/basic", label: "Know us", icon: Info },
  { href: "/admin/navbar", label: "Navbar", icon: Info },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/apply", label: "Apply", icon: FileEdit },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/layout", label: "Layout", icon: LayoutTemplate },
] as const;

// Items that can never be hidden (otherwise an admin can lock themselves
// out of the settings surface). Reorderable, but always visible.
export const ADMIN_NAV_LOCKED: ReadonlySet<string> = new Set([
  "/admin/dashboard",
  "/admin/layout",
]);

export type AdminShellConfig = {
  order: string[];
  visibility: Record<string, boolean>;
  showViewSite: boolean;
  showThemeToggle: boolean;
};

export const DEFAULT_ADMIN_SHELL_CONFIG: AdminShellConfig = {
  order: ADMIN_NAV_ITEMS.map((i) => i.href),
  visibility: Object.fromEntries(ADMIN_NAV_ITEMS.map((i) => [i.href, true])),
  showViewSite: true,
  showThemeToggle: true,
};

function parseAdminShellConfig(raw: unknown): AdminShellConfig {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const orderRaw = Array.isArray(data.order)
    ? (data.order.filter((x) => typeof x === "string") as string[])
    : [];
  const visRaw =
    data.visibility && typeof data.visibility === "object"
      ? (data.visibility as Record<string, unknown>)
      : {};
  return {
    order: orderRaw,
    visibility: Object.fromEntries(
      ADMIN_NAV_ITEMS.map((i) => [i.href, visRaw[i.href] !== false]),
    ),
    showViewSite: data.showViewSite !== false,
    showThemeToggle: data.showThemeToggle !== false,
  };
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const hideNav = pathname === "/admin/login";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  const [shellConfig, setShellConfig] = useState<AdminShellConfig>(DEFAULT_ADMIN_SHELL_CONFIG);

  useEffect(() => {
    const q = query(collection(db(), "submissions"), where("status", "==", "new"));
    return onSnapshot(q, (snap) => setNewSubmissionsCount(snap.size), () => {});
  }, []);

  useEffect(() => {
    const ref = doc(db(), "siteConfig", "adminShell");
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setShellConfig(DEFAULT_ADMIN_SHELL_CONFIG);
          return;
        }
        setShellConfig(parseAdminShellConfig(snap.data()));
      },
      () => {},
    );
  }, []);

  const displayedNavItems = useMemo<AdminNavItem[]>(() => {
    const byHref = new Map(ADMIN_NAV_ITEMS.map((i) => [i.href, i]));
    const ordered: string[] = [];
    for (const h of shellConfig.order) {
      if (byHref.has(h) && !ordered.includes(h)) ordered.push(h);
    }
    for (const item of ADMIN_NAV_ITEMS) {
      if (!ordered.includes(item.href)) ordered.push(item.href);
    }
    return ordered
      .map((h) => byHref.get(h))
      .filter((i): i is AdminNavItem => Boolean(i))
      .filter(
        (i) => ADMIN_NAV_LOCKED.has(i.href) || shellConfig.visibility[i.href] !== false,
      );
  }, [shellConfig]);

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

  const handleSignOut = () => {
    void signOut(auth()).then(() => {
      window.location.href = "/admin/login";
    });
  };

  if (hideNav) {
    return (
      <div
        className="admin-root min-h-screen [background:var(--admin-bg)] [color:var(--admin-fg)]"
        data-admin-theme={theme}
      >
        {children}
      </div>
    );
  }

  const sidebarContent = (
    <>
      <Link
        href="/admin/dashboard"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 border-b border-[rgba(124,58,237,0.18)] px-6 py-5"
      >
        <Image
          src="/assets/logos/logo-optimized.svg"
          alt=""
          width={34}
          height={34}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col">
          <span className="font-syne text-sm font-bold tracking-tight text-white">
            Club admin
          </span>
          <span className="font-jetbrains text-[10px] uppercase tracking-[0.2em] text-white/45">
            Control center
          </span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <span className="font-jetbrains px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
          Manage
        </span>
        {displayedNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          const badge = href === "/admin/submissions" && newSubmissionsCount > 0 ? newSubmissionsCount : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] px-3 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.55)]"
                  : "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-[rgba(124,58,237,0.25)] hover:bg-[rgba(124,58,237,0.08)] hover:text-white"
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
              {badge > 0 && (
                <span className="ml-auto shrink-0 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-[rgba(124,58,237,0.18)] px-3 py-4">
        {shellConfig.showViewSite ? (
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-[rgba(6,182,212,0.1)] hover:text-white"
          >
            <ExternalLink className="size-4" />
            <span>View site</span>
          </Link>
        ) : null}
        {shellConfig.showThemeToggle ? (
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch admin to light mode" : "Switch admin to dark mode"}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-[rgba(124,58,237,0.08)] hover:text-white"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300/85 transition-colors hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div
      className="admin-root relative min-h-screen [background:var(--background)] [color:var(--admin-fg)]"
      data-admin-theme={theme}
    >
      <div className="futurized-violet-grid" aria-hidden />
      <div className="futurized-scanlines" aria-hidden />
      <div className="futurized-corner futurized-corner-tl hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-tr hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-bl hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-br hidden sm:block" aria-hidden />

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[rgba(124,58,237,0.18)] bg-[rgba(7,8,15,0.82)] px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image src="/assets/logos/logo-optimized.svg" alt="" width={26} height={26} />
          <span className="font-syne text-sm font-bold tracking-tight">Club admin</span>
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-[rgba(124,58,237,0.28)] p-2 text-white/85 transition-colors hover:bg-[rgba(124,58,237,0.1)] hover:text-white"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-[rgba(124,58,237,0.18)] bg-[rgba(7,8,15,0.72)] backdrop-blur lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[rgba(124,58,237,0.22)] bg-[rgba(7,8,15,0.95)] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-white/10 p-1.5 text-white/70 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <main className="relative z-[2] min-w-0 lg:ml-72">{children}</main>
    </div>
  );
}
