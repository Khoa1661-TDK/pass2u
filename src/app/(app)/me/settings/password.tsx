"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    // Remount after a change so the fields clear.
    <form key={state?.ok ? "done" : "edit"} action={action} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="currentPassword" className="field-label">Mật khẩu hiện tại</label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className="input" />
        </div>
        <div>
          <label htmlFor="newPassword" className="field-label">Mật khẩu mới</label>
          <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} className="input" />
        </div>
      </div>
      <SubmitButton className="btn btn-secondary" pending="Đang đổi…">Đổi mật khẩu</SubmitButton>
    </form>
  );
}
