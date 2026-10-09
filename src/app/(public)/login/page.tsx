import Link from "next/link";
import type { Metadata } from "next";
import { AuthFrame } from "../auth-frame";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthFrame title="Chào mừng trở lại">
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-ink-2">
        Bạn mới trên PASS2U? <Link href="/signup" className="font-semibold text-accent-ink underline-offset-4 hover:underline">Tạo tài khoản</Link>
      </p>
    </AuthFrame>
  );
}
