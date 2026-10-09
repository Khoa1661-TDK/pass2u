import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Steps } from "../steps";
import { ResendForm } from "./resend";

export const metadata = { title: "Xác nhận email" };

export default async function CheckEmail() {
  const u = await requireUser();
  if (u.emailVerifiedAt || u.role === "admin") redirect("/verify");
  return (
    <>
      <Steps current={1} />
      <h1 className="font-serif text-[2.25rem] font-normal leading-tight">Kiểm tra hộp thư</h1>
      <p className="mt-3 text-ink-2">
        Chúng tôi đã gửi link xác nhận tới <strong className="font-semibold text-ink">{u.email}</strong>. Mở link trên bất kỳ thiết bị nào để tiếp tục.
      </p>
      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-3 text-sm text-ink-3">Vài phút rồi mà chưa thấy? Kiểm tra thư rác, rồi:</p>
        <ResendForm />
      </div>
    </>
  );
}
