import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { idDocuments } from "@/lib/schema";
import { getUser } from "@/lib/session";

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const me = await getUser();
  if (!me || me.role !== "admin") return new Response("Forbidden", { status: 403 });
  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(userId)) return new Response("Not found", { status: 404 });
  const [doc] = await db.select().from(idDocuments).where(eq(idDocuments.userId, userId));
  if (!doc) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(doc.image), {
    headers: { "Content-Type": doc.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
