"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, idDocuments, listings, reports } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { ID_RETENTION_DAYS } from "@/lib/constants";

const retention = () => new Date(Date.now() + ID_RETENTION_DAYS * 864e5);

export async function approveStudent(userId: string) {
  await requireAdmin();
  await db.update(users).set({ verificationStatus: "approved", verifiedAt: new Date(), rejectionReason: null }).where(eq(users.id, userId));
  await db.update(idDocuments).set({ deleteAfter: retention() }).where(eq(idDocuments.userId, userId));
  revalidatePath("/admin");
}

export async function rejectStudent(userId: string, fd: FormData) {
  await requireAdmin();
  const reason = String(fd.get("reason") ?? "").trim() || "The ID photo couldn't be verified. Please upload a clearer photo.";
  await db.update(users).set({ verificationStatus: "rejected", rejectionReason: reason.slice(0, 300) }).where(eq(users.id, userId));
  await db.update(idDocuments).set({ deleteAfter: retention() }).where(eq(idDocuments.userId, userId));
  revalidatePath("/admin");
}

export async function setBanned(userId: string, banned: boolean) {
  const me = await requireAdmin();
  if (me.id === userId) return;
  await db.update(users).set({ bannedAt: banned ? new Date() : null }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function removeListing(listingId: string, reportId?: string) {
  await requireAdmin();
  await db.update(listings).set({ status: "removed" }).where(eq(listings.id, listingId));
  if (reportId) await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, reportId));
  revalidatePath("/admin/reports");
  revalidatePath("/market");
}

export async function dismissReport(reportId: string) {
  await requireAdmin();
  await db.update(reports).set({ status: "dismissed" }).where(eq(reports.id, reportId));
  revalidatePath("/admin/reports");
}
