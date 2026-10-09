import Link from "next/link";
import { requireApproved } from "@/lib/session";
import { listingsBySeller } from "@/lib/queries";
import { ListingGrid } from "@/components/listing-card";

export const metadata = { title: "Món của tôi" };

export default async function Me({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireApproved();
  const { tab } = await searchParams;
  const done = tab === "completed";
  const items = await listingsBySeller(u.id, done ? ["completed"] : ["available", "reserved"]);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold">Món của tôi</h1>
          <p className="mt-1 text-ink-3">Chạm vào tin đăng để sửa hoặc đổi trạng thái.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/me/settings" className="btn btn-secondary btn-sm">Cài đặt</Link>
          <Link href="/listings/new" className="btn btn-primary btn-sm">Đăng món</Link>
        </div>
      </div>
      <nav className="mt-6 flex gap-6 border-b border-line text-sm font-medium" aria-label="Trạng thái tin đăng">
        {[["Đang bán", "/me", !done], ["Đã bán", "/me?tab=completed", done]].map(([t, href, on]) => (
          <Link key={String(t)} href={String(href)} aria-current={on ? "page" : undefined} className={`-mb-px border-b-2 pb-3 ${on ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink-2"}`}>
            {t}
          </Link>
        ))}
      </nav>
      <div className="mt-7">
        {items.length ? (
          <ListingGrid items={items} />
        ) : (
          <p className="py-14 text-center text-ink-3">{done ? "Các giao dịch đã hoàn tất sẽ hiển thị ở đây." : "Bạn chưa có tin đăng nào."}</p>
        )}
      </div>
    </div>
  );
}
