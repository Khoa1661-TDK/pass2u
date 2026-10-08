"use client";

import type { ReactNode } from "react";

// Runs a server action, then reloads the page. A plain <form action> (and
// router.refresh) intermittently left handled rows on screen in the admin
// queue, so admins could approve someone twice; a full reload is reliable.
export function RefreshForm({ action, className, children }: { action: (fd: FormData) => Promise<void>; className?: string; children: ReactNode }) {
  return (
    <form
      className={className}
      action={async (fd) => {
        await action(fd);
        window.location.reload();
      }}
    >
      {children}
    </form>
  );
}
