import { findStudentCode } from "./student-code";
import { plain } from "./name-match";

// Finds the cardholder's name line in raw OCR text. On FPT cards the name is
// printed in caps just above the student code, so the search starts there.

// Words that appear on every card — never part of a name.
const BOILER = new Set([
  "STUDENT", "ID", "CARD", "MSSV", "TRUONG", "DAI", "HOC", "FPT", "UNIVERSITY",
  "EDUCATION", "VALID", "TILL", "CODE", "NAME", "THE", "A", "I",
]);

function looksLikeName(line: string): string | null {
  if (findStudentCode(line)) return null;
  const tokens = line.split(/\s+/).filter(Boolean);
  const words = tokens.filter((w) => /[A-Za-zÀ-ỹ]/.test(w));
  if (words.length < 2 || words.length > 6) return null;
  let letters = 0, total = 0;
  for (const w of words) {
    const clean = w.replace(/[^A-Za-zÀ-ỹ]/g, "");
    if (clean.length < 2) return null;
    if (BOILER.has(plain(clean))) return null;
    letters += clean.length;
    total += w.length;
  }
  if (letters / total < 0.8) return null;
  return words.join(" ");
}

export function findCardName(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const codeIdx = lines.findIndex((l) => findStudentCode(l));
  if (codeIdx > 0) {
    for (const line of lines.slice(Math.max(0, codeIdx - 2), codeIdx).reverse()) {
      const name = looksLikeName(line);
      if (name) return name;
    }
  }
  for (const line of lines) {
    const name = looksLikeName(line);
    if (name) return name;
  }
  return null;
}

// "NGUYEN HOANG ANH DUC" -> "Nguyen Hoang Anh Duc" — cards print names in caps.
export const titleCase = (s: string) =>
  s.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
