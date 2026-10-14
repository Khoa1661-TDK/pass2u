"use client";

import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ComponentProps } from "react";

type PrefetchOptions = Parameters<ReturnType<typeof useRouter>["prefetch"]>[1];

// Filter chips load their results ahead of the tap (including chips scrolled
// out of view, which Link alone skips), and light up the moment they're
// pressed so a slow network never reads as an ignored tap.
export function ChipLink({ children, href, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();
  useEffect(() => {
    router.prefetch(String(href), { kind: "full" } as PrefetchOptions);
  }, [router, href]);
  return (
    <Link href={href} prefetch {...props}>
      <Pending />
      {children}
    </Link>
  );
}

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span data-pending hidden /> : null;
}
