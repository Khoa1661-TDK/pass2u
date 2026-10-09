import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ID_RETENTION_DAYS } from "@/lib/constants";
import { Steps } from "../steps";
import { VerifyForm } from "./form";

export const metadata = { title: "Xác minh thẻ sinh viên" };
// Reading the card on submit can take a few seconds.
export const maxDuration = 30;

export default async function Verify() {
  const u = await requireUser();
  if (u.role === "admin") redirect("/admin");
  if (!u.emailVerifiedAt) redirect("/check-email");
  if (u.verificationStatus === "approved") redirect("/market");

  if (u.verificationStatus === "pending")
    return (
      <>
        <Steps current={3} />
        <span className="tag bg-warn-soft text-warn">Đang chờ duyệt</span>
        <h1 className="mt-3 font-serif text-[2.25rem] font-normal leading-tight">Đang kiểm tra thẻ của bạn</h1>
        <p className="mt-3 text-ink-2">
          Quản trị viên sẽ đối chiếu thẻ của bạn với thông tin bạn đã cung cấp. Khi được duyệt, trang này sẽ mở khu mua bán. Tải lại trang bất cứ lúc nào để kiểm tra.
        </p>
        <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
          <div className="flex justify-between py-3"><dt className="text-ink-3">Mã sinh viên</dt><dd className="font-medium">{u.studentCode}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-ink-3">Cơ sở</dt><dd className="font-medium">{u.campus}</dd></div>
        </dl>
      </>
    );

  return (
    <>
      <Steps current={2} />
      {u.verificationStatus === "rejected" && (
        <div role="alert" className="alert mb-6 bg-danger-soft text-danger">
          <p className="font-semibold">Ảnh thẻ trước của bạn không được duyệt</p>
          <p className="mt-1">{u.rejectionReason}</p>
        </div>
      )}
      <h1 className="font-serif text-[2.25rem] font-normal leading-tight">Hãy trình thẻ sinh viên của bạn</h1>
      <p className="mt-3 text-ink-2">
        PASS2U chỉ dành cho sinh viên FPT. Chụp rõ mặt trước thẻ sinh viên thật của bạn.
      </p>
      <div className="mt-8">
        <VerifyForm defaults={{ studentCode: u.studentCode ?? "", campus: u.campus ?? "" }} />
      </div>
      <p className="mt-6 text-sm text-ink-3">
        Chỉ quản trị viên PASS2U mới xem được ảnh này. Ảnh bị xóa {ID_RETENTION_DAYS} ngày sau khi duyệt.
      </p>
    </>
  );
}
