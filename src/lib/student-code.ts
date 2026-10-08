// Finds an FPT student code (two letters + 6-7 digits) in OCR text.
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
