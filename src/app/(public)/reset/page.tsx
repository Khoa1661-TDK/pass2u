import Link from "next/link";
import type { Metadata } from "next";
import { findReset } from "@/lib/password-reset";
import { AuthFrame } from "../auth-frame";
import { ResetForm } from "./form";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };
export const dynamic = "force-dynamic";

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const live = token ? await findReset(token) : null;
  return live ? (
    <AuthFrame title="Đặt mật khẩu mới" subtitle="Sau khi đổi, các thiết bị khác đang đăng nhập sẽ bị đăng xuất.">
      <ResetForm token={token!} />
    </AuthFrame>
  ) : (
    <AuthFrame title="Link này đã hết hạn" subtitle="Link đặt lại mật khẩu chỉ dùng được một lần, trong 1 giờ.">
      <Link href="/forgot" className="btn btn-primary w-full">Gửi link mới</Link>
    </AuthFrame>
  );
}
