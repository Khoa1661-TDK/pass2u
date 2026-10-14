"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="field-label">Mật khẩu mới</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
        <p className="field-hint">Ít nhất 8 ký tự.</p>
      </div>
      <SubmitButton className="btn btn-primary w-full" pending="Đang lưu…">Lưu mật khẩu mới</SubmitButton>
    </form>
  );
}
