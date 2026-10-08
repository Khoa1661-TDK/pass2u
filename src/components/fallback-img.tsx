"use client";

import { useState, type ReactNode } from "react";

// Shows the photo, or the fallback if it fails to load.
export function FallbackImg({ src, className, fallback }: { src: string; className?: string; fallback: ReactNode }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={className} onError={() => setBroken(true)} />;
}
