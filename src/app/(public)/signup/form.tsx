"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);
  const err = state?.error ? "form-error" : undefined;
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="displayName" className="field-label">Họ và tên</label>
        <input id="displayName" name="displayName" autoComplete="name" required className="input" defaultValue={state?.fields?.displayName} aria-describedby={err} />
      </div>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.fields?.email} aria-describedby={err} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Mật khẩu</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" aria-describedby="pw-hint" />
        <p id="pw-hint" className="field-hint">Ít nhất 8 ký tự.</p>
      </div>
      <SubmitButton className="btn btn-primary w-full" pending="Đang tạo tài khoản…">Tạo tài khoản</SubmitButton>
    </form>
  );
}
