import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPSRPG — Companion App / Overworld Prototype",
  description:
    "Browser-based companion app and overworld prototype for GPSRPG. Not the main 3D extraction RPG.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
