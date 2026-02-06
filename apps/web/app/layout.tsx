import "./globals.css";
import Providers from "./providers";

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem("elite-match-theme");
      var theme = stored === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  })();
`;

export const metadata = {
  title: "ELITE MATCH",
  description: "Premium, verified matchmaking experience."
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
