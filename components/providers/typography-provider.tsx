"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef } from "react";

import { db } from "@/lib/firebase";
import {
  buildTypographyCss,
  DEFAULT_TYPOGRAPHY_CONFIG,
  FONT_REGISTRY,
  parseTypographyConfig,
  resolveFontEntry,
  type TypographyConfig,
} from "@/lib/content/typography-defaults";

const STYLE_ID = "typo-overrides";

/** Inject <link rel="stylesheet"> for any Google Font that needs loading. */
function injectFontLinks(config: TypographyConfig): void {
  const fontsToCheck = [
    resolveFontEntry(config.accentFont, config.customFonts),
    resolveFontEntry(config.headingFont, config.customFonts),
    ...config.customFonts.map((cf) =>
      resolveFontEntry(cf.id, config.customFonts),
    ),
  ];
  for (const font of fontsToCheck) {
    if (!font.googleFontUrl) continue;
    const linkId = `gf-${font.id}`;
    if (document.getElementById(linkId)) continue;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = font.googleFontUrl;
    document.head.appendChild(link);
  }
}

/** Apply the default config immediately so SSR defaults are confirmed
 *  before the Firestore snapshot arrives. This also pre-injects links
 *  for any external fonts used by the default config. */
function applyDefaults(styleEl: HTMLStyleElement): void {
  styleEl.textContent = buildTypographyCss(DEFAULT_TYPOGRAPHY_CONFIG);
  injectFontLinks(DEFAULT_TYPOGRAPHY_CONFIG);
}

/**
 * TypographyProvider
 *
 * Subscribes to `siteConfig/typography` in Firestore and writes CSS custom
 * properties to a `<style id="typo-overrides">` tag in `<head>`, enabling
 * real-time typography changes across the whole application without a page
 * reload. Font family changes for external (Google Fonts) sources also inject
 * the required `<link>` stylesheet at runtime.
 *
 * Must be mounted inside a client boundary; place it early in the tree
 * (e.g. inside `<LanguageProvider>` in `app/layout.tsx`).
 */
export function TypographyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Obtain or create the style element
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    styleRef.current = el;
    applyDefaults(el);

    // Pre-load ALL registry Google Fonts so the admin preview works immediately
    // when the user navigates to /admin/typography.  The links are no-ops if
    // the fonts are never selected.
    for (const font of FONT_REGISTRY) {
      if (font.preloaded || !font.googleFontUrl) continue;
      const id = `gf-${font.id}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = font.googleFontUrl;
      link.setAttribute("data-typo-preload", "1");
      document.head.appendChild(link);
    }

    const unsub = onSnapshot(
      doc(db(), "siteConfig", "typography"),
      (snap) => {
        const config = snap.exists()
          ? parseTypographyConfig(snap.data())
          : DEFAULT_TYPOGRAPHY_CONFIG;
        if (styleRef.current) {
          styleRef.current.textContent = buildTypographyCss(config);
        }
        injectFontLinks(config);
      },
      () => {
        /* On permission/network error keep the current styles intact. */
      },
    );

    return () => {
      unsub();
    };
  }, []);

  return <>{children}</>;
}
