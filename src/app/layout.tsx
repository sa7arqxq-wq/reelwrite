import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReelWrite — 7-second reels for writers",
  description:
    "A TikTok-style platform for writers to market their books. Scroll through 7-second kinetic reels of book hooks, quotes, and teasers. Discover your next read.",
  keywords: [
    "ReelWrite",
    "writers",
    "books",
    "reels",
    "book marketing",
    "TikTok for writers",
    "BookTok",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#fafaf9]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
