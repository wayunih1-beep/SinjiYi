import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SinjiYi — Anime, one story at a time",
  description: "Find your next anime on SinjiYi. Explore series and films, watch trailers, browse episodes, and find streaming options.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
