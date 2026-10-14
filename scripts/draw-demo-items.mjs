// Draws the demo listing photos into public/demo/*.webp.
// Stock photos rarely show what an FPT student actually sells (FPT and
// Vovinam uniforms, course books), so every demo item is drawn here instead.
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
  "fpt-jacket": scene("#eef1f4", "#dde3ea", `${shadow(450, 985, 320)}
<path d="M340 200 L250 240 L150 560 L135 900 L215 905 L240 600 L275 470 L275 950 Q450 980 625 950 L625 470 L660 600 L685 905 L765 900 L750 560 L650 240 L560 200 Q450 250 340 200Z" fill="#1f3b63"/>
<path d="M340 200 L250 240 L150 560 L135 900 L215 905 L240 600 L275 470 L275 950 Q450 980 625 950 L625 470 L660 600 L685 905 L765 900 L750 560 L650 240 L560 200 Q450 250 340 200Z" fill="url(#fold)"/>
<path d="M275 470 L275 600 L625 600 L625 470 L560 520 L450 540 L340 520Z" fill="#f36f21"/>
<path d="M340 200 Q450 250 560 200 L560 150 Q450 185 340 150Z" fill="#17304f"/>
<line x1="450" y1="190" x2="450" y2="955" stroke="#c7cfd8" stroke-width="6"/><rect x="442" y="200" width="16" height="30" rx="3" fill="#c7cfd8"/>
<path d="M300 760 L390 760 M510 760 L600 760" stroke="#17304f" stroke-width="8" stroke-linecap="round"/>
<path d="M135 870 L215 875 M765 870 L685 875" stroke="#f36f21" stroke-width="14"/>
${fptBadge(478, 300)}`, "Áo khoác gió đồng phục FPT"),

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

  // Vovinam: blue võ phục with a crossed collar and the blue level-one belt.
  "vovinam": scene("#eef2f8", "#d9e2ef", `${shadow(450, 990, 310)}
<path d="M330 190 L230 230 L110 520 L200 560 L285 380 L285 950 Q450 975 615 950 L615 380 L700 560 L790 520 L670 230 L570 190 L450 420Z" fill="#2350a8"/>
<path d="M330 190 L230 230 L110 520 L200 560 L285 380 L285 950 Q450 975 615 950 L615 380 L700 560 L790 520 L670 230 L570 190 L450 420Z" fill="url(#fold)"/>
<path d="M330 190 L450 420 L470 400 L355 182Z" fill="#1a3f87"/>
<path d="M570 190 L420 470 L420 520 L600 196Z" fill="#2a5cbf"/>
<path d="M570 190 L420 470" stroke="#183a7c" stroke-width="18" stroke-linecap="round"/>
<path d="M330 190 L450 420" stroke="#183a7c" stroke-width="18" stroke-linecap="round"/>
<path d="M110 520 L200 560 L207 543 L118 503Z M790 520 L700 560 L693 543 L782 503Z" fill="#183a7c"/>
<rect x="285" y="640" width="330" height="54" fill="#3b78e7"/>
<rect x="285" y="640" width="330" height="54" fill="url(#gloss)"/>
<path d="M440 694 L400 860 L438 864 L462 700Z M470 694 L520 850 L556 840 L494 690Z" fill="#3b78e7"/>
<rect x="418" y="626" width="70" height="82" rx="10" fill="#2f6ad6"/>
<circle cx="560" cy="300" r="34" fill="#f2c94c"/><circle cx="560" cy="300" r="22" fill="#d6352b"/>
<text x="560" y="307" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="16" fill="#f2c94c">VVN</text>
<text x="450" y="800" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="30" fill="#fff" fill-opacity="0.9" letter-spacing="6">VOVINAM</text>`, "Võ phục Vovinam size M · kèm đai"),

  // ── Course books ───────────────────────────────────────────────────────
  "book-prf192": scene("#f3f0ea", "#e5dfd4", book({ cover: "#1e2a44", accent: "#f36f21", title: ["Programming", "with C"], sub: "Giáo trình môn Lập trình C", code: "PRF192" }), "Giáo trình PRF192 · Lập trình C"),
  "book-mae101": scene("#f2f0f6", "#e1dcea", book({ cover: "#5b3fa0", accent: "#f2c94c", title: ["Mathematics", "for Engineering"], sub: "Giải tích &amp; đại số tuyến tính", code: "MAE101" }), "Giáo trình MAE101 · Toán kỹ thuật"),
  "book-nihongo": scene("#f6efee", "#eadad7", book({ cover: "#c8323a", accent: "#ffffff", title: ["NIHONGO", "Sơ cấp 1"], sub: "Tiếng Nhật cho sinh viên IT", code: "JPD113", codeInk: "#c8323a" }), "Giáo trình tiếng Nhật JPD113"),
  "book-cleancode": scene("#eef3f1", "#dce7e2", book({ cover: "#f5f2ea", accent: "#2f7d5c", title: ["Clean Code"], sub: "Robert C. Martin", code: "English", ink: "#1d2a3a", fpt: false }), "Sách Clean Code · bản tiếng Anh"),

  // ── Electronics ────────────────────────────────────────────────────────
  "casio": scene("#eef0f3", "#dde1e7", `${shadow(450, 1000, 230)}
<g transform="rotate(-6 450 580)">
<rect x="290" y="150" width="320" height="840" rx="40" fill="#2b2f36"/>
<rect x="290" y="150" width="320" height="840" rx="40" fill="url(#gloss)" opacity="0.4"/>
<text x="325" y="208" font-family="${FONT}" font-weight="700" font-size="22" fill="#e9ecef">CASIO</text>
<text x="575" y="208" text-anchor="end" font-family="${FONT}" font-weight="600" font-size="18" fill="#aab2bd">fx-580VN X</text>
<rect x="320" y="232" width="260" height="150" rx="12" fill="#9fb59a"/>
<text x="340" y="282" font-family="DejaVu Sans Mono" font-size="22" fill="#2c3a28">∫(x²+1)dx</text>
<text x="560" y="352" text-anchor="end" font-family="DejaVu Sans Mono" font-weight="700" font-size="38" fill="#2c3a28">12.6667</text>
${Array.from({ length: 4 }, (_, r) => Array.from({ length: 6 }, (_, c) =>
  `<rect x="${322 + c * 43}" y="${410 + r * 46}" width="34" height="28" rx="8" fill="${r === 0 && c < 2 ? "#d9a33a" : "#454b55"}"/>`).join("")).join("")}
${Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) =>
  `<rect x="${322 + c * 52}" y="${606 + r * 70}" width="42" height="50" rx="10" fill="${c >= 3 && r < 2 ? "#3e82c4" : r === 4 && c === 4 ? "#3e82c4" : "#e3e6ea"}"/>`).join("")).join("")}
