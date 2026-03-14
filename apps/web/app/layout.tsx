import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elite | Connect with Intention",
  description: "An exclusive, high-end matchmaking platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elite",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(max-width: 768px)", color: "#13181F" },
    { media: "(min-width: 769px)", color: "#FBFCF8" },
    { media: "(prefers-color-scheme: dark)", color: "#13181F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ scrollBehavior: 'smooth' }}>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Script id="device-mode" strategy="beforeInteractive">
          {`(function(){var mobile=window.matchMedia('(max-width: 768px)').matches;document.documentElement.dataset.device=mobile?'mobile':'desktop';})();`}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
