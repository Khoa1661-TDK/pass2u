import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { users, idDocuments, listings } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { approveStudent, rejectStudent, setBanned } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui";
import { RefreshForm } from "@/components/refresh-form";
import { Avatar } from "@/components/avatar";
import { CheckTag } from "@/components/check-tag";
import { ID_RETENTION_DAYS } from "@/lib/constants";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const statusTag: Record<string, string> = {
  approved: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
  rejected: "bg-danger-soft text-danger",
  none: "bg-sunken text-ink-2",
};

const statusLabel: Record<string, string> = {
  approved: "Đã duyệt",
  pending: "Chờ duyệt",
  rejected: "Bị từ chối",
  none: "Chưa xác minh",
};

const listingLabel: Record<string, string> = {
  available: "Đang bán",
  reserved: "Đã giữ",
  completed: "Đã bán",
  removed: "Đã gỡ",
};

const fmt = (d: Date) => d.toLocaleString("vi-VN", { hour12: false });

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [u] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, id));
  return { title: u ? `Hồ sơ ${u.displayName}` : "Sinh viên" };
}

export default async function StudentRecord({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) notFound();
  const [doc] = await db.select().from(idDocuments).where(eq(idDocuments.userId, id));
  const rows = await db
    .select({ id: listings.id, title: listings.title, status: listings.status, createdAt: listings.createdAt })
    .from(listings)
    .where(eq(listings.sellerId, id))
    .orderBy(desc(listings.createdAt));
  const active = rows.filter((r) => r.status === "available" || r.status === "reserved").length;
  const done = rows.filter((r) => r.status === "completed").length;
  const manageable = u.role !== "admin" && u.id !== me.id;

  return (
    <div>
      <Link href="/admin/users" className="text-sm font-medium text-ink-3 hover:text-ink-2">
        ← Danh sách sinh viên
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar name={u.displayName} size={56} />
        <div>
          <h2 className="font-serif text-2xl font-normal leading-tight">{u.displayName}</h2>
          <p className="mt-1 text-sm text-ink-2">
            {u.email}
            {!u.emailVerifiedAt && <span className="text-ink-3"> (chưa xác nhận email)</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 md:ml-auto">
          {u.role === "admin" && <span className="tag bg-ink text-bg">Quản trị</span>}
          {u.bannedAt ? (
            <span className="tag bg-danger text-on-danger">Đã khóa</span>
          ) : (
            <span className={`tag ${statusTag[u.verificationStatus]}`}>{statusLabel[u.verificationStatus] ?? u.verificationStatus}</span>
          )}
        </div>
      </div>

      <dl className="mt-8 grid gap-x-8 gap-y-3 border-y border-line py-4 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4 sm:block"><dt className="text-ink-3">Mã sinh viên</dt><dd className="font-mono font-medium">{u.studentCode ?? "Chưa có"}</dd></div>
        <div className="flex justify-between gap-4 sm:block"><dt className="text-ink-3">Cơ sở</dt><dd className="font-medium">{u.campus ?? "Chưa có"}</dd></div>
        <div className="flex justify-between gap-4 sm:block"><dt className="text-ink-3">Tham gia</dt><dd>{fmt(u.createdAt)}</dd></div>
        <div className="flex justify-between gap-4 sm:block"><dt className="text-ink-3">Email xác nhận lúc</dt><dd>{u.emailVerifiedAt ? fmt(u.emailVerifiedAt) : "—"}</dd></div>
        {u.verifiedAt && <div className="flex justify-between gap-4 sm:block"><dt className="text-ink-3">Được duyệt lúc</dt><dd>{fmt(u.verifiedAt)}</dd></div>}
        {u.rejectionReason && <div className="flex justify-between gap-4 sm:block"><dt className="text-ink-3">Lý do từ chối gần nhất</dt><dd className="text-danger">{u.rejectionReason}</dd></div>}
        {u.bio && <div className="flex justify-between gap-4 sm:block sm:col-span-2"><dt className="text-ink-3">Giới thiệu</dt><dd>{u.bio}</dd></div>}
      </dl>

      {manageable && (
        <div className="mt-6 flex flex-wrap items-start gap-2">
          {u.verificationStatus === "pending" && (
            <>
              <RefreshForm action={approveStudent.bind(null, u.id)}>
                <SubmitButton className="btn btn-primary btn-sm" pending="Đang duyệt…">Duyệt</SubmitButton>
              </RefreshForm>
              <details className="group">
                <summary className="btn btn-danger btn-sm list-none">Từ chối…</summary>
                <RefreshForm action={rejectStudent.bind(null, u.id)} className="mt-3 w-[min(360px,80vw)] space-y-2">
                  <label htmlFor="reject-reason" className="field-label">Lý do hiển thị với sinh viên</label>
                  <textarea id="reject-reason" name="reason" rows={2} className="input resize-none" defaultValue="Ảnh bị mờ hoặc mã sinh viên không khớp. Vui lòng tải lên ảnh rõ hơn." />
                  <SubmitButton className="btn btn-danger btn-sm" pending="Đang từ chối…">Xác nhận từ chối</SubmitButton>
                </RefreshForm>
              </details>
            </>
          )}
          <form action={setBanned.bind(null, u.id, !u.bannedAt)}>
            <SubmitButton className={u.bannedAt ? "btn btn-secondary btn-sm" : "btn btn-danger btn-sm"}>{u.bannedAt ? "Mở khóa tài khoản" : "Khóa tài khoản"}</SubmitButton>
          </form>
        </div>
      )}

      <section className="mt-10">
        <h3 className="text-sm font-semibold text-ink">Ảnh thẻ đã nộp</h3>
        {doc ? (
          <>
            <a href={`/api/admin/id/${u.id}`} target="_blank" rel="noreferrer" className="mt-3 block max-w-[560px] overflow-hidden rounded-lg bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/id/${u.id}`} alt={`Ảnh thẻ sinh viên do ${u.displayName} nộp`} className="aspect-[1.586] w-full object-contain" />
            </a>
            <ul aria-label="Kiểm tra thẻ tự động" className="mt-3 flex flex-wrap gap-1.5">
              <CheckTag ok={doc.ocrCode == null ? null : doc.ocrCode === u.studentCode} label={doc.ocrCode ? `Mã trên thẻ ${doc.ocrCode}` : "Không đọc được mã trên thẻ"} />
              <CheckTag ok={doc.ocrNameMatch} label={doc.ocrNameMatch ? "Có tên trên thẻ" : doc.ocrNameMatch === false ? "Không thấy tên trên thẻ" : "Chưa kiểm tra tên"} />
              <CheckTag ok={doc.ocrLooksFpt} label={doc.ocrLooksFpt ? "Có chữ FPT" : doc.ocrLooksFpt === false ? "Không có chữ FPT" : "Chưa kiểm tra thẻ"} />
            </ul>
            {doc.ocrText && (
              <details className="mt-3 max-w-[560px]">
                <summary className="cursor-pointer text-sm font-medium text-ink-2">Xem văn bản OCR</summary>
                <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-sunken p-3 text-xs text-ink-2">{doc.ocrText}</pre>
              </details>
            )}
            <p className="mt-2 text-sm text-ink-3">
              Tải lên {timeAgo(doc.uploadedAt)}.{" "}
              {doc.deleteAfter ? `Ảnh sẽ bị xóa ${timeAgo(doc.deleteAfter)}.` : `Ảnh bị xóa ${ID_RETENTION_DAYS} ngày sau khi có quyết định.`}
            </p>
          </>
        ) : (
          <p className="mt-3 text-ink-3">Sinh viên này chưa nộp ảnh thẻ.</p>
        )}
      </section>

      <section className="mt-10">
        <h3 className="text-sm font-semibold text-ink">Tin đăng</h3>
        <p className="mt-2 text-sm text-ink-2">
          {rows.length} tin · {active} đang hoạt động · {done} đã hoàn tất
        </p>
        {rows.length > 0 && (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {rows.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <Link href={`/listings/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                <span className="shrink-0 text-ink-3">{listingLabel[r.status]} · {timeAgo(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm">
          <Link href={`/u/${u.id}`} className="font-semibold text-accent-ink underline-offset-4 hover:underline">Xem trang công khai</Link>
        </p>
      </section>
    </div>
  );
}
