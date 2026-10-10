import { requireApproved } from "@/lib/session";
import { SettingsForm } from "./form";

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
        <div className="flex justify-between py-3"><dt className="text-ink-3">Căn cước công dân</dt><dd className="font-mono">{u.cccd ?? "Chưa có"}</dd></div>
        <div className="flex justify-between py-3"><dt className="text-ink-3">Ngày sinh</dt><dd>{u.birthDate ?? "Chưa có"}</dd></div>
        <div className="flex justify-between py-3"><dt className="text-ink-3">Duyệt thẻ</dt><dd className="font-medium text-ok">{u.role === "admin" ? "Quản trị" : "Đã duyệt"}</dd></div>
      </dl>
    </div>
  );
}
