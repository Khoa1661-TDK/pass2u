"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, listingImages, reports } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { checkImage, uploadListingImage, deleteListingImages } from "@/lib/storage";
import { CATEGORIES, CONDITIONS, TYPES } from "@/lib/constants";
import type { FormState } from "./auth";

const MAX_IMAGES = 6;
const vals = <T extends readonly { value: string }[]>(l: T) => l.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

const listingSchema = z
  .object({
    title: z.string().trim().min(3, "Give the item a title (at least 3 characters).").max(80, "Keep the title under 80 characters."),
    description: z.string().trim().min(10, "Describe the item in at least 10 characters.").max(2000),
    category: z.enum(vals(CATEGORIES), { message: "Choose a category." }),
    condition: z.enum(vals(CONDITIONS), { message: "Choose the item's condition." }),
    type: z.enum(vals(TYPES), { message: "Choose sell, exchange, or free." }),
    price: z.string().trim().optional(),
    exchangeFor: z.string().trim().max(200).optional(),
  })
  .transform((v, ctx) => {
    let price: number | null = null;
    if (v.type === "sell") {
      const n = Number((v.price ?? "").replace(/[.,\s₫]/g, ""));
      if (!Number.isInteger(n) || n < 1000 || n > 100_000_000) {
        ctx.addIssue({ code: "custom", message: "Enter a price between 1.000 ₫ and 100.000.000 ₫." });
        return z.NEVER;
      }
      price = n;
    }
    if (v.type === "exchange" && !v.exchangeFor) {
      ctx.addIssue({ code: "custom", message: "Say what you'd like in exchange." });
      return z.NEVER;
    }
    return { ...v, price, exchangeFor: v.type === "exchange" ? v.exchangeFor! : null };
  });

function readFields(fd: FormData) {
  const keys = ["title", "description", "category", "condition", "type", "price", "exchangeFor"];
  return Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));
}

function newFiles(fd: FormData) {
  return fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
}

export async function createListing(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireApproved();
  const fields = readFields(fd);
  const parsed = listingSchema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const files = newFiles(fd);
  if (files.length === 0) return { error: "Add at least one photo so buyers can see the item.", fields };
  if (files.length > MAX_IMAGES) return { error: `You can add up to ${MAX_IMAGES} photos.`, fields };
  for (const f of files) {
    const bad = checkImage(f);
    if (bad) return { error: bad, fields };
  }

  const urls = await Promise.all(files.map(uploadListingImage));
  const [l] = await db.insert(listings).values({ ...parsed.data, sellerId: u.id, campus: u.campus }).returning();
  await db.insert(listingImages).values(urls.map((url, i) => ({ listingId: l.id, url, position: i })));
  revalidatePath("/market");
  redirect(`/listings/${l.id}`);
}

export async function updateListing(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const u = await requireApproved();
  const [l] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, u.id)));
  if (!l || l.status === "removed") return { error: "This listing can't be edited." };

  const fields = readFields(fd);
  const parsed = listingSchema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const keep = fd.getAll("keepImage").map(String);
  const files = newFiles(fd);
  const existing = await db.select().from(listingImages).where(eq(listingImages.listingId, id));
  const kept = existing.filter((i) => keep.includes(i.id));
  if (kept.length + files.length === 0) return { error: "Keep or add at least one photo.", fields };
  if (kept.length + files.length > MAX_IMAGES) return { error: `You can have up to ${MAX_IMAGES} photos.`, fields };
  for (const f of files) {
    const bad = checkImage(f);
    if (bad) return { error: bad, fields };
  }

  const dropped = existing.filter((i) => !keep.includes(i.id));
  if (dropped.length) {
    await db.delete(listingImages).where(inArray(listingImages.id, dropped.map((d) => d.id)));
    await deleteListingImages(dropped.map((d) => d.url));
  }
  const urls = await Promise.all(files.map(uploadListingImage));
  if (urls.length)
    await db.insert(listingImages).values(urls.map((url, i) => ({ listingId: id, url, position: kept.length + i })));

  await db.update(listings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(listings.id, id));
  revalidatePath(`/listings/${id}`);
  redirect(`/listings/${id}`);
}

export async function deleteListing(id: string) {
  const u = await requireApproved();
  const [l] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, u.id)));
  if (!l) return;
  const imgs = await db.select().from(listingImages).where(eq(listingImages.listingId, id));
  await db.delete(listings).where(eq(listings.id, id));
  await deleteListingImages(imgs.map((i) => i.url));
  revalidatePath("/market");
  redirect("/me");
}

export async function setListingStatus(id: string, status: "available" | "reserved" | "completed") {
  const u = await requireApproved();
  await db
    .update(listings)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(listings.id, id), eq(listings.sellerId, u.id), inArray(listings.status, ["available", "reserved", "completed"])));
  revalidatePath(`/listings/${id}`);
  revalidatePath("/me");
}

export async function reportListing(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const u = await requireApproved();
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Tell us briefly what's wrong (at least 5 characters)." };
  await db.insert(reports).values({ listingId: id, reporterId: u.id, reason: reason.slice(0, 500) });
  return { ok: "Thanks. An admin will review this listing." };
}
