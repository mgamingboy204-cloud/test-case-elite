import "./globals.css";
import TopNav from "./components/TopNav";
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
          <TopNav />
          <main className="container page">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
