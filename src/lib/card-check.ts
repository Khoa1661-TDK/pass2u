import "server-only";
import path from "node:path";
import sharp from "sharp";
import { findStudentCode } from "./student-code";
import { namesMatch, near, plain } from "./name-match";

export type CardCheck = { ocrCode: string | null; ocrNameMatch: boolean; ocrLooksFpt: boolean; ocrText: string };

// Reads the card on the server so the result can't be faked from the browser.
// Signals for the admin, not proof: a convincing fake card can still pass.
// Two OCR passes: the whole card (name, code, bottom band) and a crop of the
// header band — the orange "TRƯỜNG ĐẠI HỌC FPT" on the map background only
// OCRs cleanly via the green channel on its own crop.
// eng+vie reads Vietnamese names with diacritics intact ("NGUYỄN HOÀNG ANH
// ĐỨC"); the traineddata lives in public/ocr/lang, the same files the browser
// scan downloads.
export async function checkCard(image: Buffer, displayName: string): Promise<CardCheck | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+vie", 1, {
    langPath: path.join(process.cwd(), "public/ocr/lang"),
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
    const text = await Promise.race([run, new Promise<null>((r) => setTimeout(() => r(null), 30_000))]);
    if (text == null) return null;
    const flat = plain(text);
    const words = [...new Set(flat.split(/\s+/))];
    return {
      ocrCode: findStudentCode(text),
      ocrNameMatch: namesMatch(displayName, text),
      ocrLooksFpt: /\bFPT\b|\bFPT\s?UNIVERSITY\b|DAI HOC FPT/.test(flat) || words.some((w) => w.length === 3 && near(w, "FPT")),
      ocrText: text.slice(0, 2000),
    };
  } catch {
    return null;
  } finally {
    await worker.terminate();
  }
}
