"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";
import { shrinkImage } from "@/lib/shrink-image";
import { StudentIdFields } from "@/components/student-id-fields";
import { COHORTS, MAJORS } from "@/lib/constants";

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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="field-label">Số điện thoại</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="input" placeholder="0912345678" defaultValue={v.phone} aria-describedby={err} />
        </div>
        <div>
          <label htmlFor="birthDate" className="field-label">Ngày sinh</label>
          <input id="birthDate" name="birthDate" type="date" autoComplete="bday" required className="input" defaultValue={v.birthDate} aria-describedby={err} />
        </div>
      </div>
      <div>
        <label htmlFor="cccd" className="field-label">Số căn cước công dân</label>
        <input id="cccd" name="cccd" inputMode="numeric" autoComplete="off" required maxLength={12} className="input" placeholder="12 chữ số" defaultValue={v.cccd} aria-describedby={err} />
      </div>
      <div>
        <label htmlFor="residence" className="field-label">Nơi bạn đang ở</label>
        <input id="residence" name="residence" autoComplete="off" required maxLength={120} className="input" placeholder="KTX, lớp, hoặc địa chỉ đang ở" defaultValue={v.residence} aria-describedby={err} />
        <p className="field-hint">
          Số điện thoại, căn cước, ngày sinh và nơi ở chỉ quản trị viên PASS2U xem được, dùng để xác minh và liên hệ khi có tranh chấp.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cohort" className="field-label">Khóa (tùy chọn)</label>
          <select id="cohort" name="cohort" className="input" defaultValue={v.cohort}>
            <option value="">Chọn…</option>
            {COHORTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="major" className="field-label">Ngành học (tùy chọn)</label>
          <select id="major" name="major" className="input" defaultValue={v.major}>
            <option value="">Chọn…</option>
            {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <StudentIdFields defaults={{ studentCode: v.studentCode ?? "", campus: v.campus ?? "" }} />
      <SubmitButton className="btn btn-primary w-full" pending="Đang tạo tài khoản…">Tạo tài khoản</SubmitButton>
    </form>
  );
}
