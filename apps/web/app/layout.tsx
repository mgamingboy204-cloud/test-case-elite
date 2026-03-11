import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elite - Curated Matchmaking Platform",
  description: "Connect with intention. Elite is a premium, curated matchmaking platform for discerning individuals seeking genuine relationships.",
  keywords: ["matchmaking", "dating", "curated matches", "luxury", "exclusive"],
  authors: [{ name: "Elite" }],
  openGraph: {
    title: "Elite - Curated Matchmaking",
    description: "Exclusive matchmaking for genuine connections",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
  colorScheme: "dark light"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased">{children}</body>
    </html>
  );
}
