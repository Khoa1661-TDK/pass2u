import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { idDocuments, users } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { purgeExpiredIds } from "@/lib/purge";
import { approveStudent, rejectStudent } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui";
import { RefreshForm } from "@/components/refresh-form";
import { timeAgo } from "@/lib/time";
import { ID_RETENTION_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function VerificationQueue() {
  await requireAdmin();
  await purgeExpiredIds();
  const queue = await db
    .select({ id: users.id, displayName: users.displayName, email: users.email, studentCode: users.studentCode, campus: users.campus, uploadedAt: idDocuments.uploadedAt, ocrCode: idDocuments.ocrCode, ocrNameMatch: idDocuments.ocrNameMatch, ocrLooksFpt: idDocuments.ocrLooksFpt })
    .from(users)
    .leftJoin(idDocuments, eq(idDocuments.userId, users.id))
    .where(eq(users.verificationStatus, "pending"))
    .orderBy(asc(idDocuments.uploadedAt));

  if (!queue.length)
    return <p className="py-14 text-center text-ink-3">No students waiting. New ID uploads appear here.</p>;

  return (
    <div>
      <p className="text-sm text-ink-3">
        {queue.length} waiting, oldest first. Check that the name and student code match the card, and that the card looks genuine. Photos are deleted {ID_RETENTION_DAYS} days after your decision.
      </p>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {queue.map((s) => (
          <li key={s.id} className="grid gap-5 py-6 md:grid-cols-[minmax(0,420px)_1fr]">
            {s.uploadedAt ? (
              <a href={`/api/admin/id/${s.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg bg-sunken">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/id/${s.id}`} alt={`Student ID card submitted by ${s.displayName}`} className="aspect-[1.586] w-full object-contain" />
              </a>
            ) : (
              <div className="grid aspect-[1.586] place-items-center rounded-lg bg-sunken text-sm text-ink-3">Photo missing</div>
            )}
            <div className="flex flex-col">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-ink-3">Name</dt><dd className="font-semibold">{s.displayName}</dd>
                <dt className="text-ink-3">Student code</dt><dd className="font-mono font-medium">{s.studentCode}</dd>
                <dt className="text-ink-3">Campus</dt><dd>{s.campus}</dd>
                <dt className="text-ink-3">Email</dt><dd className="break-all">{s.email}</dd>
                <dt className="text-ink-3">Submitted</dt><dd>{s.uploadedAt ? timeAgo(s.uploadedAt) : "Unknown"}</dd>
              </dl>
              <ul aria-label="Automatic card checks" className="mt-4 flex flex-wrap gap-1.5">
                <Check ok={s.ocrCode == null ? null : s.ocrCode === s.studentCode} label={s.ocrCode ? `Card code ${s.ocrCode}` : "Card code unreadable"} />
                <Check ok={s.ocrNameMatch} label={s.ocrNameMatch ? "Name on card" : s.ocrNameMatch === false ? "Name not found on card" : "Name not checked"} />
                <Check ok={s.ocrLooksFpt} label={s.ocrLooksFpt ? "FPT card wording" : s.ocrLooksFpt === false ? "No FPT wording" : "Card not checked"} />
              </ul>
              <div className="mt-5 flex flex-wrap items-start gap-2 md:mt-auto">
                <RefreshForm action={approveStudent.bind(null, s.id)}>
                  <SubmitButton pending="Approving…">Approve</SubmitButton>
                </RefreshForm>
                <details className="group">
                  <summary className="btn btn-danger list-none">Reject…</summary>
                  <RefreshForm action={rejectStudent.bind(null, s.id)} className="mt-3 w-[min(360px,80vw)] space-y-2">
                    <label htmlFor={`r-${s.id}`} className="field-label">Reason shown to the student</label>
                    <textarea id={`r-${s.id}`} name="reason" rows={2} className="input resize-none" defaultValue="The photo is blurry or the student code doesn't match. Please upload a clearer photo." />
                    <SubmitButton className="btn btn-danger btn-sm" pending="Rejecting…">Confirm rejection</SubmitButton>
                  </RefreshForm>
                </details>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Green when the check passed, red when it failed, grey when it couldn't run.
function Check({ ok, label }: { ok: boolean | null; label: string }) {
  const tone = ok === true ? "bg-ok-soft text-ok" : ok === false ? "bg-danger-soft text-danger" : "bg-sunken text-ink-3";
  return <li className={`tag ${tone}`}>{label}</li>;
}
