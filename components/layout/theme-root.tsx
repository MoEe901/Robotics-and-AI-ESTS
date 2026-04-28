"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getSiteThemeSnapshot, subscribeSiteTheme } from "@/lib/theme";

/**
 * Reads the persisted theme preference from localStorage and applies it to
 * <html data-theme="..."> on the client.  The server always renders
 * data-theme="dark" (the default), so suppressHydrationWarning on <html>
 * prevents React from warning about the attribute mismatch.
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeSiteTheme, getSiteThemeSnapshot, () => "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
}
