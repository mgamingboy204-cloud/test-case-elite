import type { Metadata, Viewport } from "next";
import "./safe-area.css";
import "./globals.css";
import { SafeAreaDebugProbe } from "./components/SafeAreaDebugProbe";
import Providers from "./providers";

const themeScript = `
  (function() {
    try {
      document.documentElement.classList.add("theme-preload");
      var stored = localStorage.getItem("em_theme");
      var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var theme = stored === "light" || stored === "dark" ? stored : (systemDark ? "dark" : "light");
      var debugLayout = window.localStorage.getItem("em_layout_debug") === "1" || window.location.search.indexOf("layoutDebug=1") !== -1;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document.documentElement.style.backgroundColor = theme === "dark" ? "#0B0B10" : "#F8F4EF";
      if (debugLayout) {
        document.documentElement.setAttribute("data-debug-layout", "1");
      } else {
        document.documentElement.removeAttribute("data-debug-layout");
      }
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B10" },
    { media: "(prefers-color-scheme: light)", color: "#F8F4EF" }
  ],
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="boot-shell" aria-hidden="true">
          <div className="boot-shell__mark" />
        </div>
        <div id="app-root" data-layout-part="app-root">
          <Providers>
            <main className="site-main">{children}</main>
            <SafeAreaDebugProbe />
          </Providers>
        </div>
      </body>
    </html>
  );
}