</g>`, "Máy tính Casio fx-580VN X"),

  "monitor": scene("#eceff3", "#d9dee6", `${shadow(450, 990, 250)}
<rect x="120" y="190" width="660" height="410" rx="16" fill="#1b1e24"/>
<rect x="138" y="208" width="624" height="360" rx="4" fill="#2a3f63"/>
<rect x="138" y="208" width="624" height="360" rx="4" fill="url(#gloss)" opacity="0.5"/>
<rect x="170" y="240" width="250" height="20" rx="4" fill="#f36f21" opacity="0.85"/>
${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="170" y="${282 + i * 34}" width="${[380, 300, 420, 260, 340, 220][i]}" height="12" rx="6" fill="#8fb3e8" opacity="${0.35 + (i % 3) * 0.15}"/>`).join("")}
<rect x="560" y="280" width="170" height="250" rx="10" fill="#fff" opacity="0.12"/>
<text x="450" y="590" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="15" fill="#8a919c">DELL</text>
<path d="M420 600 L480 600 L500 900 L400 900Z" fill="url(#metal)"/>
<rect x="300" y="900" width="300" height="30" rx="14" fill="url(#metal)"/>`, "Màn hình Dell 24 inch · Full HD"),

  "keyboard": scene("#f0eef6", "#ddd9ea", `${shadow(450, 760, 380, 40)}
<g transform="rotate(-8 450 560)">
<rect x="90" y="390" width="720" height="300" rx="26" fill="#2b2d33"/>
<rect x="104" y="402" width="692" height="276" rx="18" fill="#3a3d45"/>
${Array.from({ length: 5 }, (_, r) => Array.from({ length: 14 }, (_, c) => {
    if (r === 4 && c > 3 && c < 10) return c === 4 ? `<rect x="${118 + c * 48}" y="${416 + r * 52}" width="282" height="42" rx="8" fill="#e8e3d6"/>` : "";
    const accent = (r === 0 && c === 0) || (r === 2 && c === 13);
    return `<rect x="${118 + c * 48}" y="${416 + r * 52}" width="42" height="42" rx="8" fill="${accent ? "#f36f21" : r === 0 ? "#9aa3ae" : "#e8e3d6"}"/>`;
  }).join("")).join("")}
