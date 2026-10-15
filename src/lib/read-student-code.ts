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
async function prepare(img: ImageBitmapSource, cut?: number, turn = 0): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(img);
  const side = turn % 2 === 1;
  const w0 = side ? bmp.height : bmp.width, h0 = side ? bmp.width : bmp.height;
  // Camera frames carry far fewer pixels per letter than a gallery photo, so
  // small images are enlarged and then sharpened below.
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
  // Unsharp mask (5x5 box blur, amount 1.5): enlarging blurs letter edges and
  // camera frames are soft to begin with. On a real card filmed at camera
  // resolution this turned "HOANG ANH BUC" back into "HOÀNG ANH ĐỨC".
  if (scale > 1) {
    const w = c.width, h = c.height, R = 2, N = 2 * R + 1;
    const src = new Float32Array(w * h), tmp = new Float32Array(w * h);
    for (let i = 0; i < src.length; i++) src[i] = d[i * 4];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -R; k <= R; k++) sum += src[y * w + Math.min(w - 1, Math.max(0, x + k))];
      tmp[y * w + x] = sum / N;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -R; k <= R; k++) sum += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      const i = y * w + x;
      const v = Math.max(0, Math.min(255, src[i] + 1.5 * (src[i] - sum / N)));
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    }
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

// One reader for the page: the camera checks frames with it while scanning,
// then the full read reuses it, so the models load once.
type Worker = Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>;
let reader: Promise<Worker> | null = null;
export function getReader(): Promise<Worker> {
  reader ??= import("tesseract.js").then(({ createWorker }) =>
    createWorker("eng+vie", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr/core", langPath: "/ocr/lang" }),
  );
  reader.catch(() => (reader = null));
  return reader;
}

/** One quick pass over a camera frame: the student code, if it reads. */
export async function quickCode(frame: HTMLCanvasElement): Promise<string | null> {
  const worker = await getReader();
  const { text } = (await worker.recognize(await prepare(frame))).data;
  return findStudentCode(text);
}

export async function readCardInfo(img: Blob): Promise<{ code: string | null; name: string | null }> {
  const worker = await getReader();
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
}
