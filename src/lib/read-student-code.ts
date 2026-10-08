"use client";

import { findStudentCode } from "./student-code";

// Reads the FPT student code (e.g. SE190123) off a card photo, in the browser.
// This only pre-fills the form: an admin still checks every card by eye.

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
