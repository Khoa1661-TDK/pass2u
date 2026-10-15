"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./icons";
import { getReader, quickCode } from "@/lib/read-student-code";

// ISO ID-1 card (85.6 x 54 mm) stood upright: the FPT student card is
// printed portrait, and a landscape frame made students hold it sideways at
// half the size.
const RATIO = 54 / 85.6;

// Auto-capture like a QR scan: sample the framed area a few times a second
// until a bright, card-sized rectangle has held still. Then, before snapping,
// take the sharpest of a few frames and check that the student code actually
// reads on it; a blurred or glary frame is skipped and scanning carries on.
// Snapping on brightness alone caught frames mid-focus that picking a photo
// from the gallery never had.
const TICK_MS = 250;
const HITS_FAST = 4;
const HITS_SLOW = 8;
const GRID_W = 30;
const GRID_H = 48;
const MARGIN = 0.06;
// Wider for the still: its field of view can differ slightly from the video's.
const STILL_MARGIN = 0.12;

function toCanvas(src: CanvasImageSource, x: number, y: number, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  c.getContext("2d")!.drawImage(src, x, y, w, h, 0, 0, c.width, c.height);
  return c;
}
const BURST = 3;
const BURST_GAP_MS = 120;

// Variance of the Laplacian on a small grey copy: higher is sharper.
function sharpness(src: HTMLCanvasElement): number {
  const w = 240, h = Math.max(1, Math.round((240 * src.height) / src.width));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  let sum = 0, sq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
    sum += l; sq += l * l; n++;
  }
  return n ? sq / n - (sum / n) ** 2 : 0;
}

// Maps the on-screen frame back to video pixels (video is object-cover).
function frameRect(v: HTMLVideoElement, f: HTMLDivElement) {
  const vr = v.getBoundingClientRect(), fr = f.getBoundingClientRect();
  const scale = Math.max(vr.width / v.videoWidth, vr.height / v.videoHeight);
  const offX = (v.videoWidth * scale - vr.width) / 2, offY = (v.videoHeight * scale - vr.height) / 2;
  return {
    sx: (fr.left - vr.left + offX) / scale,
    sy: (fr.top - vr.top + offY) / scale,
    sw: fr.width / scale,
    sh: fr.height / scale,
  };
}

