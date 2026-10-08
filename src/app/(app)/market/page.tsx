import Link from "next/link";
import { requireApproved } from "@/lib/session";
import { searchListings, type ListingFilters } from "@/lib/queries";
import { CATEGORIES, CONDITIONS, TYPES } from "@/lib/constants";
import { ListingGrid } from "@/components/listing-card";
import { SearchIcon } from "@/components/icons";

export const metadata = { title: "Browse" };

export default async function Market({ searchParams }: { searchParams: Promise<ListingFilters & { focus?: string }> }) {
  await requireApproved();
  const f = await searchParams;
  const items = await searchListings(f);
  const filtered = Boolean(f.q || f.category || f.type || f.condition || f.min || f.max);
  const hrefWith = (patch: Partial<ListingFilters>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...f, ...patch, focus: undefined })) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `/market?${s}` : "/market";
  };
  const activeExtra = [f.condition, f.min, f.max, f.sort && f.sort !== "new"].filter(Boolean).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold sm:text-[32px]">
            {f.q ? <>Results for &ldquo;{f.q}&rdquo;</> : filtered ? "Filtered listings" : "What do you need today?"}
          </h1>
          <p className="mt-1 text-ink-3">
            {items.length === 0 ? "No listings match yet." : `${items.length}${items.length === 48 ? "+" : ""} item${items.length === 1 ? "" : "s"} from FPT students`}
          </p>
        </div>
      </div>

      <form action="/market" className="relative mt-5 md:hidden">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <label htmlFor="m-q" className="sr-only">Search listings</label>
        <input id="m-q" name="q" defaultValue={f.q} autoFocus={f.focus === "search"} placeholder="Search listings" className="input !rounded-full pl-10" />
        {f.category && <input type="hidden" name="category" value={f.category} />}
      </form>

      <nav aria-label="Categories" className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={hrefWith({ category: undefined })} className="chip" aria-current={!f.category}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.value} href={hrefWith({ category: c.value })} className="chip" aria-current={f.category === c.value}>
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <div role="group" aria-label="Listing type" className="flex rounded-full bg-sunken p-1">
          {[{ value: undefined, label: "Everything" }, ...TYPES].map((t) => (
            <Link
              key={t.label}
              href={hrefWith({ type: t.value })}
              aria-current={f.type === t.value || (!f.type && !t.value) ? "true" : undefined}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-2 aria-[current=true]:bg-raised aria-[current=true]:text-ink aria-[current=true]:shadow-[0_1px_2px_oklch(0.3_0.02_50/0.12)]"
            >
              {t.label}
            </Link>
          ))}
        </div>

        <details className="group relative">
          <summary className="chip cursor-pointer list-none">
            More filters{activeExtra > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-white">{activeExtra}</span>}
          </summary>
          <form action="/market" className="absolute left-0 z-10 mt-2 w-[min(320px,calc(100vw-2rem))] space-y-4 rounded-lg border border-line bg-raised p-4 shadow-[0_16px_40px_-16px_oklch(0.3_0.02_50/0.3)]">
            {f.q && <input type="hidden" name="q" value={f.q} />}
            {f.category && <input type="hidden" name="category" value={f.category} />}
            {f.type && <input type="hidden" name="type" value={f.type} />}
            <div>
              <label htmlFor="condition" className="field-label">Condition</label>
              <select id="condition" name="condition" defaultValue={f.condition ?? ""} className="input">
                <option value="">Any condition</option>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <fieldset>
              <legend className="field-label">Price (₫)</legend>
              <div className="flex items-center gap-2">
                <input name="min" inputMode="numeric" aria-label="Minimum price" placeholder="Min" defaultValue={f.min} className="input" />
                <span className="text-ink-3">to</span>
                <input name="max" inputMode="numeric" aria-label="Maximum price" placeholder="Max" defaultValue={f.max} className="input" />
              </div>
            </fieldset>
            <div>
              <label htmlFor="sort" className="field-label">Sort by</label>
              <select id="sort" name="sort" defaultValue={f.sort ?? "new"} className="input">
                <option value="new">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1">Apply</button>
              <Link href={hrefWith({ condition: undefined, min: undefined, max: undefined, sort: undefined })} className="btn btn-secondary">Reset</Link>
            </div>
          </form>
        </details>

        {filtered && <Link href="/market" className="btn btn-ghost btn-sm ml-auto">Clear all</Link>}
      </div>

      <div className="mt-7">
        {items.length ? (
          <ListingGrid items={items} />
        ) : (
          <div className="mx-auto max-w-sm py-16 text-center">
            <h2 className="text-lg font-semibold">{filtered ? "Nothing matches those filters" : "No listings yet"}</h2>
            <p className="mt-2 text-ink-2">
              {filtered ? "Try a broader search, or post what you're looking for to give away or swap." : "Be the first to pass something on to a fellow student."}
            </p>
            <Link href="/listings/new" className="btn btn-primary mt-6">Post an item</Link>
          </div>
        )}
      </div>
    </div>
  );
}
