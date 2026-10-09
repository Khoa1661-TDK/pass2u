import Link from "next/link";
import { CONDITIONS, formatPrice, label } from "@/lib/constants";
import type { ListingCardData } from "@/lib/queries";

export function ListingCard({ l }: { l: ListingCardData }) {
  return (
    <Link href={`/listings/${l.id}`} className="group block rounded-lg outline-offset-4 transition-transform duration-200 ease-[var(--ease-out)] active:scale-[0.98] [@media(hover:hover)]:hover:-translate-y-1">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sunken transition-shadow duration-200 [@media(hover:hover)]:group-hover:shadow-[0_14px_30px_-16px_oklch(0.3_0.03_42/0.45)]">
        {l.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.cover}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {l.type === "free" && <span className="tag bg-ok-soft text-ok">Miễn phí</span>}
          {l.status === "reserved" && <span className="tag bg-warn-soft text-warn">Đã giữ</span>}
          {l.status === "completed" && <span className="tag bg-sunken text-ink-2">Đã bán</span>}
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="font-semibold tabular-nums">{formatPrice(l.type, l.price)}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-ink-2 group-hover:text-ink">{l.title}</h3>
        <p className="mt-1 text-[13px] text-ink-3">
          {label(CONDITIONS, l.condition)}{l.campus ? ` · ${l.campus}` : ""}
        </p>
      </div>
    </Link>
  );
}

export function ListingGrid({ items }: { items: ListingCardData[] }) {
  return (
    <div className="stagger grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {items.map((l, i) => (
        <div key={l.id} style={{ "--i": i } as React.CSSProperties}>
          <ListingCard l={l} />
        </div>
      ))}
    </div>
  );
}
