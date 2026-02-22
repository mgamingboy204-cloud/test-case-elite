import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem("em_theme");
      var theme = stored === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  })();
`;

export const metadata: Metadata = {
  title: "Elite Match",
  description: "Premium, verified matchmaking experience.",
  applicationName: "Elite Match",
  manifest: "/manifest.webmanifest",
  themeColor: "#c27d80",
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
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>
          <main className="site-main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
