import "server-only";
import { put, del } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const LOCAL_DIR = path.join(process.cwd(), ".uploads");

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function checkImage(f: File) {
  if (!ALLOWED.includes(f.type)) return "Ảnh phải ở định dạng JPG, PNG hoặc WebP.";
  if (f.size > MAX_IMAGE_BYTES) return "Mỗi ảnh phải nhỏ hơn 5 MB.";
  return null;
}

/** Public listing photos. Uses Vercel Blob in production, ./.uploads locally. */
export async function uploadListingImage(f: File): Promise<string> {
  const ext = f.type.split("/")[1];
  const name = `listings/${randomUUID()}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, f, { access: "public", contentType: f.type });
    return blob.url;
  }
  // Local fallback (no Blob token): served by app/uploads/[...path]/route.ts
  await mkdir(path.join(LOCAL_DIR, "listings"), { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), Buffer.from(await f.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function deleteListingImages(urls: string[]) {
  const remote = urls.filter((u) => u.startsWith("https://"));
  if (remote.length && process.env.BLOB_READ_WRITE_TOKEN) await del(remote).catch(() => {});
}
