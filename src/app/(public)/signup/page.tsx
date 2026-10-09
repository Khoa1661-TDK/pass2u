import Link from "next/link";
import type { Metadata } from "next";
import { AuthFrame } from "../auth-frame";
import { SignupForm } from "./form";

export const metadata: Metadata = { title: "Tạo tài khoản" };

export default function Signup() {
  return (
    <AuthFrame
      title="Tạo tài khoản"
      subtitle={<>Email nào cũng được. Bước tiếp theo là xác minh thẻ sinh viên.</>}
    >
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-2">
        Đã có tài khoản? <Link href="/login" className="font-semibold text-accent-ink underline-offset-4 hover:underline">Đăng nhập</Link>
      </p>
    </AuthFrame>
  );
}
