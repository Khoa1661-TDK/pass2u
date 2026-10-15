import { findStudentCode } from "./student-code";
import { findCardName } from "./card-name";
import { plain, near } from "./name-match";

// A single OCR pass over a real card photo is noisy: the world-map print
// behind the text and glare flip a digit or garble the name on some passes
// but not others. Reading the card a few ways and voting is far steadier.

export function pickCode(texts: string[]): string | null {
  const counts = new Map<string, number>();
  for (const t of texts) {
    const c = findStudentCode(t);
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: string | null = null, n = 0;
  for (const [c, k] of counts) if (k > n) { best = c; n = k; }
  return best;
}

// Shape of a Vietnamese syllable without tone marks: a real initial, vowels,
// then an allowed ending. OCR junk at the edge of a name ("ÑR", "IR") fails it.
const SYLLABLE = /^(NGH|NG|NH|CH|GH|GI|KH|PH|QU|TH|TR|[BCDGHKLMNPQRSTVX])?[AEIOUY]{1,3}(NG|NH|CH|C|M|N|P|T)?$/;

// Only short or vowel-less edge words are junk; longer ones may be real names
// that just aren't Vietnamese.
const junk = (w: string) => {
  const p = plain(w).trim();
  return !SYLLABLE.test(p) && (p.length <= 2 || !/[AEIOUY]/.test(p));
};

function tidy(name: string): string | null {
  const words = name.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  while (words.length && junk(words[words.length - 1])) words.pop();
  while (words.length && junk(words[0])) words.shift();
  return words.length >= 2 ? words.join(" ") : null;
}

// The common family names have one spelling, so the tone marks OCR keeps
// dropping on the first word ("NGUYEN", "NGUYÊN") can be put back.
const SURNAME: Record<string, string> = {
  NGUYEN: "NGUYỄN", TRAN: "TRẦN", PHAM: "PHẠM", HOANG: "HOÀNG", HUYNH: "HUỲNH", PHAN: "PHAN",
  VU: "VŨ", VO: "VÕ", DANG: "ĐẶNG", BUI: "BÙI", DO: "ĐỖ", NGO: "NGÔ", DUONG: "DƯƠNG", TRUONG: "TRƯƠNG",
};

// The name candidate that agrees most with the other passes, word by word.
export function pickName(texts: string[]): string | null {
  // A pass that can't find the code is usually reading junk (a sideways or
  // blurred card); its "name" is noise, so only trust passes with a code.
  const withCode = texts.filter((t) => findStudentCode(t));
  const names = withCode.map(findCardName).map((n) => (n ? tidy(n) : null)).filter((n): n is string => !!n);
  let best: string | null = null, score = -1;
  for (const n of names) {
    const words = plain(n).split(/\s+/).filter((w) => w.length > 1);
    let s = 0;
    for (const other of names) {
      if (other === n) continue;
      const ow = plain(other).split(/\s+/);
      s += words.filter((w) => ow.some((o) => near(o, w))).length;
    }
    // Ties go to the candidate whose words look most like Vietnamese syllables.
    s += words.filter((w) => SYLLABLE.test(w)).length * 0.5 - words.filter((w) => !SYLLABLE.test(w)).length;
    if (s > score) { best = n; score = s; }
  }
  if (!best) return null;
  // Word by word, take the spelling most passes agree on, counting near
  // misreads ("BUC" for "ĐỨC") as votes for the same word; on a tie keep the
  // one with tone marks ("HOÀNG" over "HOANG"), which a plain pass drops.
  const lists = names.map((n) => n.split(/\s+/));
  const marks = (w: string) => w.normalize("NFD").length - w.length;
  const words = best.split(/\s+/);
  // A trailing word most passes don't have is a speck read as letters.
  const agreed = (w: string, i: number) => lists.filter((l) => l[i] && near(plain(l[i]).trim(), plain(w).trim())).length * 2 >= lists.length;
  while (words.length > 2 && !agreed(words[words.length - 1], words.length - 1)) words.pop();
  return words.map((w, i) => {
    if (i === 0 && SURNAME[plain(w).trim()]) return SURNAME[plain(w).trim()];
    // The same slot in other passes, if it looks like the same word.
    const slot = lists.map((l) => l[i]).filter((o): o is string => !!o && near(plain(o).trim(), plain(w).trim()));
    const votes = (x: string) => slot.filter((o) => plain(o).trim() === plain(x).trim()).length;
    const exact = (x: string) => slot.filter((o) => o === x).length;
    return slot.reduce((a, b) => {
      if (votes(b) !== votes(a)) return votes(b) > votes(a) ? b : a;
      // Same letters: a pass that kept tone marks beats one that dropped them.
      if (!!marks(b) !== !!marks(a)) return marks(b) ? b : a;
      return exact(b) > exact(a) ? b : a;
    }, w);
  }).join(" ");
}