<path d="M450 390 C 450 300, 560 300, 600 240 S 700 150, 760 170" stroke="#2b2d33" stroke-width="12" fill="none"/>
</g>`, "Bàn phím cơ Keychron K8 · switch nâu"),

  "headphones": scene("#f3eeee", "#e5dada", `${shadow(450, 960, 260)}
<path d="M250 560 C 250 260, 650 260, 650 560" stroke="#22252b" stroke-width="44" fill="none" stroke-linecap="round"/>
<path d="M270 470 C 300 330, 600 330, 630 470" stroke="#3a3e46" stroke-width="18" fill="none" stroke-linecap="round"/>
<rect x="200" y="520" width="120" height="260" rx="56" fill="#22252b"/>
<rect x="580" y="520" width="120" height="260" rx="56" fill="#22252b"/>
<rect x="282" y="540" width="40" height="220" rx="20" fill="#5a5f69"/>
<rect x="578" y="540" width="40" height="220" rx="20" fill="#5a5f69"/>
<rect x="200" y="520" width="120" height="260" rx="56" fill="url(#gloss)" opacity="0.5"/>
<rect x="580" y="520" width="120" height="260" rx="56" fill="url(#gloss)" opacity="0.5"/>
<text x="260" y="660" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="20" fill="#c9a77a">SONY</text>`, "Tai nghe Sony WH-1000XM4"),

  "arduino": scene("#eef4f4", "#d8e6e6", `${shadow(450, 980, 330)}
<g transform="rotate(-5 450 520)">
<rect x="170" y="240" width="560" height="400" rx="22" fill="#0f7f8a"/>
<rect x="170" y="240" width="560" height="400" rx="22" fill="url(#gloss)" opacity="0.25"/>
<rect x="140" y="300" width="110" height="90" rx="6" fill="url(#metal)"/>
<rect x="150" y="470" width="80" height="80" rx="8" fill="#1d1f23"/>
<rect x="300" y="262" width="400" height="30" rx="4" fill="#1d1f23"/>
${Array.from({ length: 18 }, (_, i) => `<rect x="${310 + i * 21.5}" y="270" width="10" height="14" fill="#d4af37"/>`).join("")}
<rect x="340" y="590" width="340" height="30" rx="4" fill="#1d1f23"/>
${Array.from({ length: 14 }, (_, i) => `<rect x="${352 + i * 23}" y="598" width="10" height="14" fill="#d4af37"/>`).join("")}
<rect x="390" y="420" width="260" height="70" rx="6" fill="#1d1f23"/>
${Array.from({ length: 12 }, (_, i) => `<rect x="${400 + i * 21}" y="408" width="8" height="12" fill="#bfc5cc"/><rect x="${400 + i * 21}" y="490" width="8" height="12" fill="#bfc5cc"/>`).join("")}
<text x="300" y="400" font-family="${FONT}" font-weight="800" font-size="56" fill="#fff">UNO</text>
<text x="300" y="440" font-family="${FONT}" font-weight="600" font-size="20" fill="#cfeef0">ARDUINO R3</text>
<circle cx="680" cy="370" r="10" fill="#7ee081"/><circle cx="680" cy="400" r="10" fill="#ffcf5a"/>
</g>
<path d="M330 640 C 300 760, 420 760, 400 880" stroke="#e5484d" stroke-width="10" fill="none" stroke-linecap="round"/>
<path d="M520 640 C 560 760, 460 800, 520 900" stroke="#3e82c4" stroke-width="10" fill="none" stroke-linecap="round"/>
<path d="M600 650 C 660 760, 600 820, 650 900" stroke="#f2c94c" stroke-width="10" fill="none" stroke-linecap="round"/>
<rect x="250" y="860" width="440" height="90" rx="10" fill="#f4f1ea" stroke="#d8d3c6" stroke-width="3"/>
${Array.from({ length: 2 }, (_, r) => Array.from({ length: 20 }, (_, c) => `<rect x="${268 + c * 21}" y="${880 + r * 34}" width="8" height="8" fill="#b9b2a2"/>`).join("")).join("")}`, "Bộ kit Arduino Uno R3 · môn IOT102"),

  "laptop-stand": scene("#f1f0ec", "#e2e0d8", `${shadow(450, 960, 300)}
