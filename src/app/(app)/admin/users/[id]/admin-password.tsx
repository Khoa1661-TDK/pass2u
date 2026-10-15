"use client";

import { useActionState } from "react";
import { adminSetPassword } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/ui";

export function AdminPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(adminSetPassword.bind(null, userId), undefined);
  return (
    // Remount after a change so the field clears.
    <form key={state?.ok ? "done" : "edit"} action={action} className="max-w-md space-y-3">
      <FormMessage state={state} />
      <div>
        <label htmlFor="admin-new-password" className="field-label">Mật khẩu mới</label>
        <input id="admin-new-password" name="password" type="text" autoComplete="off" required minLength={8} className="input font-mono" />
        <p className="mt-1.5 text-sm text-ink-3">Gửi mật khẩu này cho sinh viên qua kênh riêng. Họ có thể đổi lại trong Cài đặt.</p>
      </div>
      <SubmitButton className="btn btn-secondary btn-sm" pending="Đang đặt…">Đặt mật khẩu mới</SubmitButton>
    </form>
  );
}
