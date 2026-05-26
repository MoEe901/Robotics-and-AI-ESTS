"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { SiteDesign } from "@/lib/design";

const DesignContext = createContext<SiteDesign>("futuristic");

/** Read the active site design from any client component */
export function useDesign(): SiteDesign {
  return useContext(DesignContext);
}

/**
 * Reads the active site design from Firestore (siteConfig/design)
 * and applies data-design="..." on <html>.
 * Falls back to "futuristic" when no doc exists.
 */
export function DesignRoot({ children }: { children: React.ReactNode }) {
  const [design, setDesign] = useState<SiteDesign>("futuristic");

  useEffect(() => {
    return onSnapshot(
      doc(db(), "siteConfig", "design"),
      (snap) => {
        if (!snap.exists()) {
          setDesign("futuristic");
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        const val = data.activeDesign;
        if (val === "editorial") {
          setDesign("editorial");
        } else {
          setDesign("futuristic");
        }
      },
      () => {
        // on error, fall back
        setDesign("futuristic");
      },
    );
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (design === "editorial") {
      html.setAttribute("data-design", "editorial");
      // Editorial is a light warm theme — override data-theme
      html.setAttribute("data-theme", "light");
    } else {
      html.removeAttribute("data-design");
      // Restore the user's chosen dark/light preference
      const saved = window.localStorage.getItem("rac-theme");
      html.setAttribute("data-theme", saved === "light" ? "light" : "dark");
    }
  }, [design]);

  return (
    <DesignContext.Provider value={design}>{children}</DesignContext.Provider>
  );
}
