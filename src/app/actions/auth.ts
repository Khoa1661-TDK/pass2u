"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, emailTokens } from "@/lib/schema";
import { createSession, destroySession, getUser, gateFor } from "@/lib/session";
import { sendEmail } from "@/lib/email";

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> } | undefined;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

async function sendConfirmation(userId: string, email: string, name: string) {
  const token = randomBytes(32).toString("base64url");
  await db.delete(emailTokens).where(eq(emailTokens.userId, userId));
  await db.insert(emailTokens).values({
    tokenHash: hash(token),
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/confirm?token=${token}`;
  await sendEmail(
    email,
    "Xác nhận email PASS2U của bạn",
    `<p>Chào ${name.replace(/[<>&]/g, "")},</p><p>Hãy xác nhận email để tiếp tục thiết lập PASS2U:</p><p><a href="${link}">Xác nhận email</a></p><p>Liên kết này hết hạn sau 24 giờ.</p>`,
    `Liên kết xác nhận: ${link}`,
  );
}

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Nhập tên của bạn (ít nhất 2 ký tự).").max(60),
  email: z.string().trim().toLowerCase().email("Nhập email hợp lệ."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").max(128),
});

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const parsed = signupSchema.safeParse(raw);
  const fields = { displayName: raw.displayName ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  const { displayName, email, password } = parsed.data;

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (exists) return { error: "Email này đã có tài khoản. Hãy đăng nhập.", fields };

  const [u] = await db
    .insert(users)
    .values({ email, displayName, passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  await sendConfirmation(u.id, u.email, u.displayName);
  await createSession(u.id);
  redirect("/check-email");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u || !(await bcrypt.compare(password, u.passwordHash)))
    return { error: "Email hoặc mật khẩu không đúng.", fields: { email } };
  if (u.bannedAt) return { error: "Tài khoản này đã bị khóa. Hãy liên hệ đội ngũ PASS2U.", fields: { email } };
  await createSession(u.id);
  const next = String(fd.get("next") ?? "");
  redirect(gateFor(u) ?? (next.startsWith("/") && !next.startsWith("//") ? next : "/market"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function resendConfirmation(): Promise<FormState> {
  const u = await getUser();
  if (!u) redirect("/login");
  if (u.emailVerifiedAt) redirect("/verify");
  await sendConfirmation(u.id, u.email, u.displayName);
  return { ok: "Đã gửi lại liên kết. Hãy kiểm tra hộp thư và thư mục spam." };
}

export async function confirmEmail(token: string) {
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, hash(token)), gt(emailTokens.expiresAt, new Date())));
  if (!row) return false;
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
  await db.delete(emailTokens).where(eq(emailTokens.userId, row.userId));
  return true;
}
