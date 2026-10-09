import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, reports, users } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { dismissReport, removeListing } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Reports() {
  await requireAdmin();
  const rows = await db
    .select({ id: reports.id, reason: reports.reason, createdAt: reports.createdAt, listingId: listings.id, title: listings.title, listingStatus: listings.status, reporter: users.displayName })
    .from(reports)
    .innerJoin(listings, eq(listings.id, reports.listingId))
    .innerJoin(users, eq(users.id, reports.reporterId))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt));
  if (!rows.length) return <p className="py-14 text-center text-ink-3">Chưa có báo cáo nào đang mở.</p>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href={`/listings/${r.listingId}`} className="font-semibold hover:underline">{r.title}</Link>
            {r.listingStatus === "removed" && <span className="tag ml-2 bg-danger-soft text-danger">Đã gỡ</span>}
            <p className="mt-1 text-ink-2">&ldquo;{r.reason}&rdquo;</p>
            <p className="mt-1 text-sm text-ink-3">Báo cáo bởi {r.reporter}, {timeAgo(r.createdAt)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <form action={removeListing.bind(null, r.listingId, r.id)}><SubmitButton className="btn btn-danger btn-sm">Gỡ tin đăng</SubmitButton></form>
            <form action={dismissReport.bind(null, r.id)}><SubmitButton className="btn btn-secondary btn-sm">Bỏ qua</SubmitButton></form>
          </div>
        </li>
      ))}
    </ul>
  );
}
