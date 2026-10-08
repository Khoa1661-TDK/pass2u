import Link from "next/link";
import type { Metadata } from "next";
import { AuthFrame } from "../auth-frame";
import { SignupForm } from "./form";

export const metadata: Metadata = { title: "Create account" };

export default function Signup() {
  return (
    <AuthFrame
      title="Create your account"
      subtitle={<>Any email works. You&rsquo;ll verify with your student ID card next.</>}
    >
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-2">
        Already have an account? <Link href="/login" className="font-semibold text-accent-ink underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </AuthFrame>
  );
}
