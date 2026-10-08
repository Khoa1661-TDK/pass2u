import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight text-ink" aria-label="PASS2U home">
      <span className="grid size-8 place-items-center rounded-[9px] bg-accent text-[13px] font-bold text-white">P2</span>
      <span className="text-[17px]">PASS2U</span>
    </Link>
  );
}