<path d="M230 930 L670 930 L640 900 L260 900Z" fill="url(#metal)"/>
<path d="M300 900 L560 560 L600 560 L350 900Z" fill="url(#metal)"/>
<path d="M200 520 L700 400 L712 440 L212 560Z" fill="url(#metal)"/>
<path d="M210 515 L690 400 L700 370 L220 485Z" fill="#c4cbd3"/>
<path d="M220 485 L690 372 L600 120 L150 230Z" fill="#2d3138"/>
<path d="M232 476 L676 370 L594 140 L166 244Z" fill="#3e5a86"/>
<path d="M232 476 L676 370 L594 140 L166 244Z" fill="url(#gloss)" opacity="0.4"/>`, "Giá đỡ laptop nhôm · gấp gọn"),

  // ── Dorm ───────────────────────────────────────────────────────────────
  "rice-cooker": scene("#f6f1ea", "#e9e0d3", `${shadow(450, 960, 260)}
<path d="M240 470 Q240 940 450 940 Q660 940 660 470Z" fill="#fbfaf7"/>
<path d="M240 470 Q240 940 450 940 Q660 940 660 470Z" fill="url(#fold)"/>
<path d="M220 470 Q450 300 680 470Z" fill="#f2efe9"/>
<path d="M220 470 Q450 300 680 470Z" fill="url(#gloss)"/>
<rect x="400" y="350" width="100" height="40" rx="20" fill="#d9d4cb"/>
<rect x="220" y="462" width="460" height="22" rx="11" fill="#e3ddd3"/>
<rect x="355" y="600" width="190" height="130" rx="22" fill="#f36f21"/>
<rect x="378" y="622" width="144" height="40" rx="8" fill="#ffe2cf"/>
<circle cx="405" cy="695" r="13" fill="#fff"/><circle cx="450" cy="695" r="13" fill="#fff"/><circle cx="495" cy="695" r="13" fill="#fff"/>
<text x="450" y="650" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="20" fill="#c2541a">1.2 L</text>`, "Nồi cơm điện mini 1,2 L"),

  "fan": scene("#eef4f6", "#dae6ea", `${shadow(450, 990, 200)}
<rect x="436" y="560" width="28" height="380" rx="10" fill="#e8edf0"/>
<rect x="436" y="560" width="10" height="380" fill="#cfd7dc"/>
<ellipse cx="450" cy="950" rx="170" ry="34" fill="#e8edf0"/>
<ellipse cx="450" cy="944" rx="170" ry="30" fill="#f6f8f9"/>
<circle cx="450" cy="400" r="250" fill="#f6f8f9" fill-opacity="0.6" stroke="#cfd7dc" stroke-width="10"/>
${[0, 120, 240].map((a) => `<path d="M450 400 C 520 300, 640 330, 600 420 C 560 470, 500 440, 450 400Z" fill="#7cc3d6" transform="rotate(${a} 450 400)"/>`).join("")}
${Array.from({ length: 24 }, (_, i) => `<line x1="450" y1="400" x2="${450 + 248 * Math.cos((i * Math.PI) / 12)}" y2="${400 + 248 * Math.sin((i * Math.PI) / 12)}" stroke="#cfd7dc" stroke-width="3"/>`).join("")}
<circle cx="450" cy="400" r="160" fill="none" stroke="#cfd7dc" stroke-width="4"/>
<circle cx="450" cy="400" r="58" fill="#e8edf0" stroke="#cfd7dc" stroke-width="4"/>
<text x="450" y="408" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="20" fill="#4f8fa3">KDK</text>`, "Quạt đứng KDK"),

  "lamp": scene("#f3f1ec", "#e3dfd6", `${shadow(450, 960, 220)}
