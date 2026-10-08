"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches server data on an interval while the tab is visible. Cheap stand-in for realtime. */
export function AutoRefresh({ every = 5000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
