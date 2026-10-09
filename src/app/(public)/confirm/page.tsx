import Link from "next/link";
import { confirmEmail } from "@/app/actions/auth";
import { AuthFrame } from "../auth-frame";

export const dynamic = "force-dynamic";

export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await confirmEmail(token) : false;
  return ok ? (
    <AuthFrame title="Đã xác nhận email" subtitle="Còn một bước nữa: trình thẻ sinh viên của bạn.">
      <Link href="/verify" className="btn btn-primary w-full">Tiếp tục xác minh thẻ</Link>
    </AuthFrame>
  ) : (
    <AuthFrame title="Link này đã hết hạn" subtitle="Link xác nhận có hạn 24 giờ. Đăng nhập để chúng tôi gửi link mới.">
      <Link href="/check-email" className="btn btn-primary w-full">Gửi link mới</Link>
    </AuthFrame>
  );
}
