import Link from "next/link";
import type { Metadata } from "next";
import { AuthFrame } from "../auth-frame";
import { SignupForm } from "./form";

export const metadata: Metadata = { title: "Tạo tài khoản" };
// Reading the card on submit can take a few seconds.
export const maxDuration = 30;

export default function Signup() {
  return (
    <AuthFrame
      title="Tạo tài khoản"
      subtitle={<>Email nào cũng được. Quét hoặc chụp mặt trước thẻ sinh viên của bạn ngay tại đây.</>}
    >
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-2">
        Đã có tài khoản? <Link href="/login" className="font-semibold text-accent-ink underline-offset-4 hover:underline">Đăng nhập</Link>
      </p>
    </AuthFrame>
  );
}
