"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { CAMPUSES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "@/components/ui";

export function SettingsForm({ defaults }: { defaults: { displayName: string; bio: string; campus: string } }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const v = { ...defaults, ...state?.fields };
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div>
        <label htmlFor="displayName" className="field-label">Display name</label>
        <input id="displayName" name="displayName" className="input" defaultValue={v.displayName} maxLength={60} />
      </div>
      <div>
        <label htmlFor="campus" className="field-label">Campus</label>
        <select id="campus" name="campus" className="input" defaultValue={v.campus}>
          {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="bio" className="field-label">About you</label>
        <textarea id="bio" name="bio" rows={3} maxLength={280} className="input resize-none" defaultValue={v.bio} placeholder="Major, year, where you usually hang out on campus" />
      </div>
      <SubmitButton pending="Saving…">Save changes</SubmitButton>
    </form>
  );
}
