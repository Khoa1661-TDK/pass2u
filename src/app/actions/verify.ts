"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireUser } from "@/lib/session";
import { codeTaken, CODE_TAKEN } from "@/lib/code-taken";
import { studentFieldsSchema } from "@/lib/validation";
import type { FormState } from "./auth";

// Resubmit the student code after a rejection. No card photo is needed.
export async function submitVerification(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (u.verificationStatus === "approved") redirect("/market");

  const fields = { studentCode: String(fd.get("studentCode") ?? ""), campus: String(fd.get("campus") ?? "") };
  const parsed = studentFieldsSchema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  if (await codeTaken(parsed.data.studentCode, u.id)) return { error: CODE_TAKEN, fields };

  await db
    .update(users)
    .set({ ...parsed.data, verificationStatus: "pending", rejectionReason: null })
    .where(eq(users.id, u.id));
  redirect("/verify");
}
