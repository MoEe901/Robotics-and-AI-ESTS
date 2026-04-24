export const siteConfig = {
  name: "Robotics & AI Club",
  description:
    "A community of innovators building the future with robotics and artificial intelligence.",
  navItems: [
    { label: "Home", href: "/" },
    { label: "Events", href: "/#events" },
    { label: "Know us", href: "/#know" },
    { label: "Cellules", href: "/#cellules" },
    { label: "Team", href: "/#team" },
    { label: "FAQ", href: "/#faq" },
    { label: "Apply", href: "/#apply" },
  ],
  ctas: {
    primary: "Join the Club",
    secondary: "Explore Events",
  },
  /**
   * Full-screen homepage hero video (see `scripts/compress-video.mjs`).
   * Set `NEXT_PUBLIC_HERO_VIDEO_URL` to a single MP4/WebM URL to override local files.
   * Set `NEXT_PUBLIC_DISABLE_HERO_VIDEO=true` for particle-only background.
   */
  heroVideoDisabled: process.env.NEXT_PUBLIC_DISABLE_HERO_VIDEO === "true",
  heroVideoUrl: (process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? "").trim(),
  heroVideo: {
    webm: "/assets/video/hero-video.webm",
    mp4: "/assets/video/hero-video.mp4",
  },
};

export const designTokens = {
  colors: {
    baseLight: "#ffffff",
    darkBackground: "#0c0a09",
    primaryBlue: "#1b6ec8",
    deepBlue: "#1d3faf",
    softNeutral: "#d6d4d2",
    purpleAccent: "#5141b4",
    lightVariation: "#f5f5f4",
    deepPurple: "#4741b3",
  },
  gradients: {
    hero:
      "radial-gradient(circle at 15% 20%, rgba(81,65,180,0.36), transparent 30%), radial-gradient(circle at 85% 0%, rgba(27,110,200,0.45), transparent 32%), linear-gradient(160deg, #0c0a09 12%, #101331 45%, #1d3faf 100%)",
  },
};
