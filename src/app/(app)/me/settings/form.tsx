"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { CAMPUSES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "@/components/ui";

export function SettingsForm({ defaults }: { defaults: { displayName: string; bio: string; campus: string } }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const router = useRouter();
  // Pull the fresh profile into the header, profile page and this form.
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  const v = { ...defaults, ...state?.fields };
  return (
    <form key={`${defaults.displayName}|${defaults.campus}|${defaults.bio}`} action={action} className="space-y-5">
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
      <div>
        <label htmlFor="bio" className="field-label">Giới thiệu về bạn</label>
        <textarea id="bio" name="bio" rows={3} maxLength={280} className="input resize-none" defaultValue={v.bio} placeholder="Ngành học, khóa, nơi bạn thường hay trong trường" />
      </div>
      <SubmitButton pending="Đang lưu…">Lưu thay đổi</SubmitButton>
    </form>
  );
}
