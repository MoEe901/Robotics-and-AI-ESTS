import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

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
      className={`${inter.variable} ${spaceGrotesk.variable} relative h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <StartupLoader>
          {process.env.NODE_ENV === "development" ? <FirestoreDebugRawTeamMembers /> : null}
          <div className="relative min-h-0 flex-1">{children}</div>
        </StartupLoader>
      </body>
    </html>
  );
}
