"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.fields?.email} />
      </div>
      <SubmitButton className="btn btn-primary w-full" pending="Đang gửi…">Gửi liên kết</SubmitButton>
    </form>
  );
}
