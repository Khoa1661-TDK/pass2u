import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, listings, listingImages, messages, reservations, users } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { formatPrice } from "@/lib/constants";
import { reservationStep } from "@/app/actions/chat";
import { AutoRefresh } from "@/components/auto-refresh";
import { ArrowLeft } from "@/components/icons";
import { SubmitButton } from "@/components/ui";
import { Composer } from "./composer";
import { ScrollToEnd } from "./scroll";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return {};
  const [row] = await db
    .select({ title: listings.title })
    .from(conversations)
    .innerJoin(listings, eq(listings.id, conversations.listingId))
    .where(eq(conversations.id, id));
  if (!row) return {};
  return { title: row.title };
}

export default async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireApproved();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), or(eq(conversations.buyerId, me.id), eq(conversations.sellerId, me.id))));
  if (!c) notFound();
  const iAmBuyer = c.buyerId === me.id;

  const [[l], [other], msgs, [resv]] = await Promise.all([
    db
      .select({
        id: listings.id, title: listings.title, type: listings.type, price: listings.price, status: listings.status,
        cover: sql<string | null>`(select url from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`,
      })
      .from(listings)
      .where(eq(listings.id, c.listingId)),
    db.select({ id: users.id, displayName: users.displayName }).from(users).where(eq(users.id, iAmBuyer ? c.sellerId : c.buyerId)),
    db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt)),
    db.select().from(reservations).where(and(eq(reservations.listingId, c.listingId), eq(reservations.buyerId, c.buyerId))).orderBy(desc(reservations.createdAt)).limit(1),
  ]);

  await db.update(conversations).set(iAmBuyer ? { buyerReadAt: new Date() } : { sellerReadAt: new Date() }).where(eq(conversations.id, id));

  const live = resv && (resv.status === "requested" || resv.status === "accepted") ? resv : null;
  const step = (s: Parameters<typeof reservationStep>[1]) => reservationStep.bind(null, id, s);

  return (
    <div className="mx-auto flex max-w-2xl flex-col md:min-h-[calc(100dvh-8rem)]">
      <AutoRefresh every={4000} />
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <Link href="/inbox" className="btn btn-ghost btn-sm -ml-2 !px-2" aria-label="Back to inbox"><ArrowLeft /></Link>
        <Link href={`/listings/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="size-11 shrink-0 overflow-hidden rounded-md bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {l.cover && <img src={l.cover} alt="" className="size-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{other.displayName}</p>
            <p className="truncate text-sm text-ink-3">{l.title} · {formatPrice(l.type, l.price)}</p>
          </div>
        </Link>
      </div>

      <section aria-label="Reservation" className="flex flex-wrap items-center gap-2 border-b border-line py-3 text-sm">
        <ReservationSummary status={live?.status ?? resv?.status} listingStatus={l.status} iAmBuyer={iAmBuyer} />
        <div className="ml-auto flex flex-wrap gap-2">
          {iAmBuyer && !live && l.status === "available" && (
            <form action={step("request")}><SubmitButton className="btn btn-primary btn-sm">Request to reserve</SubmitButton></form>
          )}
          {!iAmBuyer && live?.status === "requested" && (
            <>
              <form action={step("accept")}><SubmitButton className="btn btn-primary btn-sm">Accept</SubmitButton></form>
              <form action={step("decline")}><SubmitButton className="btn btn-secondary btn-sm">Decline</SubmitButton></form>
            </>
          )}
          {!iAmBuyer && live?.status === "accepted" && (
            <form action={step("complete")}><SubmitButton className="btn btn-primary btn-sm">Mark as completed</SubmitButton></form>
          )}
          {live && (
            <form action={step("cancel")}><SubmitButton className="btn btn-ghost btn-sm text-danger">Cancel reservation</SubmitButton></form>
          )}
        </div>
      </section>

      <ol className="flex flex-1 flex-col gap-1.5 py-5" aria-label="Messages">
        {msgs.length === 0 && <li className="py-10 text-center text-sm text-ink-3">Say hi and agree on a time and place to meet.</li>}
        {msgs.map((m, i) => {
          const mine = m.senderId === me.id;
          if (m.kind === "event")
            return (
              <li key={m.id} className="my-2 text-center text-xs text-ink-3">
                <span className="font-medium text-ink-2">{mine ? "You" : other.displayName}</span> {m.body} · {m.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </li>
            );
          const gap = i > 0 && msgs[i - 1].senderId !== m.senderId;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} ${gap ? "mt-2" : ""}`}>
              <p
                title={m.createdAt.toLocaleString("vi-VN")}
                className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${mine ? "rounded-br-md bg-accent-fill text-on-accent" : "rounded-bl-md bg-sunken text-ink"}`}
              >
                {m.body}
              </p>
            </li>
          );
        })}
      </ol>
      <ScrollToEnd count={msgs.length} />

      <div className="sticky bottom-16 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0">
        <Composer conversationId={id} />
        <p className="mt-2 text-xs text-ink-3">Meet in a public spot on campus. Never send money before you see the item.</p>
      </div>
    </div>
  );
}

function ReservationSummary({ status, listingStatus, iAmBuyer }: { status?: string; listingStatus: string; iAmBuyer: boolean }) {
  if (status === "requested")
    return <span className="tag bg-warn-soft text-warn">{iAmBuyer ? "Waiting for the seller to accept" : "Wants to reserve this item"}</span>;
  if (status === "accepted") return <span className="tag bg-ok-soft text-ok">Reserved for {iAmBuyer ? "you" : "this buyer"}</span>;
  if (status === "completed") return <span className="tag bg-sunken text-ink-2">Exchange completed</span>;
  if (listingStatus === "reserved") return <span className="tag bg-sunken text-ink-2">Reserved by someone else</span>;
  if (listingStatus === "completed" || listingStatus === "removed") return <span className="tag bg-sunken text-ink-2">No longer available</span>;
  return <span className="text-ink-3">{iAmBuyer ? "Agree on details, then reserve." : "No reservation yet."}</span>;
}
