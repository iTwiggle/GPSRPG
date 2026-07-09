import type { Metadata, Viewport } from "next";
import PwaShell from "@/components/PwaShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPSRPG — Companion App / Overworld Prototype",
  description:
    "Browser-based companion app and overworld prototype for GPSRPG. Not the main 3D extraction RPG.",
  applicationName: "GPSRPG",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GPSRPG",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b1220" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-shell min-h-dvh antialiased">
        <PwaShell />
        {children}
      </body>
    </html>
  );
}
