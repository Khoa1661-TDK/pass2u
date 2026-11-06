import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Steps } from "../steps";
import { VerifyForm } from "./form";

export const metadata = { title: "Xác minh sinh viên" };

export default async function Verify() {
  const u = await requireUser();
  if (u.role === "admin") redirect("/admin");
  if (u.verificationStatus === "approved") redirect("/market");

  if (u.verificationStatus === "pending")
    return (
      <>
        {/* Details submitted, approval still pending: step 2 stays the active one. */}
        <Steps current={1} />
        <span className="tag bg-warn-soft text-warn">Đang chờ duyệt</span>
        <h1 className="mt-3 font-serif text-[2.25rem] font-normal leading-tight">Đang kiểm tra thông tin của bạn</h1>
        <p className="mt-3 text-ink-2">
          Quản trị viên sẽ đối chiếu mã sinh viên với thông tin bạn đã cung cấp. Khi được duyệt, trang này sẽ mở khu mua bán. Tải lại trang bất cứ lúc nào để kiểm tra.
        </p>
        <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
          <div className="flex justify-between py-3"><dt className="text-ink-3">Mã sinh viên</dt><dd className="font-medium">{u.studentCode}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-ink-3">Cơ sở</dt><dd className="font-medium">{u.campus}</dd></div>
          {u.phone && <div className="flex justify-between py-3"><dt className="text-ink-3">Số điện thoại</dt><dd className="font-mono">{u.phone}</dd></div>}
          {u.residence && <div className="flex justify-between py-3"><dt className="text-ink-3">Nơi ở</dt><dd className="font-medium">{u.residence}</dd></div>}
        </dl>
      </>
    );

  return (
    <>
      <Steps current={1} />
      {u.verificationStatus === "rejected" && (
        <div role="alert" className="alert mb-6 bg-danger-soft text-danger">
          <p className="font-semibold">Thông tin trước của bạn không được duyệt</p>
          <p className="mt-1">{u.rejectionReason}</p>
        </div>
      )}
      <h1 className="font-serif text-[2.25rem] font-normal leading-tight">Kiểm tra lại mã sinh viên</h1>
      <p className="mt-3 text-ink-2">
        PASS2U chỉ dành cho sinh viên FPT. Sửa mã sinh viên hoặc cơ sở rồi gửi lại để quản trị viên duyệt.
      </p>
      <div className="mt-8">
        <VerifyForm defaults={{ studentCode: u.studentCode ?? "", campus: u.campus ?? "" }} />
      </div>
    </>
  );
}
