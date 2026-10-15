import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { setBanned } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui";

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

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireAdmin();
  const { q } = await searchParams;
  const term = q ? `%${q}%` : null;
  const rows = await db
    .select()
    .from(users)
    .where(term ? or(ilike(users.displayName, term), ilike(users.email, term), ilike(users.studentCode, term)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(100);
  return (
    <div>
      <form className="max-w-sm">
        <label htmlFor="uq" className="sr-only">Tìm sinh viên</label>
        <input id="uq" name="q" defaultValue={q} placeholder="Tìm tên, email hoặc mã sinh viên" className="input" />
      </form>
      {/* Rows stack on phones; a table's columns only fit from sm up. */}
      <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
        <li aria-hidden className="hidden py-2 text-ink-3 sm:grid sm:grid-cols-[1.4fr_0.8fr_1.6fr_auto_4.5rem] sm:gap-4">
          <span>Tên</span><span>Mã</span><span>Email</span><span>Trạng thái</span><span />
        </li>
        {rows.map((u) => (
          <li key={u.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[1.4fr_0.8fr_1.6fr_auto_4.5rem]">
            <div className="min-w-0">
              <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">{u.displayName}</Link>
              {u.role === "admin" && <span className="tag ml-2 bg-ink text-bg">Quản trị</span>}
            </div>
            <span className="col-start-1 row-start-2 font-mono text-ink-2 sm:col-start-auto sm:row-start-auto sm:text-ink">{u.studentCode ?? "Chưa có"}</span>
            <span className="col-start-1 row-start-3 min-w-0 truncate text-ink-2 sm:col-start-auto sm:row-start-auto">
              {u.email}{!u.emailVerifiedAt && <span className="text-ink-3"> (chưa xác nhận)</span>}
            </span>
            <span className="col-start-2 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto sm:justify-self-start">
              {u.bannedAt ? <span className="tag bg-danger text-on-danger">Đã khóa</span> : <span className={`tag ${statusTag[u.verificationStatus]}`}>{statusLabel[u.verificationStatus] ?? u.verificationStatus}</span>}
            </span>
            <div className="col-start-2 row-span-2 row-start-2 justify-self-end sm:col-start-auto sm:row-span-1 sm:row-start-auto">
              {u.id !== me.id && u.role !== "admin" && (
                <form action={setBanned.bind(null, u.id, !u.bannedAt)}>
                  <SubmitButton className={u.bannedAt ? "btn btn-secondary btn-sm" : "btn btn-danger btn-sm"}>{u.bannedAt ? "Mở lại" : "Khóa"}</SubmitButton>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
