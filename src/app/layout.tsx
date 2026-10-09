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
  title: { default: "PASS2U · Chợ đồ cũ sinh viên FPT", template: "%s · PASS2U" },
  description: "Mua bán, trao đổi và tặng đồ cũ giữa sinh viên Đại học FPT đã được xác minh.",
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbf9f7" }, { media: "(prefers-color-scheme: dark)", color: "#1c1916" }], width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${font.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">
        <Suspense>
          <NavProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
