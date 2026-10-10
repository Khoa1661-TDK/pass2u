"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { CAMPUSES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "@/components/ui";

export function SettingsForm({ defaults }: { defaults: { displayName: string; bio: string; campus: string; phone: string; residence: string } }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const router = useRouter();
  // Pull the fresh profile into the header, profile page and this form.
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  const v = { ...defaults, ...state?.fields };
  return (
    <form key={`${defaults.displayName}|${defaults.campus}|${defaults.bio}|${defaults.phone}|${defaults.residence}`} action={action} className="space-y-5">
      <FormMessage state={state} />
      <div>
        <label htmlFor="displayName" className="field-label">Tên hiển thị</label>
        <input id="displayName" name="displayName" className="input" defaultValue={v.displayName} maxLength={60} />
      </div>
      <div>
        <label htmlFor="campus" className="field-label">Cơ sở</label>
        <select id="campus" name="campus" className="input" defaultValue={v.campus}>
          {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="field-label">Số điện thoại</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required className="input" placeholder="0912345678" defaultValue={v.phone} />
        </div>
        <div>
          <label htmlFor="residence" className="field-label">Nơi bạn đang ở</label>
          <input id="residence" name="residence" required maxLength={120} className="input" placeholder="KTX, lớp, hoặc địa chỉ đang ở" defaultValue={v.residence} />
        </div>
      </div>
      <p className="field-hint">
        Số điện thoại và nơi ở chỉ quản trị viên xem được. Căn cước và ngày sinh không sửa được tại đây — nếu cần đổi, hãy liên hệ đội ngũ PASS2U.
      </p>
      <div>
        <label htmlFor="bio" className="field-label">Giới thiệu về bạn</label>
        <textarea id="bio" name="bio" rows={3} maxLength={280} className="input resize-none" defaultValue={v.bio} placeholder="Ngành học, khóa, nơi bạn thường hay trong trường" />
      </div>
      <SubmitButton pending="Đang lưu…">Lưu thay đổi</SubmitButton>
    </form>
  );
}
