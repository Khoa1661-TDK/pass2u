import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Steps } from "../steps";
import { ResendForm } from "./resend";

export const metadata = { title: "Confirm your email" };

export default async function CheckEmail() {
  const u = await requireUser();
  if (u.emailVerifiedAt || u.role === "admin") redirect("/verify");
  return (
    <>
      <Steps current={1} />
      <h1 className="text-[28px] font-bold">Check your inbox</h1>
      <p className="mt-3 text-ink-2">
        We sent a confirmation link to <strong className="font-semibold text-ink">{u.email}</strong>. Open it on any device to continue.
      </p>
      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-3 text-sm text-ink-3">Nothing after a few minutes? Check spam, then:</p>
        <ResendForm />
      </div>
    </>
  );
}
