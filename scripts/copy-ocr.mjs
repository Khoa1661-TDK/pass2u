// Self-host the OCR engine and the English + Vietnamese models under /ocr so
// the ID scanner doesn't depend on a third-party CDN at runtime. The same
// lang folder is read directly by the server-side card check.
import { cpSync, mkdirSync, readdirSync } from "node:fs";

const out = "public/ocr";
mkdirSync(`${out}/core`, { recursive: true });
mkdirSync(`${out}/lang`, { recursive: true });
cpSync("node_modules/tesseract.js/dist/worker.min.js", `${out}/worker.min.js`);
for (const f of readdirSync("node_modules/tesseract.js-core"))
  if (f.endsWith("lstm.wasm.js")) cpSync(`node_modules/tesseract.js-core/${f}`, `${out}/core/${f}`);
cpSync("node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", `${out}/lang/eng.traineddata.gz`);
cpSync("node_modules/@tesseract.js-data/vie/4.0.0_best_int/vie.traineddata.gz", `${out}/lang/vie.traineddata.gz`);
console.log("[ocr] copied engine and models to public/ocr");
