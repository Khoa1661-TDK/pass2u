"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./icons";

// ISO ID-1 card ratio (85.6 x 54 mm), the shape of the FPT student card.
const RATIO = 1.586;

// Full-screen camera view with a card-shaped frame. Captures only what's
// inside the frame, so the admin gets a tight, readable crop.
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
    // Map the on-screen frame back to video pixels (video is object-cover).
    const vr = v.getBoundingClientRect(), fr = f.getBoundingClientRect();
    const scale = Math.max(vr.width / v.videoWidth, vr.height / v.videoHeight);
    const offX = (v.videoWidth * scale - vr.width) / 2, offY = (v.videoHeight * scale - vr.height) / 2;
    const sx = (fr.left - vr.left + offX) / scale, sy = (fr.top - vr.top + offY) / scale;
    const sw = fr.width / scale, sh = fr.height / scale;
    const c = document.createElement("canvas");
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    c.getContext("2d")!.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    c.toBlob((b) => b && onCapture(new File([b], "student-card.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
  }

  // Portal to <body>: animated page wrappers would otherwise trap position:fixed.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Quét thẻ sinh viên của bạn" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 grid place-items-center px-5">
          <div
            ref={frame}
            className="w-full max-w-xl rounded-xl shadow-[0_0_0_100vmax_oklch(0_0_0/0.55)] ring-2 ring-white/90"
            style={{ aspectRatio: RATIO }}
          />
        </div>
        <p className="absolute inset-x-0 top-6 px-6 text-center text-sm font-medium">
          {error ?? "Đặt mặt trước thẻ của bạn vào trong khung. Tránh để bị lóa."}
        </p>
        <button type="button" onClick={onClose} aria-label="Đóng quét thẻ" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25">
          <XIcon />
        </button>
      </div>
      <div className="flex justify-center bg-black py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={capture}
          disabled={!!error}
          aria-label="Chụp thẻ"
          className="size-18 rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90 disabled:opacity-40"
        />
      </div>
    </div>,
    document.body,
  );
}
