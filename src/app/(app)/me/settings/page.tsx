import { requireApproved } from "@/lib/session";
import { SettingsForm } from "./form";
import { PasswordForm } from "./password";

export const metadata = { title: "Cài đặt" };

export default async function Settings() {
  const u = await requireApproved();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-[28px] font-bold">Cài đặt</h1>
      <div className="mt-8">
        <SettingsForm defaults={{ displayName: u.displayName, bio: u.bio ?? "", campus: u.campus ?? "", phone: u.phone ?? "", residence: u.residence ?? "" }} />
      </div>
      <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
        <div className="flex justify-between py-3"><dt className="text-ink-3">Email</dt><dd>{u.email}</dd></div>
        <div className="flex justify-between py-3"><dt className="text-ink-3">Mã sinh viên</dt><dd>{u.studentCode ?? "Chưa có"}</dd></div>
        <div className="flex justify-between py-3"><dt className="text-ink-3">Ngày sinh</dt><dd>{u.birthDate ?? "Chưa có"}</dd></div>
        <div className="flex justify-between py-3"><dt className="text-ink-3">Duyệt thẻ</dt><dd className="font-medium text-ok">{u.role === "admin" ? "Quản trị" : "Đã duyệt"}</dd></div>
      </dl>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Mật khẩu</h2>
        <p className="mt-1 text-sm text-ink-3">Đổi mật khẩu sẽ đăng xuất mọi thiết bị khác.</p>
        <div className="mt-4"><PasswordForm /></div>
      </section>
      {u.role !== "admin" && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Thẻ sinh viên của bạn</h2>
          <p className="mt-1 text-sm text-ink-3">Chỉ bạn và quản trị viên xem được ảnh này.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/admin/id/${u.id}`} alt="Ảnh thẻ sinh viên của bạn" className="mt-4 max-h-96 w-auto max-w-full rounded-xl border border-line" />
        </section>
      )}
    </div>
  );
}
