// Draws the demo listing photos into public/demo/*.webp.
// Only for FPT-specific items no free photo shows (PE kit, course books);
// everything else uses real photos (see scripts/demo-listings.mts).
// Run: node scripts/draw-demo-items.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const W = 900, H = 1125;
const FONT = "Inter, DejaVu Sans";

const scene = (top, bottom, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
<radialGradient id="sh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.24"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.10"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.07"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9edf1"/><stop offset="0.5" stop-color="#b9c1ca"/><stop offset="1" stop-color="#dfe4e9"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${body}
<g><rect x="40" y="1036" rx="22" width="${label.length * 12.5 + 48}" height="46" fill="#fff" fill-opacity="0.88"/>
<text x="64" y="1066" font-family="${FONT}" font-weight="600" font-size="22" fill="#4a3a2e">${label}</text></g>
</svg>`;

const shadow = (cx, cy, rx, ry = 34) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#sh)"/>`;

const fptLogo = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
${[["#1f5fae", "F", 0], ["#f36f21", "P", 38], ["#3aa64a", "T", 76]].map(([c, l, dx]) =>
  `<g transform="translate(${dx} 0) skewX(-12)"><rect width="34" height="34" rx="4" fill="${c}"/><text x="8" y="26" font-family="${FONT}" font-weight="800" font-size="24" fill="#fff">${l}</text></g>`).join("")}
<text x="0" y="56" font-family="${FONT}" font-weight="700" font-size="14.5" fill="#1d2a3a">FPT UNIVERSITY</text></g>`;
const fptBadge = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-14" y="-12" width="170" height="82" rx="8" fill="#fff"/>${fptLogo(4, 0)}</g>`;

// A book standing at a slight angle: cover, page block, spine shade.
const book = ({ cover, accent, title, sub, code, ink = "#fff", codeInk = "#fff", fpt = true }) => `
${shadow(450, 985, 290)}
<g transform="rotate(-4 450 560)">
<rect x="232" y="186" width="440" height="790" rx="10" fill="#f3efe6"/>
<rect x="222" y="176" width="440" height="790" rx="12" fill="${cover}"/>
<rect x="222" y="176" width="34" height="790" rx="10" fill="#000" fill-opacity="0.18"/>
<rect x="256" y="176" width="406" height="790" fill="url(#fold)"/>
<rect x="290" y="250" width="320" height="8" fill="${accent}"/>
<text x="290" y="340" font-family="${FONT}" font-weight="800" font-size="${Math.min(50, Math.floor(600 / Math.max(...title.map(t => t.length))))}" fill="${ink}">${title[0]}</text>
${title[1] ? `<text x="290" y="400" font-family="${FONT}" font-weight="800" font-size="${Math.min(50, Math.floor(600 / Math.max(...title.map(t => t.length))))}" fill="${ink}">${title[1]}</text>` : ""}
<text x="290" y="${title[1] ? 452 : 392}" font-family="${FONT}" font-weight="500" font-size="24" fill="${ink}" fill-opacity="0.8">${sub}</text>
<rect x="290" y="700" width="200" height="54" rx="27" fill="${accent}"/>
<text x="390" y="736" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="26" fill="${codeInk}">${code}</text>
${fpt ? `<g transform="translate(290 860) scale(0.8)">${fptLogo(0, 0)}</g>` : ""}
</g>`;

const items = {
  // ── Uniforms ───────────────────────────────────────────────────────────
  // fpt-polo.webp is a real photo Khoa supplied, not drawn here.
  "fpt-pe": scene("#f1f5ef", "#dfe8da", `${shadow(450, 990, 300)}
<g transform="translate(0 -20)">
<path d="M345 150 L265 180 L160 280 L230 355 L290 310 L290 640 Q450 665 610 640 L610 310 L670 355 L740 280 L635 180 L555 150 Q450 215 345 150Z" fill="#fff" stroke="#d8dcd5" stroke-width="3"/>
<path d="M345 150 Q450 215 555 150 L535 140 Q450 190 365 140Z" fill="#f36f21"/>
<path d="M160 280 L230 355 L242 343 L172 268Z M740 280 L670 355 L658 343 L728 268Z" fill="#f36f21"/>
<path d="M290 470 L610 430 L610 470 L290 510Z" fill="#f36f21" opacity="0.9"/>
${fptLogo(392, 250)}</g>
<path d="M300 690 L600 690 L630 960 L470 960 L450 820 L430 960 L270 960Z" fill="#1f3b63"/>
<path d="M300 690 L600 690 L602 715 L298 715Z" fill="#17304f"/>
<path d="M285 820 L270 960 L300 960 L312 820Z M615 820 L630 960 L600 960 L588 820Z" fill="#f36f21"/>`, "Đồng phục thể dục FPT · size L"),

  // ── Course books ───────────────────────────────────────────────────────
  "book-prf192": scene("#f3f0ea", "#e5dfd4", book({ cover: "#1e2a44", accent: "#f36f21", title: ["Programming", "with C"], sub: "Giáo trình môn Lập trình C", code: "PRF192" }), "Giáo trình PRF192 · Lập trình C"),
  "book-mae101": scene("#f2f0f6", "#e1dcea", book({ cover: "#5b3fa0", accent: "#f2c94c", title: ["Mathematics", "for Engineering"], sub: "Giải tích &amp; đại số tuyến tính", code: "MAE101" }), "Giáo trình MAE101 · Toán kỹ thuật"),
  "book-nihongo": scene("#f6efee", "#eadad7", book({ cover: "#c8323a", accent: "#ffffff", title: ["NIHONGO", "Sơ cấp 1"], sub: "Tiếng Nhật cho sinh viên IT", code: "JPD113", codeInk: "#c8323a" }), "Giáo trình tiếng Nhật JPD113"),
  "book-cleancode": scene("#eef3f1", "#dce7e2", book({ cover: "#f5f2ea", accent: "#2f7d5c", title: ["Clean Code"], sub: "Robert C. Martin", code: "English", ink: "#1d2a3a", fpt: false }), "Sách Clean Code · bản tiếng Anh"),

};

await mkdir("public/demo", { recursive: true });
for (const [name, svg] of Object.entries(items))
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(`public/demo/${name}.webp`);
console.log(`drew ${Object.keys(items).length} demo photos`);
