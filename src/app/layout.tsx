import type { Metadata, Viewport } from "next";
import PwaShell from "@/components/PwaShell";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const siteName = "GPSRPG";
const siteDescription =
  "Browser-based companion app and overworld prototype for GPSRPG. Explore nearby fantasy sites from your real-world position.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "GPSRPG — Companion App / Overworld Prototype",
    template: "%s · GPSRPG",
  },
  description: siteDescription,
  applicationName: siteName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl.origin,
    siteName,
    title: "GPSRPG — Overworld Companion Prototype",
    description: siteDescription,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "GPSRPG compass icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GPSRPG — Overworld Companion Prototype",
    description: siteDescription,
    images: ["/icons/icon-512.png"],
  },
  alternates: {
    canonical: "/",
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
