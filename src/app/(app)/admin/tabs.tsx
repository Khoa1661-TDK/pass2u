"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["/admin", "Duyệt thẻ"],
  ["/admin/reports", "Báo cáo"],
  ["/admin/users", "Sinh viên"],
];

export function AdminTabs() {
  const path = usePathname();
  // Longest matching tab wins so /admin/users/[id] highlights "Sinh viên", not "Duyệt thẻ".
  const active = tabs.reduce((best, [href]) => (path === href || path.startsWith(`${href}/`)) && href.length > best.length ? href : best, "");
  return (
    <nav className="mt-4 flex gap-6 border-b border-line text-sm font-medium" aria-label="Các mục quản trị">
      {tabs.map(([href, t]) => (
        <Link key={href} href={href} aria-current={active === href ? "page" : undefined} className={`-mb-px border-b-2 pb-3 ${active === href ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink-2"}`}>
          {t}
        </Link>
      ))}
    </nav>
  );
}
