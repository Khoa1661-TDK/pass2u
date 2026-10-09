import Link from "next/link";
import { requireApproved } from "@/lib/session";
import { searchListings, SEARCH_LIMIT, type ListingFilters } from "@/lib/queries";
import { CATEGORIES, CONDITIONS, TYPES } from "@/lib/constants";
import { ListingGrid } from "@/components/listing-card";
import { SearchIcon } from "@/components/icons";

export const metadata = { title: "Khám phá" };

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
  const showFilters = f.focus === "filters";
  const activeExtra = [f.condition, f.min, f.max, f.sort && f.sort !== "new"].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[22px] font-bold sm:text-[28px]">
          {f.q ? <>Kết quả cho &ldquo;{f.q}&rdquo;</> : filtered ? "Tin đăng đã lọc" : "Khám phá"}
        </h1>
        <p className="shrink-0 text-sm tabular-nums text-ink-3">
          {items.length === 0 ? "Không tìm thấy" : `${items.length}${items.length === SEARCH_LIMIT ? "+" : ""} tin`}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 md:hidden">
          <form action="/market" className="relative flex-1 md:hidden">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <label htmlFor="m-q" className="sr-only">Tìm tin đăng</label>
            <input id="m-q" name="q" defaultValue={f.q} autoFocus={f.focus === "search"} placeholder="Tìm tin đăng" className="input !min-h-11 !rounded-full pl-10" />
            {f.category && <input type="hidden" name="category" value={f.category} />}
            {f.type && <input type="hidden" name="type" value={f.type} />}
          </form>
          <Link
            href={showFilters ? hrefWith({}) : `${hrefWith({})}${hrefWith({}).includes("?") ? "&" : "?"}focus=filters`}
            aria-expanded={showFilters}
            className={`chip !min-h-11 md:!min-h-9 ${showFilters ? "!border-ink !text-ink" : ""}`}
          >
            Bộ lọc{activeExtra > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent-fill text-[11px] text-on-accent">{activeExtra}</span>}
          </Link>
          {filtered && <Link href="/market" className="btn btn-ghost btn-sm hidden md:inline-flex">Xóa tất cả</Link>}
      </div>
      {showFilters && (
        <form action="/market" className="rise mt-3 grid gap-4 rounded-lg bg-sunken p-4 sm:grid-cols-[1fr_1.4fr_1fr_auto] sm:items-end">
          {f.q && <input type="hidden" name="q" value={f.q} />}
          {f.category && <input type="hidden" name="category" value={f.category} />}
          {f.type && <input type="hidden" name="type" value={f.type} />}
          <div>
            <label htmlFor="condition" className="field-label">Tình trạng</label>
            <select id="condition" name="condition" defaultValue={f.condition ?? ""} className="input">
              <option value="">Bất kỳ</option>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="field-label">Giá (₫)</legend>
            <div className="flex items-center gap-2">
              <input name="min" inputMode="numeric" aria-label="Giá tối thiểu" placeholder="Tối thiểu" defaultValue={f.min} className="input" />
              <span className="text-ink-3">đến</span>
              <input name="max" inputMode="numeric" aria-label="Giá tối đa" placeholder="Tối đa" defaultValue={f.max} className="input" />
            </div>
          </fieldset>
          <div>
            <label htmlFor="sort" className="field-label">Sắp xếp</label>
            <select id="sort" name="sort" defaultValue={f.sort ?? "new"} className="input">
              <option value="new">Mới nhất</option>
              <option value="price_asc">Giá: thấp đến cao</option>
              <option value="price_desc">Giá: cao xuống thấp</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1">Áp dụng</button>
            <Link href={hrefWith({ condition: undefined, min: undefined, max: undefined, sort: undefined })} className="btn btn-ghost">Đặt lại</Link>
          </div>
        </form>
      )}

      <nav aria-label="Lọc theo loại và chuyên mục" className="scrollbar-none -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 md:mt-5">
        <Link
          href={showFilters ? hrefWith({}) : `${hrefWith({})}${hrefWith({}).includes("?") ? "&" : "?"}focus=filters`}
          aria-expanded={showFilters}
          className={`chip hidden md:inline-flex ${showFilters ? "!border-ink !text-ink" : ""}`}
        >
          Bộ lọc{activeExtra > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent-fill text-[11px] text-on-accent">{activeExtra}</span>}
        </Link>
        <span aria-hidden className="mx-1 hidden h-5 w-px shrink-0 bg-line-strong md:block" />
        {[{ value: undefined, label: "Tất cả" }, ...TYPES].map((t) => (
          <Link key={t.label} href={hrefWith({ type: t.value })} className="chip" aria-current={f.type === t.value || (!f.type && !t.value)}>
            {t.label}
          </Link>
        ))}
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line-strong" />
        {CATEGORIES.map((c) => (
          <Link key={c.value} href={hrefWith({ category: f.category === c.value ? undefined : c.value })} className="chip" aria-current={f.category === c.value}>
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {items.length ? (
          <ListingGrid items={items} />
        ) : (
          <div className="mx-auto max-w-sm py-16 text-center">
            <h2 className="text-lg font-semibold">{filtered ? "Không có tin khớp bộ lọc" : "Chưa có tin đăng nào"}</h2>
            <p className="mt-2 text-ink-2">
              {filtered ? "Thử tìm rộng hơn, hoặc đăng món bạn muốn bán, trao đổi hay tặng miễn phí." : "Hãy là người đầu tiên trao lại một món cho bạn sinh viên khác."}
            </p>
            <Link href="/listings/new" className="btn btn-primary mt-6">Đăng món</Link>
          </div>
        )}
      </div>
    </div>
  );
}
