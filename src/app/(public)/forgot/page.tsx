import Link from "next/link";
import type { Metadata } from "next";
import { AuthFrame } from "../auth-frame";
import { ForgotForm } from "./form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Forgot() {
  return (
    <AuthFrame title="Quên mật khẩu" subtitle="Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi liên kết đặt mật khẩu mới.">
      <ForgotForm />
      <p className="mt-6 text-center text-sm text-ink-2">
        Nhớ ra rồi? <Link href="/login" className="font-semibold text-accent-ink underline-offset-4 hover:underline">Đăng nhập</Link>
      </p>
    </AuthFrame>
  );
}
