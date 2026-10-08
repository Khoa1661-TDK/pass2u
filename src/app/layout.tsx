import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: { default: "PASS2U · FPT student marketplace", template: "%s · PASS2U" },
  description: "Buy, swap, and give away secondhand items with verified FPT University students.",
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbf9f7" }, { media: "(prefers-color-scheme: dark)", color: "#1c1916" }], width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
