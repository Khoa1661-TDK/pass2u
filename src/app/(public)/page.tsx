import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getUser, gateFor } from "@/lib/session";
import { db } from "@/lib/db";
import { listings, users } from "@/lib/schema";
import { searchListings } from "@/lib/queries";
import { CATEGORIES } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { ListingGrid } from "@/components/listing-card";
import { FallbackImg } from "@/components/fallback-img";
import {
  ArrowRight, MagnifyingGlass, BookOpenText, DeviceMobile, Armchair, TShirt, PencilSimpleLine,
  Package, IdentificationCard, ShieldCheck, Trash,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export const dynamic = "force-dynamic";

const CAT_ICONS: Record<string, Icon> = {
  textbooks: BookOpenText, electronics: DeviceMobile, dorm: Armchair, clothing: TShirt,
  stationery: PencilSimpleLine, other: Package,
};

// Optional photos the team drops into public/categories/<value>.jpg, used
// when a category has no live listing to borrow a cover from.
const STATIC_CAT = new Set(
  existsSync(join(process.cwd(), "public/categories"))
    ? readdirSync(join(process.cwd(), "public/categories")).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4))
    : [],
);

// Stock product photos per category, used until a category has a live
// listing whose cover can stand in. Swap for the team's own shots any time.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=480&h=480&q=70`;
const STOCK_CAT: Record<string, string> = {
  textbooks: unsplash("1512820790803-83ca734da794"),
  electronics: unsplash("1496181133206-80ce9b88a853"),
  dorm: unsplash("1505693416388-ac5ce068fe85"),
  clothing: unsplash("1523381210434-271e8be1f52b"),
  stationery: unsplash("1456735190827-d1262f71b8a3"),
  other: unsplash("1586495777744-4413f21062fa"),
};

const QUICK = ["Giáo trình", "Quạt", "Áo đồng phục", "Máy tính Casio"];

async function categoryCounts() {
  const rows = await db
    .select({
      category: listings.category,
      n: sql<number>`count(*)::int`,
      // Cover photo of the newest available listing in the category.
      cover: sql<string | null>`(array_agg((select url from listing_images li where li.listing_id = ${listings.id} order by li.position limit 1) order by ${listings.createdAt} desc))[1]`,
    })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.sellerId))
    .where(and(eq(listings.status, "available"), sql`${users.bannedAt} is null`))
    .groupBy(listings.category);
  return Object.fromEntries(rows.map((r) => [r.category, r]));
}

