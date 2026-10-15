"use client";

import { useEffect, useRef, useState } from "react";
import { moreListings } from "@/app/actions/market";
import type { ListingCardData, ListingFilters } from "@/lib/queries";
import { ListingCard } from "./listing-card";

// The first page is server-rendered; later pages load as the bottom of the
// grid scrolls near the screen, so the market opens fast however many
// listings there are.
export function InfiniteListings({ initial, hasMore: initialMore, filters }: { initial: ListingCardData[]; hasMore: boolean; filters: ListingFilters }) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialMore);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);
  const pageStart = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (loading.current) return;
    loading.current = true;
    setFailed(false);
    try {
      const next = await moreListings(filters, items.length);
      pageStart.current = items.length;
      setItems((cur) => [...cur, ...next.items.filter((n) => !cur.some((c) => c.id === n.id))]);
      setHasMore(next.hasMore);
    } catch {
      setFailed(true);
    } finally {
      loading.current = false;
    }
  };

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && load(), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  });

  return (
    <>
      <div className="stagger grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {items.map((l, i) => (
          <div key={l.id} style={{ "--i": i >= pageStart.current ? i - pageStart.current : 0 } as React.CSSProperties}>
            <ListingCard l={l} eager={i < 4} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={sentinel} className="mt-8 flex justify-center">
          {failed ? (
            <button type="button" onClick={load} className="btn btn-secondary btn-sm">Tải thêm</button>
          ) : (
            <span aria-label="Đang tải thêm tin" className="size-5 animate-spin rounded-full border-2 border-ink-3 border-r-transparent" />
          )}
        </div>
      )}
    </>
  );
}
