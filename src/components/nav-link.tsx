"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const path = usePathname();
  const active = path === href || (href !== "/" && path.startsWith(href + "/")) || path === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-accent-ink" : "text-ink-3"}`}
    >
      {icon}
      {label}
    </Link>
  );
}
