import "server-only";
import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { passwordResets } from "./schema";

/** A live "forgot password" link, or null when it's unknown, used or expired. */
export async function findReset(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [row] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, tokenHash), gt(passwordResets.expiresAt, new Date())));
  return row ?? null;
}
