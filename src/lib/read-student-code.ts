"use client";

// Reads the FPT student code (e.g. SE190123) off a card photo, in the browser.
// This only pre-fills the form: an admin still checks every card by eye.

const CODE = /\b([A-Z]{2})\s?(\d{6,7})\b/;

// OCR often confuses letters and digits in the number part.
const DIGITISE: Record<string, string> = { O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", S: "5", B: "8", G: "6" };

export function findStudentCode(text: string): string | null {
  const lines = text.toUpperCase().split(/\n/);
  for (const raw of lines) {
    const line = raw.replace(/([A-Z]{2})\s*([0-9OQDILZSBG]{6,7})/g, (_, p: string, n: string) => p + n.replace(/[OQDILZSBG]/g, (c) => DIGITISE[c]));
    const m = line.match(CODE);
    if (m) return m[1] + m[2];
  }
  return null;
}

// Grayscale, upscale and boost contrast so small card text reads better.
async function prepare(img: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(img);
  const scale = Math.min(2, 2000 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.6)";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

export async function readStudentCode(img: Blob): Promise<string | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
  });
  try {
    await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :" });
    const { data } = await worker.recognize(await prepare(img));
    return findStudentCode(data.text);
  } finally {
    await worker.terminate();
  }
}
