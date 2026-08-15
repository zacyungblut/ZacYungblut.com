import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PlayerProvider } from "@/lib/player-context";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zac Yungblut",
  description:
    "Zac Yungblut is an indie folk artist. Get the app to hear unreleased songs first.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <PlayerProvider>
          {children}
          <MiniPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
