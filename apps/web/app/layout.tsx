import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

const themeScript = `
  (function() {
    try {
      document.documentElement.classList.add("theme-preload");
      var stored = localStorage.getItem("em_theme");
      var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var theme = stored === "light" || stored === "dark" ? stored : (systemDark ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document.documentElement.style.backgroundColor = theme === "dark" ? "#0B0B10" : "#FAFAFB";
      requestAnimationFrame(function() {
        document.documentElement.classList.remove("theme-preload");
      });
    } catch (e) {}
  })();
`;

export const metadata: Metadata = {
  title: "Elite Match",
  description: "Premium, verified matchmaking experience.",
  applicationName: "Elite Match",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Elite Match",
    statusBarStyle: "black-translucent"
  },
  other: {
    "mobile-web-app-capable": "yes"
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B10" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAFB" }
  ],
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: "#0B0B10" }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={{ backgroundColor: "#0B0B10" }}>
        <div className="boot-shell" aria-hidden="true">
          <div className="boot-shell__mark" />
        </div>
        <Providers>
          <main className="site-main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
