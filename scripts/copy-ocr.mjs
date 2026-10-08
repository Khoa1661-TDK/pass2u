// Self-host the OCR engine and English model under /ocr so the ID scanner
// doesn't depend on a third-party CDN at runtime.
import { cpSync, mkdirSync, readdirSync } from "node:fs";

const out = "public/ocr";
mkdirSync(`${out}/core`, { recursive: true });
mkdirSync(`${out}/lang`, { recursive: true });
cpSync("node_modules/tesseract.js/dist/worker.min.js", `${out}/worker.min.js`);
for (const f of readdirSync("node_modules/tesseract.js-core"))
  if (f.endsWith("lstm.wasm.js")) cpSync(`node_modules/tesseract.js-core/${f}`, `${out}/core/${f}`);
cpSync("node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", `${out}/lang/eng.traineddata.gz`);
console.log("[ocr] copied engine and model to public/ocr");
