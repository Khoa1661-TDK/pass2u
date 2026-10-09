import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { listings, listingImages, users } from "./schema";

export type ListingFilters = {
  q?: string;
  category?: string;
  type?: string;
  condition?: string;
  min?: string;
  max?: string;
  sort?: string;
};

const cover = sql<string | null>`(select url from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`;

export const listingCardFields = {
  id: listings.id,
  title: listings.title,
  type: listings.type,
  price: listings.price,
  condition: listings.condition,
  status: listings.status,
  campus: listings.campus,
  createdAt: listings.createdAt,
  cover,
};

export type ListingCardData = {
  id: string;
  title: string;
  type: string;
  price: number | null;
  condition: string;
  status: string;
  campus: string | null;
  createdAt: Date;
  cover: string | null;
};

export const SEARCH_LIMIT = 48;

export async function searchListings(f: ListingFilters, limit = SEARCH_LIMIT) {
  const where: SQL[] = [inArray(listings.status, ["available", "reserved"])];
  if (f.q?.trim()) {
    const term = `%${f.q.trim().replace(/[%_]/g, "\\$&")}%`;
    where.push(or(ilike(listings.title, term), ilike(listings.description, term))!);
  }
  if (f.category) where.push(eq(listings.category, f.category));
  if (f.type === "sell" || f.type === "exchange" || f.type === "free") where.push(eq(listings.type, f.type));
  if (f.condition === "new" || f.condition === "like_new" || f.condition === "good" || f.condition === "fair")
    where.push(eq(listings.condition, f.condition));
  const min = Number(f.min), max = Number(f.max);
  if (f.min && Number.isFinite(min)) where.push(gte(listings.price, min));
  if (f.max && Number.isFinite(max)) where.push(lte(listings.price, max));

  const order =
    f.sort === "price_asc" ? [asc(sql`coalesce(${listings.price}, 0)`)] :
    f.sort === "price_desc" ? [desc(sql`coalesce(${listings.price}, 0)`)] :
    [desc(listings.createdAt)];

  return db
    .select(listingCardFields)
    .from(listings)
    .innerJoin(users, eq(users.id, listings.sellerId))
    .where(and(...where, sql`${users.bannedAt} is null`))
    .orderBy(...order, desc(listings.id))
    .limit(limit);
}

export async function listingsBySeller(sellerId: string, statuses: ("available" | "reserved" | "completed")[]) {
  return db
    .select(listingCardFields)
    .from(listings)
    .where(and(eq(listings.sellerId, sellerId), inArray(listings.status, statuses)))
    .orderBy(desc(listings.updatedAt));
}