// Full-screen camera view with a card-shaped frame. The card is detected and
// captured automatically; the shutter button stays as a manual override.
export function CardScanner({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<MediaStreamTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"looking" | "reading" | "hint">("looking");

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
        // Keep refocusing as the card moves closer; not every browser has it.
        track.current = s.getVideoTracks()[0] ?? null;
        track.current?.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
      })
      .catch(() => setError("Không mở được camera của bạn. Hãy cho phép truy cập camera, hoặc chọn ảnh thay thế."));
    if (!navigator.mediaDevices) setError("Trình duyệt này không mở được camera. Hãy chọn ảnh thay thế.");
    // Load the reader while the student lines the card up.
    getReader().catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // The framed area at full camera resolution, with a margin so a card held
  // slightly off-centre isn't clipped.
  function grab(): HTMLCanvasElement | null {
    const v = video.current, f = frame.current;
    if (!v || !f || !v.videoWidth) return null;
    const r = frameRect(v, f);
    const mx = r.sw * MARGIN, my = r.sh * MARGIN;
    const sx = Math.max(0, r.sx - mx), sy = Math.max(0, r.sy - my);
    const sw = Math.min(v.videoWidth - sx, r.sw + 2 * mx), sh = Math.min(v.videoHeight - sy, r.sh + 2 * my);
    const c = document.createElement("canvas");
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    c.getContext("2d")!.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c;
  }

  // A few frames a moment apart; the sharpest one wins.
  async function sharpest(): Promise<HTMLCanvasElement | null> {
    let best: HTMLCanvasElement | null = null, score = -1;
    for (let i = 0; i < BURST; i++) {
      if (i) await new Promise((r) => setTimeout(r, BURST_GAP_MS));
      const c = grab();
      if (!c) continue;
      const s = sharpness(c);
      if (s > score) { best = c; score = s; }
    }
    return best;
  }

  // A full-resolution still from the camera, cropped to the frame, where the
  // browser can take one (Chrome on Android). It is the same picture the
  // camera app would save, so it reads as well as picking a photo; a video
  // frame has a fraction of the pixels. iPhones fall back to the video frame,
  // which they deliver at up to 4K.
  async function still(): Promise<HTMLCanvasElement | null> {
    const v = video.current, f = frame.current, t = track.current;
    if (!v || !f || !t || typeof ImageCapture === "undefined") return null;
    try {
      const bmp = await createImageBitmap(await new ImageCapture(t).takePhoto());
      // The still and the video can differ in orientation; then keep it whole.
      if (bmp.width > bmp.height !== v.videoWidth > v.videoHeight) return toCanvas(bmp, 0, 0, bmp.width, bmp.height);
      // The video shows the centre of what the sensor sees; map the frame across.
      const k = Math.min(bmp.width / v.videoWidth, bmp.height / v.videoHeight);
      const ox = (bmp.width - v.videoWidth * k) / 2, oy = (bmp.height - v.videoHeight * k) / 2;
      const r = frameRect(v, f);
      const mx = r.sw * STILL_MARGIN, my = r.sh * STILL_MARGIN;
      const x = Math.max(0, ox + (r.sx - mx) * k), y = Math.max(0, oy + (r.sy - my) * k);
      return toCanvas(bmp, x, y, Math.min(bmp.width - x, (r.sw + 2 * mx) * k), Math.min(bmp.height - y, (r.sh + 2 * my) * k));
    } catch {
      return null;
    }
  }

  async function finish(c: HTMLCanvasElement) {
    const best = (await still()) ?? c;
    best.toBlob((b) => b && onCapture(new File([b], "student-card.jpg", { type: "image/jpeg" })), "image/jpeg", 0.95);
  }

  const busy = useRef(false);
  async function capture() {
    if (busy.current) return;
    busy.current = true;
    const c = await sharpest();
    if (c) await finish(c);
    else busy.current = false;
  }

  // Card detection: the framed area must be bright (the card is white/cream),
  // clearly brighter than its surroundings, and steady between samples.
  useEffect(() => {
    if (error) return;
    const canvas = document.createElement("canvas");
    let prev: Float32Array | null = null;
    let hitsFast = 0;
    let hitsSlow = 0;
    let done = false;
    let checking = false;
    let misses = 0;
    // Snap only once the code reads on the sharpest recent frame.
    const confirm = async () => {
      const c = await sharpest();
      if (!c || done) return;
      const code = await quickCode(c).catch(() => null);
      if (done) return;
      if (code) {
        done = true;
        busy.current = true;
        finish(c);
      } else {
        misses++;
        setStatus(misses >= 2 ? "hint" : "looking");
      }
    };
    const timer = setInterval(() => {
      const v = video.current, f = frame.current;
      if (done || checking || !v || !f || !v.videoWidth) return;
      const { sx, sy, sw, sh } = frameRect(v, f);
      canvas.width = 160;
      canvas.height = Math.round((160 * v.videoHeight) / v.videoWidth);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const lum = (x: number, y: number) => {
        const i = (Math.round(y) * canvas.width + Math.round(x)) * 4;
        return 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      };
      const k = canvas.width / v.videoWidth; // video px -> canvas px
      const ix = sx * k, iy = sy * k, iw = sw * k, ih = sh * k;
      const grid = new Float32Array(GRID_W * GRID_H);
      let innerLit = 0, innerTot = 0;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const l = lum(ix + (gx / GRID_W) * iw, iy + (gy / GRID_H) * ih);
          grid[gy * GRID_W + gx] = l;
          innerTot++;
          if (l > 140) innerLit++;
        }
      }
      // Ring just outside the frame — a card stands out from its background.
      const bx = Math.max(0, ix - iw * 0.15), by = Math.max(0, iy - ih * 0.15);
      const bw = Math.min(canvas.width - bx, iw * 1.3), bh = Math.min(canvas.height - by, ih * 1.3);
      let ringLit = 0, ringTot = 0;
      for (let y = by; y < by + bh; y += 3) {
        for (let x = bx; x < bx + bw; x += 3) {
          if (x >= ix && x < ix + iw && y >= iy && y < iy + ih) continue;
          ringTot++;
          if (lum(x, y) > 140) ringLit++;
        }
      }
      const innerBright = innerLit / innerTot;
      const ringBright = ringTot ? ringLit / ringTot : 0;
      let diff = Infinity;
      if (prev) {
        let sum = 0;
        for (let i = 0; i < grid.length; i++) sum += Math.abs(grid[i] - prev[i]);
        diff = sum / grid.length;
      }
      prev = grid;
      // Fast: bright card standing out from a darker surround, held steady.
      const fast = innerBright > 0.5 && innerBright - ringBright > 0.12 && diff < 6;
      // Slow: bright and steady for longer — covers a card that overflows the
      // frame or lies on a bright desk, where the edge test can't work.
      const slow = innerBright > 0.45 && diff < 8;
      hitsFast = fast ? hitsFast + 1 : 0;
      hitsSlow = slow ? hitsSlow + 1 : 0;
      if ((hitsFast >= HITS_FAST || hitsSlow >= HITS_SLOW) && !checking && !busy.current) {
        checking = true;
        setStatus("reading");
        confirm().finally(() => { checking = false; hitsFast = hitsSlow = 0; });
      }
    }, TICK_MS);
    return () => {
      done = true;
      clearInterval(timer);
    };
  }, [error]);

  // Portal to <body>: animated page wrappers would otherwise trap position:fixed.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Quét thẻ sinh viên của bạn" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 grid place-items-center px-5">
          <div
            ref={frame}
            className="relative h-[min(58vh,calc((100vw-2.5rem)*1.586))] max-w-full overflow-hidden rounded-xl shadow-[0_0_0_100vmax_oklch(0_0_0/0.55)] ring-2 ring-white/90"
            style={{ aspectRatio: RATIO }}
          >
            {/* QR-style corner brackets */}
            <span aria-hidden className="absolute left-0 top-0 size-10 border-l-4 border-t-4 border-white" />
            <span aria-hidden className="absolute right-0 top-0 size-10 border-r-4 border-t-4 border-white" />
            <span aria-hidden className="absolute bottom-0 left-0 size-10 border-b-4 border-l-4 border-white" />
            <span aria-hidden className="absolute bottom-0 right-0 size-10 border-b-4 border-r-4 border-white" />
            {!error && <span aria-hidden className="scan-line absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />}
          </div>
        </div>
        <p className="absolute inset-x-0 top-6 px-16 text-center text-sm font-medium">
          {error ??
            (status === "reading"
              ? "Đang đọc thẻ, giữ yên…"
              : status === "hint"
                ? "Chưa đọc được mã. Đưa thẻ gần hơn cho vừa khung và nghiêng nhẹ để tránh lóa đèn."
                : "Đặt thẻ đứng thẳng trong khung, nơi đủ sáng, rồi giữ yên.")}
        </p>
        <button type="button" onClick={onClose} aria-label="Đóng quét thẻ" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25">
          <XIcon />
        </button>
      </div>
      <div className="flex items-center justify-center gap-4 bg-black py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={capture}
          disabled={!!error}
          aria-label="Chụp thẻ"
          title="Chụp ngay"
          className="size-18 rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90 disabled:opacity-40"
        />
        <div className="max-w-44 text-sm text-white/70">
          <p>Chưa tự chụp được? Chạm vào nút chụp.</p>
          {/* The phone's own camera app, for when the live view can't read the card. */}
          <label className="mt-1 inline-block cursor-pointer font-semibold text-white underline underline-offset-4 focus-within:outline-2 focus-within:outline-white">
            Dùng ứng dụng camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onCapture(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>,
    document.body,
  );
}
