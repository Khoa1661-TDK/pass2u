"use client";

import { useActionState } from "react";
import { resendConfirmation } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui";

export function ResendForm() {
  const [state, action] = useActionState(resendConfirmation, undefined);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <SubmitButton className="btn btn-secondary" pending="Đang gửi…">Gửi link mới</SubmitButton>
    </form>
  );
}