export default async function Landing() {
  const u = await getUser();
  if (u) redirect(gateFor(u) ?? (u.role === "admin" ? "/admin" : "/market"));

  const [recent, counts] = await Promise.all([searchListings({}, 12), categoryCounts()]);
  const avail = recent.filter((l) => l.status === "available").slice(0, 8);
  // Keep full rows on desktop (4 columns) once there are enough items.
  const featured = avail.length >= 4 ? avail.slice(0, avail.length - (avail.length % 4)) : avail;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1">
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Join</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: search is the product, so it leads. */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-20">
          <div className="rise max-w-3xl">
            <p className="text-sm font-semibold text-accent-ink">The marketplace for FPT University students</p>
            <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Buy and swap on campus, <span className="text-ink-3">from students you can trust.</span>
            </h1>
          </div>

          <form action="/market" method="get" role="search" className="rise mt-8 max-w-2xl" style={{ animationDelay: "60ms" }}>
            <label htmlFor="hero-q" className="sr-only">Search listings</label>
            <div className="group flex items-center gap-2 rounded-lg border border-line-strong bg-raised p-1.5 pl-4 shadow-[0_10px_30px_-18px_oklch(0.3_0.03_42/0.45)] transition-[border-color,box-shadow] duration-200 focus-within:border-accent focus-within:shadow-[0_0_0_4px_oklch(0.64_0.19_42/0.15)] [@media(hover:hover)]:hover:border-ink-3">
              <MagnifyingGlass size={22} className="shrink-0 text-ink-3" />
              <input
                id="hero-q"
                name="q"
                type="search"
                placeholder="Textbooks, fans, uniforms…"
                className="min-h-12 w-full min-w-0 bg-transparent text-base focus-visible:outline-none placeholder:text-ink-3"
              />
              <button className="btn btn-primary !min-h-12 shrink-0 !px-5">Search</button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-3">Try</span>
              {QUICK.map((q) => (
                <Link key={q} href={`/market?q=${encodeURIComponent(q)}`} className="chip !min-h-8 !px-3 !text-[13px]">{q}</Link>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-ink-3">Sign in with a verified student account to see results.</p>
          </form>
        </section>

        {/* Categories */}
        <section aria-labelledby="cats" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 md:pb-20">
          <h2 id="cats" className="text-lg font-semibold">Shop by category</h2>
          <ul className="stagger scrollbar-none -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {CATEGORIES.map((c, i) => {
              const I = CAT_ICONS[c.value] ?? Package;
              const n = counts[c.value]?.n;
              const img = counts[c.value]?.cover ?? (STATIC_CAT.has(c.value) ? `/categories/${c.value}.jpg` : STOCK_CAT[c.value] ?? null);
              return (
                <li key={c.value} style={{ "--i": i } as React.CSSProperties} className="shrink-0">
                  <Link
                    href={`/market?category=${c.value}`}
                    className="group block w-36 rounded-lg active:scale-[0.98] transition-transform duration-200 ease-[var(--ease-out)] sm:w-auto"
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-lg bg-sunken ring-1 ring-line">
                      {img ? (
                        <FallbackImg
                          src={img}
                          className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.05]"
                          fallback={<span className="grid size-full place-items-center"><I size={32} className="text-ink-3" /></span>}
                        />
                      ) : (
                        <span className="grid size-full place-items-center">
                          <I size={32} className="text-ink-3 transition-colors group-hover:text-accent-ink" />
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block px-0.5 text-sm font-semibold leading-tight group-hover:text-accent-ink">{c.label}</span>
                    {n ? <span className="mt-0.5 block px-0.5 text-[13px] tabular-nums text-ink-3">{n} available</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Real listings only. Nothing is shown when the market is empty. */}
        <section aria-labelledby="fresh" className="border-y border-line bg-sunken/50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="fresh" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold">Just listed</h2>
                <p className="mt-1.5 text-ink-2">Posted by verified students. Sign in to message the seller.</p>
              </div>
              {featured.length > 0 && (
                <Link href="/market" className="btn btn-ghost btn-sm group shrink-0">
                  See all
                  <ArrowRight size={16} weight="bold" className="transition-transform [@media(hover:hover)]:group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
            <div className="mt-8">
              {featured.length > 0 ? (
                <ListingGrid items={featured} />
              ) : (
                <div className="rounded-lg border border-dashed border-line-strong bg-raised px-6 py-12 text-center">
                  <Package size={32} className="mx-auto text-ink-3" />
                  <p className="mt-3 font-semibold">The shelves are empty for now</p>
                  <p className="mx-auto mt-1 max-w-[40ch] text-ink-2">Be the first to post. Seniors clearing out their dorm get the first buyers.</p>
                  <Link href="/signup" className="btn btn-primary mt-6">Post an item</Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Verification, kept short */}
        <section aria-labelledby="verify" className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-20">
          <div>
            <h2 id="verify" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold">Students only, checked by hand</h2>
            <p className="mt-3 max-w-[42ch] leading-relaxed text-ink-2">
              Every account shows a physical FPT student card before it can buy or sell. No outsiders, no resellers.
            </p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { I: IdentificationCard, t: "Upload your card", b: "A clear photo of your student ID." },
              { I: ShieldCheck, t: "An admin approves", b: "A person checks it, not a bot." },
              { I: Trash, t: "Photo deleted", b: "Removed within 30 days of review." },
            ].map(({ I, t, b }) => (
              <li key={t} className="bg-raised p-5">
                <I size={24} className="text-accent-ink" />
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{b}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Compact CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
          <div className="flex flex-col items-start justify-between gap-5 rounded-lg bg-ink px-6 py-7 text-bg sm:flex-row sm:items-center sm:px-8">
            <p className="max-w-[34ch] text-xl font-semibold leading-snug">Clearing out your dorm, or just moved in? Join in two minutes.</p>
            <div className="flex shrink-0 gap-2">
              <Link href="/signup" className="btn btn-primary group">
                Create account
                <ArrowRight size={16} weight="bold" className="transition-transform [@media(hover:hover)]:group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className="btn text-bg/80 [@media(hover:hover)]:hover:text-bg">Sign in</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-ink-3 sm:px-6">
          <span>PASS2U, a student project at FPT University</span>
          <span>Not affiliated with FPT Education</span>
        </div>
      </footer>
    </div>
  );
}
