"use client";

import { useActionState, useRef, useState } from "react";
import { submitVerification } from "@/app/actions/verify";
import { CAMPUSES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "@/components/ui";
import { CameraIcon } from "@/components/icons";
import { shrinkImage } from "@/lib/shrink-image";
import { CardScanner } from "@/components/card-scanner";
import { readStudentCode } from "@/lib/read-student-code";

export function VerifyForm({ defaults }: { defaults: { studentCode: string; campus: string } }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocr, setOcr] = useState<{ state: "reading" | "found" | "missed"; code?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  async function applyCard(file: File) {
    setPreview(URL.createObjectURL(file));
    setOcr({ state: "reading" });
    try {
      const code = await readStudentCode(file);
      if (code && codeRef.current) {
        codeRef.current.value = code;
        setOcr({ state: "found", code });
      } else setOcr({ state: "missed" });
    } catch {
      setOcr({ state: "missed" });
    }
  }

  function takeScan(file: File) {
    setScanning(false);
    // Put the cropped capture into the real file input so the form submits it.
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileRef.current) fileRef.current.files = dt.files;
    applyCard(file);
  }
  const [state, action] = useActionState(async (prev: Parameters<typeof submitVerification>[0], fd: FormData) => {
    const f = fd.get("idCard");
    if (f instanceof File && f.size) fd.set("idCard", await shrinkImage(f, 1800));
    return submitVerification(prev, fd);
  }, undefined);
  const v = state?.fields ?? defaults;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="studentCode" className="field-label">Mã sinh viên</label>
          <input ref={codeRef} id="studentCode" name="studentCode" placeholder="SE190123" className="input uppercase" defaultValue={v.studentCode} autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="campus" className="field-label">Cơ sở</label>
          <select id="campus" name="campus" className="input" defaultValue={v.campus} required>
            <option value="" disabled>Chọn…</option>
            {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <span className="field-label" id="card-label">Ảnh thẻ sinh viên</span>
        <div className="relative grid aspect-[1.586] w-full place-items-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-sunken text-center focus-within:border-accent">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Xem trước thẻ sinh viên của bạn" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 px-6 text-sm text-ink-2">
              <CameraIcon size={28} className="text-ink-3" />
              Quét mặt trước thẻ, hoặc chọn ảnh
            </span>
          )}
          {ocr?.state === "reading" && (
            <span className="absolute inset-x-0 bottom-0 overflow-hidden bg-ink/70 py-2 text-xs font-medium text-bg">
              <span className="scan-line absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              <span className="relative">Đang đọc mã sinh viên…</span>
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setScanning(true)} className="btn btn-primary">
            <CameraIcon size={18} />
            {preview ? "Quét lại" : "Quét thẻ"}
          </button>
          <label className="btn btn-secondary cursor-pointer focus-within:outline-2 focus-within:outline-accent">
            Chọn ảnh
            <input
              ref={fileRef}
              type="file"
              name="idCard"
              accept="image/jpeg,image/png,image/webp"
              aria-labelledby="card-label"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) applyCard(f);
                else setPreview(null);
              }}
            />
          </label>
        </div>
        <p aria-live="polite" className={`field-hint ${ocr?.state === "found" ? "!text-ok" : ""}`}>
          {ocr?.state === "found"
            ? `Đã đọc được ${ocr.code} từ thẻ của bạn. Kiểm tra lại cho khớp trước khi gửi.`
            : ocr?.state === "missed"
              ? "Không đọc được mã tự động. Bạn hãy nhập mã ở phía trên."
              : null}
        </p>
        {scanning && <CardScanner onCapture={takeScan} onClose={() => setScanning(false)} />}
        <p className="field-hint">Đảm bảo tên, ảnh và mã sinh viên đều rõ.</p>
      </div>
      <SubmitButton className="btn btn-primary w-full" pending="Đang tải lên…">Gửi duyệt</SubmitButton>
    </form>
  );
}
