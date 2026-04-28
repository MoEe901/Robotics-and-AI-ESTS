import { HomePageShell } from "@/components/content/home-page-shell";

export default function Home() {
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
