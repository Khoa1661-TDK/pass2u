import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_DIR } from "@/lib/storage";

// Serves listing photos saved locally when Vercel Blob isn't configured (development).
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  if (!/^listings\/[0-9a-f-]+\.(jpeg|png|webp)$/.test(rel)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(LOCAL_DIR, rel));
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": `image/${rel.split(".").pop()}`, "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
