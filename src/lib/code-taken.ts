import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";

// One student card, one account: a code already held by a pending or
// approved account can't be used again. A rejected account releases it.
export async function codeTaken(studentCode: string, exceptUserId?: string) {
  const [hit] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(
      eq(users.studentCode, studentCode),
      inArray(users.verificationStatus, ["pending", "approved"]),
      ...(exceptUserId ? [ne(users.id, exceptUserId)] : []),
    ))
    .limit(1);
  return !!hit;
}

export const CODE_TAKEN = "Mã sinh viên này đã được dùng cho một tài khoản khác. Mỗi thẻ chỉ tạo được một tài khoản. Nếu đây là thẻ của bạn, hãy liên hệ đội ngũ PASS2U.";
