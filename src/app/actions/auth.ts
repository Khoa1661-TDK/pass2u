"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResets } from "@/lib/schema";
import { codeTaken, CODE_TAKEN } from "@/lib/code-taken";
import { createSession, destroySession, getUser, gateFor } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { findReset } from "@/lib/password-reset";
import { newPasswordSchema, setPassword } from "@/lib/set-password";
import { studentFieldsSchema, identityFieldsSchema } from "@/lib/validation";

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> } | undefined;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Nhập tên của bạn (ít nhất 2 ký tự).").max(60),
  email: z.string().trim().toLowerCase().email("Nhập email hợp lệ."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").max(128),
  studentCode: studentFieldsSchema.shape.studentCode,
  campus: studentFieldsSchema.shape.campus,
  ...identityFieldsSchema.shape,
});

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const parsed = signupSchema.safeParse(raw);
  const fields = {
    displayName: raw.displayName ?? "",
    email: raw.email ?? "",
    studentCode: raw.studentCode ?? "",
    campus: raw.campus ?? "",
    phone: raw.phone ?? "",
    birthDate: raw.birthDate ?? "",
    residence: raw.residence ?? "",
    cohort: raw.cohort ?? "",
    major: raw.major ?? "",
  };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  const { displayName, email, password, studentCode, campus, phone, birthDate, residence, cohort, major } = parsed.data;

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (exists) return { error: "Email này đã có tài khoản. Hãy đăng nhập.", fields };
  if (await codeTaken(studentCode)) return { error: CODE_TAKEN, fields };

  // No card photo: an admin checks the student code and details before approving.
  const [u] = await db
    .insert(users)
    .values({ email, displayName, passwordHash: await bcrypt.hash(password, 10), studentCode, campus, phone, birthDate, residence, cohort, major, verificationStatus: "pending" })
    .returning();
  // No email confirmation step: go straight to the approval wait.
  await createSession(u.id);
  redirect("/verify");
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
  // Same-site paths only: "//host", "/\\host" and "/\t/host" all resolve to another site.
  redirect(gateFor(u) ?? (/^\/(?![\/\\])[^\\\s]*$/.test(next) ? next : "/market"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// Same reply whether or not the email has an account, so the form can't be
// used to find out who is signed up.
const RESET_SENT = "Nếu email này có tài khoản PASS2U, chúng tôi đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra hộp thư và thư mục spam.";

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Nhập email hợp lệ.", fields: { email } };
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (u && !u.bannedAt) {
    const token = randomBytes(32).toString("base64url");
    // Only the newest link works.
    await db.delete(passwordResets).where(eq(passwordResets.userId, u.id));
    await db.insert(passwordResets).values({ tokenHash: hash(token), userId: u.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60) });
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset?token=${token}`;
    await sendEmail(
      u.email,
      "Đặt lại mật khẩu PASS2U",
      `<p>Chào ${u.displayName.replace(/[<>&]/g, "")},</p><p>Có người (hy vọng là bạn) vừa yêu cầu đặt lại mật khẩu PASS2U:</p><p><a href="${link}">Đặt mật khẩu mới</a></p><p>Liên kết này hết hạn sau 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
      `Liên kết đặt lại mật khẩu: ${link}`,
    );
  }
  return { ok: RESET_SENT, fields: { email } };
}



export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const p = newPasswordSchema.safeParse(String(fd.get("password") ?? ""));
  if (!p.success) return { error: p.error.issues[0].message };
  const row = await findReset(token);
  if (!row) return { error: "Liên kết này đã hết hạn hoặc đã được dùng. Hãy yêu cầu liên kết mới." };
  const [u] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!u || u.bannedAt) return { error: "Tài khoản này đã bị khóa. Hãy liên hệ đội ngũ PASS2U." };
  await setPassword(u.id, p.data);
  await createSession(u.id);
  redirect(gateFor(u) ?? "/market");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) redirect("/login");
  const current = String(fd.get("currentPassword") ?? "");
  if (!(await bcrypt.compare(current, u.passwordHash))) return { error: "Mật khẩu hiện tại không đúng." };
  const p = newPasswordSchema.safeParse(String(fd.get("newPassword") ?? ""));
  if (!p.success) return { error: p.error.issues[0].message };
  await setPassword(u.id, p.data);
  // Keep this device signed in; every other session is now signed out.
  await createSession(u.id);
  return { ok: "Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất." };
}
