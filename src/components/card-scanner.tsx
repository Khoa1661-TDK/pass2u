"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./icons";

// ISO ID-1 card ratio (85.6 x 54 mm), the shape of the FPT student card.
const RATIO = 1.586;

// Auto-capture like a QR scan: sample the framed area a few times a second
// and snap when a bright, card-sized rectangle has held still for ~1s.
const TICK_MS = 250;
const HITS_TO_CAPTURE = 4;
const GRID_W = 48;
const GRID_H = 30;

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setError("Không mở được camera của bạn. Hãy cho phép truy cập camera, hoặc chọn ảnh thay thế."));
    if (!navigator.mediaDevices) setError("Trình duyệt này không mở được camera. Hãy chọn ảnh thay thế.");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function capture() {
    const v = video.current, f = frame.current;
    if (!v || !f || !v.videoWidth) return;
    const { sx, sy, sw, sh } = frameRect(v, f);
    const c = document.createElement("canvas");
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    c.getContext("2d")!.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    c.toBlob((b) => b && onCapture(new File([b], "student-card.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
  }

  // Card detection: the framed area must be bright (the card is white/cream),
  // clearly brighter than its surroundings, and steady between samples.
  useEffect(() => {
    if (error) return;
    const canvas = document.createElement("canvas");
    let prev: Float32Array | null = null;
    let hits = 0;
    let done = false;
    const timer = setInterval(() => {
      const v = video.current, f = frame.current;
      if (done || !v || !f || !v.videoWidth) return;
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
      const cardLike = innerBright > 0.5 && innerBright - ringBright > 0.12;
      const steady = diff < 10;
      hits = cardLike && steady ? hits + 1 : 0;
      if (hits >= HITS_TO_CAPTURE) {
        done = true;
        capture();
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [error]);

  // Portal to <body>: animated page wrappers would otherwise trap position:fixed.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Quét thẻ sinh viên của bạn" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 grid place-items-center px-5">
          <div
            ref={frame}
            className="relative w-full max-w-xl overflow-hidden rounded-xl shadow-[0_0_0_100vmax_oklch(0_0_0/0.55)] ring-2 ring-white/90"
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
        <p className="absolute inset-x-0 top-6 px-6 text-center text-sm font-medium">
          {error ?? "Đặt mặt trước thẻ vào trong khung. Thẻ sẽ được chụp tự động."}
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
        <p className="max-w-40 text-sm text-white/70">Chưa tự chụp được? Chạm vào đây.</p>
      </div>
    </div>,
    document.body,
  );
}
