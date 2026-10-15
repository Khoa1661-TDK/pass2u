import "server-only";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, passwordResets } from "./schema";

export const newPasswordSchema = z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").max(128);

/** Sets a new password and signs the account out everywhere else. */
export async function setPassword(userId: string, password: string) {
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10), passwordChangedAt: new Date() }).where(eq(users.id, userId));
  await db.delete(passwordResets).where(eq(passwordResets.userId, userId));
}
