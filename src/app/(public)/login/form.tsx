"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.fields?.email} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <SubmitButton className="btn btn-primary w-full" pending="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
