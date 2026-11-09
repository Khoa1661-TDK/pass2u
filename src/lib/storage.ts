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

/** Blob auth is available either via the legacy read-write token or, for
 * stores connected after the OIDC change, via BLOB_STORE_ID + VERCEL_OIDC_TOKEN. */
const blobConfigured = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/** Public listing photos. Uses Vercel Blob in production, ./.uploads locally. */
export async function uploadListingImage(f: File): Promise<string> {
  const ext = f.type.split("/")[1];
  const name = `listings/${randomUUID()}.${ext}`;
  if (blobConfigured()) {
    const blob = await put(name, f, { access: "public", contentType: f.type });
    return blob.url;
  }
  // No Blob credential at all. Vercel's serverless filesystem is read-only,
  // so the local fallback below would crash with ENOENT — fail with a clear
  // message pointing at the real fix instead.
  if (process.env.VERCEL) {
    throw new Error("Deployment này chưa được nối với Blob store — mở tab Storage của project Vercel và connect store vào Production.");
  }
  // Local fallback (no Blob token): served by app/uploads/[...path]/route.ts
  await mkdir(path.join(LOCAL_DIR, "listings"), { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), Buffer.from(await f.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function deleteListingImages(urls: string[]) {
  const remote = urls.filter((u) => u.startsWith("https://"));
  if (remote.length && blobConfigured()) await del(remote).catch(() => {});
}
