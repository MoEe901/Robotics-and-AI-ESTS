"use client";

import { useDesign } from "@/components/layout/design-root";
import { HomePageShell } from "@/components/content/home-page-shell";
import { EditorialHomeShell } from "@/components/editorial/editorial-home-shell";

/**
 * Renders the correct homepage shell based on the active site design
 * (read from Firestore via DesignRoot context).
 */
export function HomeDesignSwitch() {
  const design = useDesign();

  if (design === "editorial") {
    return <EditorialHomeShell />;
  }

  return (
    <div className="relative overflow-x-hidden [background:var(--background)] [color:var(--foreground)]">
      <div className="futurized-violet-grid" aria-hidden />
      <div className="futurized-scanlines" aria-hidden />
      <div className="futurized-corner futurized-corner-tl hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-tr hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-bl hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-br hidden sm:block" aria-hidden />
      <HomePageShell />
    </div>
  );
}
