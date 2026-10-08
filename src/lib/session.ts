import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User } from "./schema";

const COOKIE = "pass2u_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function verifyToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export const getUser = cache(async (): Promise<User | null> => {
  const id = await verifyToken((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u || u.bannedAt) return null;
  return u;
});

/** Where a signed-in user should be sent if they can't use the marketplace yet. */
export function gateFor(u: User | null): string | null {
  if (!u) return "/login";
  if (u.role === "admin") return null;
  if (!u.emailVerifiedAt) return "/check-email";
  if (u.verificationStatus !== "approved") return "/verify";
  return null;
}

/** Signed in, email confirmed, and student ID approved (or admin). */
export async function requireApproved() {
  const u = await getUser();
  const to = gateFor(u);
  if (to) redirect(to);
  return u!;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await getUser();
  if (!u || u.role !== "admin") redirect("/");
  return u;
}