<circle cx="560" cy="470" r="230" fill="#ffe7a8" opacity="0.35"/>
<ellipse cx="380" cy="930" rx="150" ry="30" fill="#2f3238"/>
<path d="M380 920 L330 600" stroke="#2f3238" stroke-width="26" stroke-linecap="round"/>
<path d="M330 600 L560 330" stroke="#2f3238" stroke-width="26" stroke-linecap="round"/>
<circle cx="330" cy="600" r="22" fill="#4a4e57"/>
<path d="M520 260 L700 330 L640 470 L470 390Z" fill="#2f3238"/>
<path d="M480 400 L640 470" stroke="#ffd56a" stroke-width="14" stroke-linecap="round"/>`, "Đèn bàn LED chống cận"),

  "kettle": scene("#f1f3f6", "#dfe3ea", `${shadow(450, 960, 240)}
<ellipse cx="450" cy="930" rx="200" ry="30" fill="#2f3238"/>
<path d="M300 900 L330 380 Q450 340 570 380 L600 900Z" fill="url(#metal)"/>
<path d="M300 900 L330 380 Q450 340 570 380 L600 900Z" fill="url(#fold)"/>
<path d="M570 430 C 700 430, 720 760, 590 800" stroke="#2f3238" stroke-width="36" fill="none"/>
<path d="M330 420 L230 330 L250 310 L340 380Z" fill="#c7cdd4"/>
<path d="M330 380 Q450 300 570 380 Q450 350 330 380Z" fill="#2f3238"/>
<rect x="430" y="320" width="40" height="26" rx="10" fill="#2f3238"/>
<rect x="420" y="560" width="60" height="150" rx="10" fill="#9fb3c8" opacity="0.6"/>`, "Ấm siêu tốc 1,8 L"),

  // ── Other ──────────────────────────────────────────────────────────────
  "backpack": scene("#eef0f4", "#dcdfe8", `${shadow(450, 990, 260)}
<path d="M380 220 Q450 140 520 220" stroke="#20232a" stroke-width="22" fill="none"/>
<path d="M240 330 Q240 220 450 220 Q660 220 660 330 L660 900 Q660 960 600 960 L300 960 Q240 960 240 900Z" fill="#2f3542"/>
<path d="M240 330 Q240 220 450 220 Q660 220 660 330 L660 900 Q660 960 600 960 L300 960 Q240 960 240 900Z" fill="url(#fold)"/>
<path d="M260 340 Q450 280 640 340" stroke="#4a5164" stroke-width="6" fill="none"/>
<rect x="300" y="600" width="300" height="300" rx="40" fill="#3a4152"/>
<path d="M310 650 L590 650" stroke="#1f232c" stroke-width="6"/>
<rect x="420" y="636" width="60" height="16" rx="8" fill="#f36f21"/>
<rect x="420" y="400" width="60" height="140" rx="10" fill="#3a4152"/>`, "Balo laptop 15,6 inch chống nước"),

  "helmet": scene("#f4efe9", "#e6dccf", `${shadow(450, 930, 280)}
<path d="M200 700 Q190 330 450 300 Q710 330 700 700 L640 700 Q620 560 450 560 Q300 560 270 700Z" fill="#f36f21"/>
<path d="M200 700 Q190 330 450 300 Q710 330 700 700 L640 700 Q620 560 450 560 Q300 560 270 700Z" fill="url(#gloss)"/>
<path d="M300 560 Q450 520 610 560 L620 640 Q450 600 290 640Z" fill="#2c3646" opacity="0.85"/>
<path d="M300 560 Q450 520 610 560 L612 580 Q450 545 298 580Z" fill="#fff" opacity="0.35"/>
<path d="M200 700 L270 700 L280 720 L200 720Z M640 700 L700 700 L700 720 L630 720Z" fill="#2f3238"/>
<path d="M240 720 Q300 860 360 860 M660 720 Q600 860 540 860" stroke="#2f3238" stroke-width="10" fill="none"/>
<path d="M360 860 L540 860" stroke="#2f3238" stroke-width="10" stroke-dasharray="20 8"/>`, "Mũ bảo hiểm 3/4 · size L"),
};

await mkdir("public/demo", { recursive: true });
for (const [name, svg] of Object.entries(items))
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(`public/demo/${name}.webp`);
console.log(`drew ${Object.keys(items).length} demo photos`);
