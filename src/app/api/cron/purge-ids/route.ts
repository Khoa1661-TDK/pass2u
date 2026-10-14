import { purgeExpiredIds } from "@/lib/purge";

export async function GET(req: Request) {
  // Without a secret set, "Bearer undefined" would pass: fail closed.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  return Response.json({ deleted: await purgeExpiredIds() });
}
