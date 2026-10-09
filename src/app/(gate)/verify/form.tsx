"use client";

import { useActionState } from "react";
import { submitVerification } from "@/app/actions/verify";
import { FormMessage, SubmitButton } from "@/components/ui";
import { shrinkImage } from "@/lib/shrink-image";
import { StudentIdFields } from "@/components/student-id-fields";

export function VerifyForm({ defaults }: { defaults: { studentCode: string; campus: string } }) {
  const [state, action] = useActionState(async (prev: Parameters<typeof submitVerification>[0], fd: FormData) => {
    const f = fd.get("idCard");
    if (f instanceof File && f.size) fd.set("idCard", await shrinkImage(f, 1800));
    return submitVerification(prev, fd);
  }, undefined);
  const v = { studentCode: state?.fields?.studentCode ?? defaults.studentCode, campus: state?.fields?.campus ?? defaults.campus };

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <StudentIdFields defaults={v} />
      <SubmitButton className="btn btn-primary w-full" pending="Đang tải lên…">Gửi duyệt</SubmitButton>
    </form>
  );
}
