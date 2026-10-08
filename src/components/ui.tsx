"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pending: pendingLabel,
  className = "btn btn-primary",
  ...rest
}: { children: ReactNode; pending?: string; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} {...rest}>
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error)
    return (
      <p role="alert" id="form-error" className="alert bg-danger-soft text-danger">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="alert bg-ok-soft text-ok">
        {state.ok}
      </p>
    );
  return null;
}
