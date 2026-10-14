"use client";

import { pickCode, pickName } from "./card-vote";
import { findStudentCode } from "./student-code";

// Reads a student code (e.g. SE190123) and the cardholder name off a card
// photo, in the browser. This only pre-fills the form: an admin still checks
// every card by eye. eng+vie so Vietnamese names keep their diacritics; the
// traineddata is served from public/ocr/lang.

// Grayscale and upscale so small card text reads better. With `cut`, also
// stretch contrast and go black-and-white at that level, which drops the
// light-grey world map printed behind the name and code.
// `turn` rotates by quarter turns clockwise, for a card held sideways.
async function prepare(img: Blob, cut?: number, turn = 0): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(img);
  const side = turn % 2 === 1;
  const w0 = side ? bmp.height : bmp.width, h0 = side ? bmp.width : bmp.height;
  const scale = Math.min(2, 2000 / w0);
  const c = document.createElement("canvas");
  c.width = Math.round(w0 * scale);
  c.height = Math.round(h0 * scale);
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((turn * Math.PI) / 2);
  const dw = Math.round(bmp.width * scale), dh = Math.round(bmp.height * scale);
  ctx.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Grayscale by hand: iOS Safari ignores ctx.filter, which left the photo in
  // colour and the cut below reading only the red channel.
  const px = ctx.getImageData(0, 0, c.width, c.height);
  const d = px.data;
  let lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 4) {
    const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = v;
    lo = Math.min(lo, v); hi = Math.max(hi, v);
  }
  if (cut != null) {
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < d.length; i += 4) {
      const v = ((d[i] - lo) * 255) / span >= cut ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
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
    // The camera often catches a portrait card sideways: find the turn at
    // which the student code reads, then do the black-and-white passes there.
    // Upside-down text also yields a "code", so compare the reader's own
    // confidence across turns rather than taking the first hit.
    let turn = 0, first = "", best = -1;
    for (const t of [0, 1, 3, 2]) {
      const { text, confidence } = (await worker.recognize(await prepare(img, undefined, t))).data;
      const score = confidence + (findStudentCode(text) ? 100 : 0);
      if (score > best) { best = score; turn = t; first = text; }
      if (t === 0 && score > 160) break;
    }
    const texts = [first];
    for (const cut of [120, 140]) texts.push((await worker.recognize(await prepare(img, cut, turn))).data.text);
    return { code: pickCode(texts), name: pickName(texts) };
  } finally {
    await worker.terminate();
  }
}
