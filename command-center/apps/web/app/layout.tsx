import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { MockBrowserInit } from "../mocks/browser-init";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// The canonical sidebar badges are Geist Mono (CANON 1321), a different face
// from the IBM Plex Mono used by the application body.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 600 is required: canonical KPI values, status labels, bulk-bar count and active
// pagination are all mono 600. Without the real face the browser synthesizes a faux
// bold, which the visual comparison harness reports as a permanent diff.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Command Center",
  description: "CodeOutfitters internal Command Center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} font-cc-body antialiased`}
      >
        <MockBrowserInit>{children}</MockBrowserInit>
      </body>
    </html>
  );
}
