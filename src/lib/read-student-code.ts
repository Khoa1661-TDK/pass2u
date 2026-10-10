"use client";

import { findCardName } from "./card-name";
import { findStudentCode } from "./student-code";

// Reads a student code (e.g. SE190123) and the cardholder name off a card
// photo, in the browser. This only pre-fills the form: an admin still checks
// every card by eye. eng+vie so Vietnamese names keep their diacritics; the
// traineddata is served from public/ocr/lang.

// Grayscale and upscale so small card text reads better.
async function prepare(img: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(img);
  const scale = Math.min(2, 2000 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.filter = "grayscale(1)";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
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
    const { data } = await worker.recognize(await prepare(img));
    return { code: findStudentCode(data.text), name: findCardName(data.text) };
  } finally {
    await worker.terminate();
  }
}
