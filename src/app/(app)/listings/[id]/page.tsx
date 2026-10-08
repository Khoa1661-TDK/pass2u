import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, listings, listingImages, users } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { CATEGORIES, CONDITIONS, formatPrice, label } from "@/lib/constants";
import { contactSeller } from "@/app/actions/chat";
import { deleteListing, setListingStatus } from "@/app/actions/listings";
import { Avatar } from "@/components/avatar";
import { CheckBadge } from "@/components/icons";
import { SubmitButton } from "@/components/ui";
import { ReportForm } from "./report";
import { timeAgo } from "@/lib/time";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireApproved();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db
    .select({ l: listings, seller: { id: users.id, displayName: users.displayName, campus: users.campus, verificationStatus: users.verificationStatus, createdAt: users.createdAt } })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.sellerId))
    .where(eq(listings.id, id));
  if (!row || (row.l.status === "removed" && me.role !== "admin")) notFound();
  const { l, seller } = row;
  const imgs = await db.select().from(listingImages).where(eq(listingImages.listingId, id)).orderBy(asc(listingImages.position));
  const mine = l.sellerId === me.id;
  const [existing] = mine
    ? []
    : await db.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.listingId, id), eq(conversations.buyerId, me.id)));

  return (
    <article className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12">
      <div className="-mx-4 sm:mx-0">
        <div className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto sm:gap-2 sm:rounded-lg">
          {imgs.map((img, i) => (
            <div key={img.id} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sunken sm:overflow-hidden sm:rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={i === 0 ? l.title : `${l.title}, photo ${i + 1}`} className="size-full object-cover" />
              {imgs.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
                  {i + 1}/{imgs.length}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="md:pt-2">
        <div className="flex flex-wrap gap-1.5">
          {l.status === "reserved" && <span className="tag bg-warn-soft text-warn">Reserved</span>}
          {l.status === "completed" && <span className="tag bg-sunken text-ink-2">Completed</span>}
          {l.status === "removed" && <span className="tag bg-danger-soft text-danger">Removed by admin</span>}
          <span className="tag bg-sunken text-ink-2">{label(CATEGORIES, l.category)}</span>
        </div>
        <h1 className="mt-3 text-[26px] font-bold sm:text-[30px]">{l.title}</h1>
        <p className="mt-2 text-[26px] font-bold tabular-nums text-accent-ink">{formatPrice(l.type, l.price)}</p>
        {l.type === "exchange" && l.exchangeFor && (
          <p className="mt-1 text-ink-2"><span className="text-ink-3">Wants in exchange:</span> {l.exchangeFor}</p>
        )}

        <dl className="mt-6 grid grid-cols-3 divide-x divide-line border-y border-line text-sm">
          <div className="py-3 pr-3"><dt className="text-ink-3">Condition</dt><dd className="mt-0.5 font-medium">{label(CONDITIONS, l.condition)}</dd></div>
          <div className="px-3 py-3"><dt className="text-ink-3">Campus</dt><dd className="mt-0.5 font-medium">{l.campus ?? "Any"}</dd></div>
          <div className="py-3 pl-3"><dt className="text-ink-3">Posted</dt><dd className="mt-0.5 font-medium">{timeAgo(l.createdAt)}</dd></div>
        </dl>

        <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-2">{l.description}</p>

        <Link href={`/u/${seller.id}`} className="mt-8 flex items-center gap-3 rounded-lg py-2 hover:bg-sunken/60">
          <Avatar name={seller.displayName} size={44} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold">
              {seller.displayName}
              {seller.verificationStatus === "approved" && <CheckBadge width={17} height={17} className="text-accent" aria-label="Verified FPT student" />}
            </p>
            <p className="text-sm text-ink-3">Verified student{seller.campus ? ` · ${seller.campus}` : ""}</p>
          </div>
        </Link>

        <div className="mt-6 border-t border-line pt-6">
          {mine ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-3">Your listing</p>
              <div className="grid grid-cols-2 gap-2 [&>*]:w-full [&_button]:w-full">
                <Link href={`/listings/${l.id}/edit`} className="btn btn-primary">Edit listing</Link>
                {l.status !== "available" && l.status !== "removed" && (
                  <form action={setListingStatus.bind(null, l.id, "available")}><SubmitButton className="btn btn-secondary">Mark available</SubmitButton></form>
                )}
                {l.status === "available" && (
                  <form action={setListingStatus.bind(null, l.id, "reserved")}><SubmitButton className="btn btn-secondary">Mark reserved</SubmitButton></form>
                )}
                {l.status !== "completed" && l.status !== "removed" && (
                  <form action={setListingStatus.bind(null, l.id, "completed")}><SubmitButton className="btn btn-secondary">Mark completed</SubmitButton></form>
                )}
              </div>
              <form action={deleteListing.bind(null, l.id)}>
                <SubmitButton className="btn btn-ghost btn-sm !px-0 text-danger hover:!bg-transparent hover:underline" pending="Deleting…">Delete listing</SubmitButton>
              </form>
            </div>
          ) : existing ? (
            <Link href={`/inbox/${existing.id}`} className="btn btn-primary w-full">Open your conversation</Link>
          ) : l.status === "available" || l.status === "reserved" ? (
            <form action={contactSeller.bind(null, l.id)} className="space-y-3">
              <label htmlFor="body" className="field-label">Message {seller.displayName.split(" ").at(-1)}</label>
              <textarea
                id="body"
                name="body"
                rows={3}
                className="input resize-none"
                defaultValue={l.type === "free" ? "Hi! Is this still available? I'd love to pick it up." : "Hi! Is this still available?"}
              />
              <SubmitButton className="btn btn-primary w-full" pending="Opening chat…">Send message</SubmitButton>
            </form>
          ) : (
            <p className="text-ink-3">This item is no longer available.</p>
          )}
        </div>

        {!mine && <ReportForm listingId={l.id} />}
      </div>
    </article>
  );
}
