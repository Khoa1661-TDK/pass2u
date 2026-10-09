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
  return (
    <nav className="mt-4 flex gap-6 border-b border-line text-sm font-medium" aria-label="Các mục quản trị">
      {tabs.map(([href, t]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`-mb-px border-b-2 pb-3 ${path === href ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink-2"}`}>
          {t}
        </Link>
      ))}
    </nav>
  );
}
