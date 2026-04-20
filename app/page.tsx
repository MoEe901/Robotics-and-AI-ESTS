import { HeroSection } from "@/components/hero/hero-section";
import { Navbar } from "@/components/layout/navbar";
import { HomeRealtimeSections } from "@/components/content/home-realtime-sections";

export default function Home() {
  return (
    <div className="relative overflow-x-hidden [background:var(--background)] [color:var(--foreground)]">
      <Navbar />
      <HeroSection />
      <HomeRealtimeSections />
    </div>
  );
}