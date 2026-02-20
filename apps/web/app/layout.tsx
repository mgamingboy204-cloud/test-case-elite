import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elite Match | Premium Verified Matchmaking",
  description: "Join the world's most exclusive, verified matchmaking experience. Elite connection, absolute privacy.",
  applicationName: "Elite Match",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Elite Match",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icons/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9f8" /* Pearl White */
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} light`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-background text-foreground antialiased overflow-x-hidden selection:bg-primary/20 selection:text-primary transition-colors duration-1000">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            {/* Soft Cinematic Depth Layers */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(232,165,178,0.12),_transparent_60%)]" />
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(232,165,178,0.08),_transparent_60%)]" />
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_100%)]" />

            <main className="relative z-10 flex-grow flex flex-col">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
