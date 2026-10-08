import { Suspense } from "react";
import { NavProgress } from "@/components/nav-progress";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, EB_Garamond } from "next/font/google";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});
// Editorial serif for headlines, matching the warm bookish reference.
const serif = EB_Garamond({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-serif-display" });

export const metadata: Metadata = {
  title: { default: "PASS2U · FPT student marketplace", template: "%s · PASS2U" },
  description: "Buy, swap, and give away secondhand items with verified FPT University students.",
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbf9f7" }, { media: "(prefers-color-scheme: dark)", color: "#1c1916" }], width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">
        <Suspense>
          <NavProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
