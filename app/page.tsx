import { HomeRealtimeSections } from "@/components/content/home-realtime-sections";
import { HeroSection } from "@/components/hero/hero-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buildHomeMetadata } from "@/lib/metadata/home-metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildHomeMetadata();
}

export default function Home() {
  return (
    <div className="relative overflow-x-hidden [background:var(--background)] [color:var(--foreground)]">
      <div className="futurized-violet-grid" aria-hidden />
      <div className="futurized-scanlines" aria-hidden />
      <div className="futurized-corner futurized-corner-tl hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-tr hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-bl hidden sm:block" aria-hidden />
      <div className="futurized-corner futurized-corner-br hidden sm:block" aria-hidden />
      <div className="relative z-[2]">
        <Navbar />
        <HeroSection />
        <HomeRealtimeSections />
        <Footer />
      </div>
    </div>
  );
}