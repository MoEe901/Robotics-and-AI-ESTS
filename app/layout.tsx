import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk, Syne } from "next/font/google";
import Script from "next/script";

import { FirestoreDebugRawTeamMembers } from "@/components/firebase/firestore-debug-raw";
import { StartupLoader } from "@/components/layout/startup-loader";

import "./globals.css";

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
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} relative h-full scroll-smooth antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <Script
          id="site-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var key = "site-theme";
                  var value = localStorage.getItem(key);
                  var theme = value === "light" || value === "dark" ? value : "dark";
                  document.documentElement.setAttribute("data-theme", theme);
                } catch (_) {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `,
          }}
        />
        <StartupLoader>
          {process.env.NODE_ENV === "development" ? <FirestoreDebugRawTeamMembers /> : null}
          <div className="relative min-h-0 flex-1">{children}</div>
        </StartupLoader>
      </body>
    </html>
  );
}
