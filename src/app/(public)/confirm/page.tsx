import Link from "next/link";
import { confirmEmail } from "@/app/actions/auth";
import { AuthFrame } from "../auth-frame";

export const dynamic = "force-dynamic";

export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await confirmEmail(token) : false;
  return ok ? (
    <AuthFrame title="Email confirmed" subtitle="One more step: show us your student ID card.">
      <Link href="/verify" className="btn btn-primary w-full">Continue to ID verification</Link>
    </AuthFrame>
  ) : (
    <AuthFrame title="This link has expired" subtitle="Confirmation links last 24 hours. Sign in and we'll send you a new one.">
      <Link href="/check-email" className="btn btn-primary w-full">Get a new link</Link>
    </AuthFrame>
  );
}
