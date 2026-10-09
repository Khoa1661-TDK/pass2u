"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, listings, messages, reservations } from "@/lib/schema";
import { requireApproved } from "@/lib/session";

async function ownConversation(id: string, userId: string) {
  const [c] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId))));
  return c ?? null;
}

async function post(conversationId: string, senderId: string, body: string, kind: "text" | "event" = "text") {
  await db.insert(messages).values({ conversationId, senderId, body, kind });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
}

/** Open (or reuse) the buyer's conversation with the seller about a listing. */
export async function contactSeller(listingId: string, fd: FormData) {
  const u = await requireApproved();
  const [l] = await db.select().from(listings).where(eq(listings.id, listingId));
  if (!l || l.sellerId === u.id || l.status === "removed") redirect(`/listings/${listingId}`);
  const [c] = await db
    .insert(conversations)
    .values({ listingId, buyerId: u.id, sellerId: l.sellerId })
    .onConflictDoUpdate({ target: [conversations.listingId, conversations.buyerId], set: { listingId } })
    .returning();
  const body = String(fd.get("body") ?? "").trim();
  if (body) await post(c.id, u.id, body.slice(0, 2000));
  redirect(`/inbox/${c.id}`);
}

export async function sendMessage(conversationId: string, fd: FormData) {
  const u = await requireApproved();
  const c = await ownConversation(conversationId, u.id);
  const body = String(fd.get("body") ?? "").trim();
  if (!c || !body) return;
  await post(c.id, u.id, body.slice(0, 2000));
  revalidatePath(`/inbox/${c.id}`);
}

type Step = "request" | "accept" | "decline" | "complete" | "cancel";

/**
 * Reservation workflow, all inside a conversation:
 * buyer requests → seller accepts (listing reserved) or declines →
 * seller marks completed (listing completed), or either side cancels (listing available again).
 */
export async function reservationStep(conversationId: string, step: Step) {
  const u = await requireApproved();
  const c = await ownConversation(conversationId, u.id);
  if (!c) return;
  const isBuyer = c.buyerId === u.id;
  const [l] = await db.select().from(listings).where(eq(listings.id, c.listingId));
  if (!l) return;
  const [r] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.listingId, c.listingId), eq(reservations.buyerId, c.buyerId), inArray(reservations.status, ["requested", "accepted"])));
  const now = new Date();
  const setR = (status: "accepted" | "declined" | "completed" | "cancelled") =>
    db.update(reservations).set({ status, updatedAt: now }).where(eq(reservations.id, r!.id));
  const setL = (status: "available" | "reserved" | "completed") =>
    db.update(listings).set({ status, updatedAt: now }).where(eq(listings.id, l.id));

  if (step === "request" && isBuyer && !r && l.status === "available") {
    await db.insert(reservations).values({ listingId: l.id, buyerId: c.buyerId, sellerId: c.sellerId });
    await post(c.id, u.id, "đã xin giữ món này", "event");
  } else if (step === "accept" && !isBuyer && r?.status === "requested" && l.status === "available") {
    await setR("accepted");
    await setL("reserved");
    await post(c.id, u.id, "đã chấp nhận giữ", "event");
  } else if (step === "decline" && !isBuyer && r?.status === "requested") {
    await setR("declined");
    await post(c.id, u.id, "đã từ chối yêu cầu giữ", "event");
  } else if (step === "complete" && !isBuyer && r?.status === "accepted") {
    await setR("completed");
    await setL("completed");
    await post(c.id, u.id, "đã đánh dấu giao dịch hoàn tất", "event");
  } else if (step === "cancel" && r) {
    await setR("cancelled");
    if (r.status === "accepted") await setL("available");
    await post(c.id, u.id, "đã hủy giữ", "event");
  }
  revalidatePath(`/inbox/${c.id}`);
  revalidatePath(`/listings/${l.id}`);
}
