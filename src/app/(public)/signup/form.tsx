"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";
import { shrinkImage } from "@/lib/shrink-image";
import { StudentIdFields } from "@/components/student-id-fields";

export function SignupForm() {
  const [state, action] = useActionState(async (prev: Parameters<typeof signup>[0], fd: FormData) => {
    const f = fd.get("idCard");
    if (f instanceof File && f.size) fd.set("idCard", await shrinkImage(f, 1800));
    return signup(prev, fd);
  }, undefined);
  const err = state?.error ? "form-error" : undefined;
  const v = state?.fields ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="displayName" className="field-label">Họ và tên</label>
        <input id="displayName" name="displayName" autoComplete="name" required className="input" defaultValue={v.displayName} aria-describedby={err} />
      </div>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={v.email} aria-describedby={err} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Mật khẩu</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" aria-describedby="pw-hint" />
        <p id="pw-hint" className="field-hint">Ít nhất 8 ký tự.</p>
      </div>
      <StudentIdFields defaults={{ studentCode: v.studentCode ?? "", campus: v.campus ?? "" }} />
      <SubmitButton className="btn btn-primary w-full" pending="Đang tạo tài khoản…">Tạo tài khoản</SubmitButton>
    </form>
  );
}
