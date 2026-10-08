import "server-only";
import { lt } from "drizzle-orm";
import { db } from "./db";
import { idDocuments } from "./schema";

/** Remove ID card photos whose retention window has passed. */
export async function purgeExpiredIds() {
  const gone = await db.delete(idDocuments).where(lt(idDocuments.deleteAfter, new Date())).returning({ id: idDocuments.userId });
  return gone.length;
}
