import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Elite Match MVP",
  description: "Local-first premium matchmaking MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="site-main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
