// Name matching helpers shared by the server card check and the browser scan.

// Strip Vietnamese diacritics so "Nguyễn Văn An" matches "NGUYEN VAN AN".
export const plain = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase().replace(/[^A-Z0-9\s]/g, " ");

// True when two words are within one edit of each other — OCR mangles single
// letters on ID cards ("DUC" -> "BUC", "FPT" -> "[PT").
export const near = (a: string, b: string): boolean => {
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

// Every word of `name` matches some word of `text` (order-insensitive).
export function namesMatch(name: string, text: string): boolean {
  const words = [...new Set(plain(text).split(/\s+/))];
  const parts = plain(name).split(/\s+/).filter((w) => w.length > 1);
  return parts.length > 0 && parts.every((p) => words.some((w) => w === p || (p.length >= 3 && near(w, p))));
}
