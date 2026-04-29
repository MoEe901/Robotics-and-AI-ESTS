import type { Metadata } from "next";
import { Bebas_Neue, Inter, JetBrains_Mono, Space_Grotesk, Syne } from "next/font/google";

import { FirestoreDebugRawTeamMembers } from "@/components/firebase/firestore-debug-raw";
import { StartupLoader } from "@/components/layout/startup-loader";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { ThemeRoot } from "@/components/layout/theme-root";
import { LanguageProvider } from "@/lib/i18n/context";
import { TypographyProvider } from "@/components/providers/typography-provider";

import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Robotics & AI Club",
  description:
    "A premium Robotics & AI Club experience inspired by Apple minimalism and Stripe motion design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth"
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} relative h-full scroll-smooth antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <ThemeRoot>
          <LanguageProvider>
            <TypographyProvider>
            <ScrollProgress />
            <StartupLoader>
              {process.env.NODE_ENV === "development" ? <FirestoreDebugRawTeamMembers /> : null}
              <div className="relative min-h-0 flex-1">{children}</div>
            </StartupLoader>
            </TypographyProvider>
          </LanguageProvider>
        </ThemeRoot>
      </body>
    </html>
  );
}

