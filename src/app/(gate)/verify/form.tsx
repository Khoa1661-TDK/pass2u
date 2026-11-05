"use client";

import { useActionState } from "react";
import { submitVerification } from "@/app/actions/verify";
import { FormMessage, SubmitButton } from "@/components/ui";
import { StudentFields } from "@/components/student-fields";

export function VerifyForm({ defaults }: { defaults: { studentCode: string; campus: string } }) {
  const [state, action] = useActionState(submitVerification, undefined);
  const v = { studentCode: state?.fields?.studentCode ?? defaults.studentCode, campus: state?.fields?.campus ?? defaults.campus };

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <StudentFields defaults={v} />
      <SubmitButton className="btn btn-primary w-full" pending="Đang gửi…">Gửi duyệt lại</SubmitButton>
    </form>
  );
}
