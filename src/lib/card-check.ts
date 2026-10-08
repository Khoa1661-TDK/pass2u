import "server-only";
import path from "node:path";
import { findStudentCode } from "./student-code";

export type CardCheck = { ocrCode: string | null; ocrNameMatch: boolean; ocrLooksFpt: boolean; ocrText: string };

// Strip Vietnamese diacritics so "Nguyễn Văn An" matches "NGUYEN VAN AN".
export const plain = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase().replace(/[^A-Z0-9\s]/g, " ");

// Reads the card on the server so the result can't be faked from the browser.
// Signals for the admin, not proof: a convincing fake card can still pass.
export async function checkCard(image: Buffer, displayName: string): Promise<CardCheck | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    langPath: path.join(process.cwd(), "node_modules/@tesseract.js-data/eng/4.0.0_best_int"),
    cachePath: "/tmp",
  });
  try {
    const run = worker.recognize(image).then((r) => r.data.text);
    const text = await Promise.race([run, new Promise<null>((r) => setTimeout(() => r(null), 20_000))]);
    if (text == null) return null;
    const flat = plain(text);
    const words = new Set(flat.split(/\s+/));
    const nameParts = plain(displayName).split(/\s+/).filter((w) => w.length > 1);
    return {
      ocrCode: findStudentCode(text),
      ocrNameMatch: nameParts.length > 0 && nameParts.every((w) => words.has(w)),
      ocrLooksFpt: /\bFPT\b|\bFPT\s?UNIVERSITY\b|DAI HOC FPT/.test(flat),
      ocrText: text.slice(0, 2000),
    };
  } catch {
    return null;
  } finally {
    await worker.terminate();
  }
}
