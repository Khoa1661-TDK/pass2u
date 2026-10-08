"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, idDocuments } from "@/lib/schema";
import { requireUser } from "@/lib/session";
import { checkImage } from "@/lib/storage";
import { CAMPUSES } from "@/lib/constants";
import type { FormState } from "./auth";

const schema = z.object({
  studentCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}\d{5,7}$/, "Student code looks like SE190123: two letters, then digits."),
  campus: z.enum(CAMPUSES, { message: "Choose your campus." }),
});

export async function submitVerification(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (!u.emailVerifiedAt) redirect("/check-email");
  if (u.verificationStatus === "approved") redirect("/market");

  const fields = { studentCode: String(fd.get("studentCode") ?? ""), campus: String(fd.get("campus") ?? "") };
  const parsed = schema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const file = fd.get("idCard");
  if (!(file instanceof File) || file.size === 0) return { error: "Add a photo of the front of your student ID card.", fields };
  const bad = checkImage(file);
  if (bad) return { error: bad, fields };

  const image = Buffer.from(await file.arrayBuffer());
  await db
    .insert(idDocuments)
    .values({ userId: u.id, image, mime: file.type })
    .onConflictDoUpdate({ target: idDocuments.userId, set: { image, mime: file.type, uploadedAt: new Date(), deleteAfter: null } });
  await db
    .update(users)
    .set({ ...parsed.data, verificationStatus: "pending", rejectionReason: null })
    .where(eq(users.id, u.id));
  redirect("/verify");
}
