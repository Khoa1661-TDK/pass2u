import Link from "next/link";
import { desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { conversations, listings, listingImages, messages, users } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/time";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata = { title: "Tin nhắn" };

export default async function Inbox() {
  const me = await requireApproved();
  const buyer = alias(users, "buyer");
  const seller = alias(users, "seller");
  const rows = await db
    .select({
      id: conversations.id,
      lastMessageAt: conversations.lastMessageAt,
      buyerId: conversations.buyerId,
      buyerReadAt: conversations.buyerReadAt,
      sellerReadAt: conversations.sellerReadAt,
      title: listings.title,
      buyerName: buyer.displayName,
      sellerName: seller.displayName,
      cover: sql<string | null>`(select url from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`,
      last: sql<string | null>`(select body from ${messages} m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
      lastKind: sql<string | null>`(select kind from ${messages} m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
      lastSender: sql<string | null>`(select sender_id from ${messages} m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
    })
    .from(conversations)
    .innerJoin(listings, eq(listings.id, conversations.listingId))
    .innerJoin(buyer, eq(buyer.id, conversations.buyerId))
    .innerJoin(seller, eq(seller.id, conversations.sellerId))
    .where(or(eq(conversations.buyerId, me.id), eq(conversations.sellerId, me.id)))
    .orderBy(desc(conversations.lastMessageAt));

  return (
    <div className="mx-auto max-w-2xl">
      <AutoRefresh every={10000} />
      <h1 className="text-[28px] font-bold">Tin nhắn</h1>
      {rows.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-semibold">Chưa có cuộc trò chuyện nào</p>
          <p className="mt-1 text-ink-3">Nhắn cho người bán từ bất kỳ tin đăng nào, cuộc trò chuyện sẽ hiện ở đây.</p>
          <Link href="/market" className="btn btn-secondary mt-6">Khám phá tin đăng</Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {rows.map((c) => {
            const iAmBuyer = c.buyerId === me.id;
            const other = iAmBuyer ? c.sellerName : c.buyerName;
            const readAt = iAmBuyer ? c.buyerReadAt : c.sellerReadAt;
            const unread = c.lastSender && c.lastSender !== me.id && (!readAt || readAt < c.lastMessageAt);
            return (
              <li key={c.id}>
                <Link href={`/inbox/${c.id}`} className="flex items-center gap-3 py-3.5 hover:bg-sunken/50">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-sunken">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.cover && <img src={c.cover} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`truncate ${unread ? "font-bold" : "font-semibold"}`}>{other}</p>
                      <span className="shrink-0 text-xs text-ink-3">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-sm text-ink-3">{c.title}</p>
                    <p className={`truncate text-sm ${unread ? "font-medium text-ink" : "text-ink-2"}`}>
                      {c.lastKind === "event" ? `${c.lastSender === me.id ? "Bạn" : other} ${c.last}` : <>{c.lastSender === me.id && "Bạn: "}{c.last ?? "Chưa có tin nhắn"}</>}
                    </p>
                  </div>
                  {unread && <span className="size-2.5 shrink-0 rounded-full bg-accent" aria-label="Chưa đọc" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
