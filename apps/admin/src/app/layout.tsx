import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteBackground } from "@/components/admin/SiteBackground";
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
  title: "Spiritual Elevation Ministry — Admin",
  description: "Admin dashboard for Spiritual Elevation Ministry staff.",
  robots: { index: false, follow: false },
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
