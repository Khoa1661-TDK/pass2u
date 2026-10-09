"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, idDocuments } from "@/lib/schema";
import { requireUser } from "@/lib/session";
import { checkImage } from "@/lib/storage";
import { checkCard } from "@/lib/card-check";
import { studentFieldsSchema } from "@/lib/validation";
import type { FormState } from "./auth";

const schema = studentFieldsSchema;

export async function submitVerification(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (!u.emailVerifiedAt) redirect("/check-email");
  if (u.verificationStatus === "approved") redirect("/market");

  const fields = { studentCode: String(fd.get("studentCode") ?? ""), campus: String(fd.get("campus") ?? "") };
  const parsed = schema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const file = fd.get("idCard");
  if (!(file instanceof File) || file.size === 0) return { error: "Thêm ảnh mặt trước thẻ sinh viên của bạn.", fields };
  const bad = checkImage(file);
  if (bad) return { error: bad, fields };

  const image = Buffer.from(await file.arrayBuffer());

  // Read the card here, where the student can't tamper with the result.
  const card = await checkCard(image, u.displayName);
  if (card && !card.ocrLooksFpt && !card.ocrCode)
    return { error: "Đây không giống thẻ sinh viên Đại học FPT. Hãy chụp mặt trước thẻ, đặt phẳng và đủ ánh sáng.", fields };
  if (card?.ocrCode && card.ocrCode !== parsed.data.studentCode)
    return { error: `Thẻ của bạn ghi ${card.ocrCode}, nhưng bạn nhập ${parsed.data.studentCode}. Hãy sửa mã hoặc chụp lại ảnh.`, fields };

  const ocr = card ?? { ocrCode: null, ocrNameMatch: null, ocrLooksFpt: null, ocrText: null };
  await db
    .insert(idDocuments)
    .values({ userId: u.id, image, mime: file.type, ...ocr })
    .onConflictDoUpdate({ target: idDocuments.userId, set: { image, mime: file.type, uploadedAt: new Date(), deleteAfter: null, ...ocr } });
  await db
    .update(users)
    .set({ ...parsed.data, verificationStatus: "pending", rejectionReason: null })
    .where(eq(users.id, u.id));
  redirect("/verify");
}
