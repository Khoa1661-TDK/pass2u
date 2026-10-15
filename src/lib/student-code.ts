// Finds an FPT student code in OCR text, e.g. SE190123 or HE170456.
// The first letter is the campus (H Hà Nội, S HCM, D Đà Nẵng, C Cần Thơ,
// Q Quy Nhơn), the second the school (E engineering, S business, A arts).
// Real phone photos come back noisy, so letters and digits that OCR mixes
// up are repaired before matching.

const TO_DIGIT: Record<string, string> = { O: "0", Q: "0", D: "0", U: "0", I: "1", L: "1", T: "1", Z: "2", S: "5", B: "8", G: "6" };
const TO_LETTER: Record<string, string> = { "5": "S", "0": "D", "8": "S", "2": "Z", "1": "I" };

const CAMPUS = "HSDCQ";
const SCHOOL = "EAS";

// Two code-ish characters, optional separator, then 6-7 digit-ish characters.
const CANDIDATE = /([A-Z0-9]{2})[\s.\-:]?([0-9OQDUILTZSBG]{6,7})(?![0-9])/g;

export function findStudentCode(text: string): string | null {
  const flat = text.toUpperCase().replace(/[^A-Z0-9\n.\-:\s]/g, " ");
  // Small camera text often reads with a gap inside the digits ("DS210 580").
  const joined = flat.replace(/(\d) (?=\d)/g, "$1");
  let best: { code: string; score: number } | null = null;
  for (const m of [...flat.matchAll(CANDIDATE), ...joined.matchAll(CANDIDATE)]) {
    const prefix = m[1].split("").map((c) => (/[0-9]/.test(c) ? TO_LETTER[c] ?? c : c)).join("");
    if (!/^[A-Z]{2}$/.test(prefix)) continue;
    const digits = m[2].replace(/[^0-9]/g, (c) => TO_DIGIT[c] ?? c);
    if (!/^\d{6,7}$/.test(digits)) continue;
    // Prefer real FPT prefixes, codes that needed no repair, and 6 digits.
    let score = 0;
    if (CAMPUS.includes(prefix[0]) && SCHOOL.includes(prefix[1])) score += 4;
    if (prefix === m[1]) score += 1;
    if (digits === m[2]) score += 2;
    if (digits.length === 6) score += 1;
    if (!best || score > best.score) best = { code: prefix + digits, score };
  }
  // Without a real campus + school prefix it's a misread, not a code.
  return best && best.score >= 4 && CAMPUS.includes(best.code[0]) && SCHOOL.includes(best.code[1]) ? best.code : null;
}

