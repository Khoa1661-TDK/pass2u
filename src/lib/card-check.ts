import "server-only";
import path from "node:path";
import sharp from "sharp";
import { findStudentCode } from "./student-code";

export type CardCheck = { ocrCode: string | null; ocrNameMatch: boolean; ocrLooksFpt: boolean; ocrText: string };

// Strip Vietnamese diacritics so "Nguyễn Văn An" matches "NGUYEN VAN AN".
export const plain = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase().replace(/[^A-Z0-9\s]/g, " ");

// True when two words are within one edit of each other — OCR mangles single
// letters on ID cards ("DUC" -> "BUC", "FPT" -> "[PT").
const near = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let dist = 0, i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dist > 1) return false;
    if (a.length === b.length) { i++; j++; }
    else if (a.length < b.length) j++;
    else i++;
  }
  return dist + (a.length - i) + (b.length - j) <= 1;
};

// Reads the card on the server so the result can't be faked from the browser.
// Signals for the admin, not proof: a convincing fake card can still pass.
// Two OCR passes: the whole card (name, code, bottom band) and a crop of the
// header band — the orange "TRƯỜNG ĐẠI HỌC FPT" on the map background only
// OCRs cleanly via the green channel on its own crop.
export async function checkCard(image: Buffer, displayName: string): Promise<CardCheck | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    langPath: path.join(process.cwd(), "node_modules/@tesseract.js-data/eng/4.0.0_best_int"),
    cachePath: "/tmp",
  });
  try {
    const run = (async () => {
      const full = await sharp(image).resize(1500).grayscale().png().toBuffer();
      let text = (await worker.recognize(full)).data.text;
      const { width, height } = await sharp(image).metadata();
      if (width && height) {
        const band = await sharp(image)
          // Band sized for a card filling the frame; badge holders push the
          // printed header lower, so the window starts a fifth of the way in.
          .extract({
            left: Math.round(width * 0.1),
            top: Math.round(height * 0.15),
            width: Math.round(width * 0.8),
            height: Math.round(height * 0.18),
          })
          .resize(1500)
          .extractChannel(1)
          .png()
          .toBuffer();
        text += "\n" + (await worker.recognize(band)).data.text;
      }
      return text;
    })();
    const text = await Promise.race([run, new Promise<null>((r) => setTimeout(() => r(null), 20_000))]);
    if (text == null) return null;
    const flat = plain(text);
    const words = [...new Set(flat.split(/\s+/))];
    const nameParts = plain(displayName).split(/\s+/).filter((w) => w.length > 1);
    return {
      ocrCode: findStudentCode(text),
      ocrNameMatch: nameParts.length > 0 && nameParts.every((p) => words.some((w) => w === p || (p.length >= 3 && near(w, p)))),
      ocrLooksFpt: /\bFPT\b|\bFPT\s?UNIVERSITY\b|DAI HOC FPT/.test(flat) || words.some((w) => w.length === 3 && near(w, "FPT")),
      ocrText: text.slice(0, 2000),
    };
  } catch {
    return null;
  } finally {
    await worker.terminate();
  }
}
