"use client";

import { useActionState } from "react";
import { reportListing } from "@/app/actions/listings";
import { FormMessage, SubmitButton } from "@/components/ui";

export function ReportForm({ listingId }: { listingId: string }) {
  const [state, action] = useActionState(reportListing.bind(null, listingId), undefined);
  return (
    <details className="mt-6 text-sm">
      <summary className="cursor-pointer text-ink-3 hover:text-ink-2">Báo cáo tin đăng này</summary>
      {state?.ok ? (
        <div className="mt-3"><FormMessage state={state} /></div>
      ) : (
        <form action={action} className="mt-3 space-y-3">
          <FormMessage state={state} />
          <label htmlFor="reason" className="field-label">Có vấn đề gì?</label>
          <textarea id="reason" name="reason" rows={2} maxLength={500} className="input resize-none" placeholder="Món bị cấm, lừa đảo, sai chuyên mục…" />
          <SubmitButton className="btn btn-secondary btn-sm" pending="Đang gửi…">Gửi báo cáo</SubmitButton>
        </form>
      )}
    </details>
  );
}
