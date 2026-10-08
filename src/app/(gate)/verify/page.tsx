import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ID_RETENTION_DAYS } from "@/lib/constants";
import { Steps } from "../steps";
import { VerifyForm } from "./form";

export const metadata = { title: "Verify your student ID" };

export default async function Verify() {
  const u = await requireUser();
  if (u.role === "admin") redirect("/admin");
  if (!u.emailVerifiedAt) redirect("/check-email");
  if (u.verificationStatus === "approved") redirect("/market");

  if (u.verificationStatus === "pending")
    return (
      <>
        <Steps current={3} />
        <span className="tag bg-warn-soft text-warn">Under review</span>
        <h1 className="mt-3 text-[28px] font-bold">We&rsquo;re checking your ID</h1>
        <p className="mt-3 text-ink-2">
          An admin will compare your card with the details you gave. Once you&rsquo;re approved, this page opens the marketplace. Refresh any time to check.
        </p>
        <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
          <div className="flex justify-between py-3"><dt className="text-ink-3">Student code</dt><dd className="font-medium">{u.studentCode}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-ink-3">Campus</dt><dd className="font-medium">{u.campus}</dd></div>
        </dl>
      </>
    );

  return (
    <>
      <Steps current={2} />
      {u.verificationStatus === "rejected" && (
        <div role="alert" className="alert mb-6 bg-danger-soft text-danger">
          <p className="font-semibold">Your last upload wasn&rsquo;t approved</p>
          <p className="mt-1">{u.rejectionReason}</p>
        </div>
      )}
      <h1 className="text-[28px] font-bold">Show us your student ID</h1>
      <p className="mt-3 text-ink-2">
        PASS2U is only for FPT students. Take a clear photo of the front of your physical card.
      </p>
      <div className="mt-8">
        <VerifyForm defaults={{ studentCode: u.studentCode ?? "", campus: u.campus ?? "" }} />
      </div>
      <p className="mt-6 text-sm text-ink-3">
        Only PASS2U admins can see this photo. It&rsquo;s deleted {ID_RETENTION_DAYS} days after review.
      </p>
    </>
  );
}
