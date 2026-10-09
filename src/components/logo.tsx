import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight text-ink" aria-label="Trang chủ PASS2U">
      <span className="grid size-8 place-items-center rounded-[9px] bg-accent-fill text-[13px] font-bold text-on-accent">P2</span>
      <span className="text-[17px]">PASS2U</span>
    </Link>
  );
}
