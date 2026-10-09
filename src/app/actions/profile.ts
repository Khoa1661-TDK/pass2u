"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { CAMPUSES } from "@/lib/constants";
import type { FormState } from "./auth";

const schema = z.object({
  displayName: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự.").max(60),
  campus: z.enum(CAMPUSES),
  bio: z.string().trim().max(280),
});

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireApproved();
  const fields = Object.fromEntries(["displayName", "campus", "bio"].map((k) => [k, String(fd.get(k) ?? "")]));
  const p = schema.safeParse(fields);
  if (!p.success) return { error: p.error.issues[0].message, fields };
  await db.update(users).set({ ...p.data, bio: p.data.bio || null }).where(eq(users.id, u.id));
  revalidatePath("/", "layout");
  return { ok: "Đã lưu." };
}
