"use client";

import { useActionState, useState } from "react";
import { submitVerification } from "@/app/actions/verify";
import { CAMPUSES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "@/components/ui";
import { CameraIcon } from "@/components/icons";
import { shrinkImage } from "@/lib/shrink-image";

export function VerifyForm({ defaults }: { defaults: { studentCode: string; campus: string } }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, action] = useActionState(async (prev: Parameters<typeof submitVerification>[0], fd: FormData) => {
    const f = fd.get("idCard");
    if (f instanceof File && f.size) fd.set("idCard", await shrinkImage(f, 1800));
    return submitVerification(prev, fd);
  }, undefined);
  const v = state?.fields ?? defaults;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="studentCode" className="field-label">Student code</label>
          <input id="studentCode" name="studentCode" placeholder="SE190123" className="input uppercase" defaultValue={v.studentCode} autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="campus" className="field-label">Campus</label>
          <select id="campus" name="campus" className="input" defaultValue={v.campus} required>
            <option value="" disabled>Choose…</option>
            {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <span className="field-label" id="card-label">Student ID card photo</span>
        <label
          className="relative grid aspect-[1.586] w-full cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-sunken text-center transition-colors hover:border-ink-3 focus-within:border-accent"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your ID card preview" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 px-6 text-sm text-ink-2">
              <CameraIcon width={28} height={28} className="text-ink-3" />
              <span><span className="font-semibold text-accent-ink">Take or choose a photo</span><br />JPG, PNG or WebP</span>
            </span>
          )}
          <input
            type="file"
            name="idCard"
            accept="image/jpeg,image/png,image/webp"
            aria-labelledby="card-label"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
        <p className="field-hint">Make sure your name, photo, and student code are readable.</p>
      </div>
      <SubmitButton className="btn btn-primary w-full" pending="Uploading…">Submit for review</SubmitButton>
    </form>
  );
}
