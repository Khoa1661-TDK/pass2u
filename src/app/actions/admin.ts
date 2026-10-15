"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { LISTINGS_TAG } from "@/lib/queries";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, idDocuments, listings, reports } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { ID_RETENTION_DAYS } from "@/lib/constants";
import { newPasswordSchema, setPassword } from "@/lib/set-password";
import type { FormState } from "@/app/actions/auth";

const retention = () => new Date(Date.now() + ID_RETENTION_DAYS * 864e5);

export async function approveStudent(userId: string) {
  await requireAdmin();
  await db.update(users).set({ verificationStatus: "approved", verifiedAt: new Date(), rejectionReason: null }).where(eq(users.id, userId));
  // An approved card stays on the account; only rejected photos expire.
  await db.update(idDocuments).set({ deleteAfter: null }).where(eq(idDocuments.userId, userId));
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
  revalidateTag(LISTINGS_TAG);
  revalidatePath("/admin/users");
}

export async function removeListing(listingId: string, reportId?: string) {
  await requireAdmin();
  await db.update(listings).set({ status: "removed" }).where(eq(listings.id, listingId));
  if (reportId) await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, reportId));
  revalidateTag(LISTINGS_TAG);
  revalidatePath("/admin/reports");
  revalidatePath("/market");
}

export async function dismissReport(reportId: string) {
  await requireAdmin();
  await db.update(reports).set({ status: "dismissed" }).where(eq(reports.id, reportId));
  revalidatePath("/admin/reports");
}

// Admins can't change their own role or reset their own password here, so
// nobody locks themselves out; they use Cài đặt for their own password.
export async function setAdmin(userId: string, makeAdmin: boolean) {
  const me = await requireAdmin();
  if (me.id === userId) return;
  await db.update(users).set(makeAdmin ? { role: "admin", bannedAt: null } : { role: "student" }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function adminSetPassword(userId: string, _: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  if (me.id === userId) return { error: "Đổi mật khẩu của bạn trong Cài đặt." };
  const p = newPasswordSchema.safeParse(String(fd.get("password") ?? ""));
  if (!p.success) return { error: p.error.issues[0].message };
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!u) return { error: "Không tìm thấy tài khoản." };
  await setPassword(userId, p.data);
  return { ok: "Đã đặt mật khẩu mới. Tài khoản này đã bị đăng xuất khỏi mọi thiết bị." };
}
