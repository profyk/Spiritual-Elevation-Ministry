import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteBackground } from "@/components/layout/SiteBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Spiritual Elevation Ministry",
    template: "%s | Spiritual Elevation Ministry",
  },
  description:
    "[SAMPLE] Prophetic ministry, healing & deliverance, coaching, and events — replace with the ministry's real description before launch.",
};

// Runs before paint so a returning visitor's dark-mode choice never flashes
// light first — must stay synchronous (no `async`/`defer`, no external
// file) since it has to finish before the browser renders anything.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteBackground />
        {children}
      </body>
    </html>
  );
}
