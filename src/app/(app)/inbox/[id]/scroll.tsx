"use client";

import { useEffect } from "react";

export function ScrollToEnd({ count }: { count: number }) {
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight });
  }, [count]);
  return null;
}
