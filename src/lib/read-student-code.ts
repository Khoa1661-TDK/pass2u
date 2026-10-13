"use client";

import { pickCode, pickName } from "./card-vote";

// Reads a student code (e.g. SE190123) and the cardholder name off a card
// photo, in the browser. This only pre-fills the form: an admin still checks
// every card by eye. eng+vie so Vietnamese names keep their diacritics; the
// traineddata is served from public/ocr/lang.

// Grayscale and upscale so small card text reads better. With `cut`, also
// stretch contrast and go black-and-white at that level, which drops the
// light-grey world map printed behind the name and code.
async function prepare(img: Blob, cut?: number): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(img);
  const scale = Math.min(2, 2000 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.filter = "grayscale(1)";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  if (cut == null) return c;
  const px = ctx.getImageData(0, 0, c.width, c.height);
  const d = px.data;
  let lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 4) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = ((d[i] - lo) * 255) / span >= cut ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(px, 0, 0);
  return c;
}

export async function readCardInfo(img: Blob): Promise<{ code: string | null; name: string | null }> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+vie", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
  });
  try {
    // Three reads, then vote: one pass alone flips digits or garbles the
    // name on real photos far more often than all three agree on a mistake.
    const texts: string[] = [];
    for (const cut of [undefined, 120, 140]) texts.push((await worker.recognize(await prepare(img, cut))).data.text);
    return { code: pickCode(texts), name: pickName(texts) };
  } finally {
    await worker.terminate();
  }
}
