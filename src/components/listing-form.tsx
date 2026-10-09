"use client";

import { useActionState, useRef, useState } from "react";
import { CATEGORIES, CONDITIONS, TYPES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "./ui";
import { CameraIcon, XIcon } from "./icons";
import { shrinkImage } from "@/lib/shrink-image";
import type { FormState } from "@/app/actions/auth";

type Defaults = {
  title: string;
  description: string;
  category: string;
  condition: string;
  type: string;
  price: string;
  exchangeFor: string;
};
type Existing = { id: string; url: string };

const MAX = 6;

export function ListingForm({
  action,
  defaults,
  existing = [],
  submitLabel,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  defaults?: Partial<Defaults>;
  existing?: Existing[];
  submitLabel: string;
}) {
  const [kept, setKept] = useState(existing);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    fd.delete("images");
    for (const { file } of files) fd.append("images", await shrinkImage(file));
    for (const k of kept) fd.append("keepImage", k.id);
    return action(prev, fd);
  }, undefined);

  const v = { ...defaults, ...state?.fields } as Partial<Defaults>;
  const [type, setType] = useState(v.type || "sell");
  const count = kept.length + files.length;

  return (
    <form action={formAction} className="space-y-7" noValidate>
      <FormMessage state={state} />

      <section aria-labelledby="photos-h">
        <div className="flex items-baseline justify-between">
          <h2 id="photos-h" className="field-label !mb-0">Ảnh</h2>
          <span className="text-sm tabular-nums text-ink-3">{count}/{MAX}</span>
        </div>
        <p className="field-hint !mt-1">Ảnh đầu tiên là ảnh bìa. Nên chụp dưới ánh sáng tự nhiên.</p>
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {kept.map((k) => (
            <Thumb key={k.id} url={k.url} onRemove={() => setKept((x) => x.filter((y) => y.id !== k.id))} />
          ))}
          {files.map((f) => (
            <Thumb key={f.url} url={f.url} onRemove={() => setFiles((x) => x.filter((y) => y.url !== f.url))} />
          ))}
          {count < MAX && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="grid aspect-square w-full place-items-center rounded-md border border-dashed border-line-strong bg-sunken text-ink-3 transition-colors hover:border-ink-3 hover:text-ink-2"
              >
                <span className="flex flex-col items-center gap-1 text-xs font-medium">
                  <CameraIcon />
                  Thêm
                </span>
              </button>
            </li>
          )}
        </ul>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          aria-label="Thêm ảnh"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []).slice(0, MAX - count);
            setFiles((x) => [...x, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
            e.target.value = "";
          }}
        />
      </section>

      <div>
        <label htmlFor="title" className="field-label">Tiêu đề</label>
        <input id="title" name="title" maxLength={80} required className="input" defaultValue={v.title} placeholder="VD: Giáo trình Calculus 2, còn mới" />
      </div>

      <fieldset>
        <legend className="field-label">Bạn muốn làm gì?</legend>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line-strong text-sm font-medium text-ink-2 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
            >
              <input type="radio" name="type" value={t.value} className="sr-only" checked={type === t.value} onChange={() => setType(t.value)} />
              {t.value === "sell" ? "Bán" : t.value === "exchange" ? "Trao đổi" : "Tặng miễn phí"}
            </label>
          ))}
        </div>
      </fieldset>

      {type === "sell" && (
        <div>
          <label htmlFor="price" className="field-label">Giá</label>
          <div className="relative">
            <input id="price" name="price" inputMode="numeric" className="input pr-10 tabular-nums" defaultValue={v.price} placeholder="50000" />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3">₫</span>
          </div>
        </div>
      )}
      {type === "exchange" && (
        <div>
          <label htmlFor="exchangeFor" className="field-label">Bạn muốn đổi lấy gì?</label>
          <input id="exchangeFor" name="exchangeFor" maxLength={200} className="input" defaultValue={v.exchangeFor} placeholder="VD: một chiếc đèn bàn, hoặc sách C++ bất kỳ" />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="field-label">Chuyên mục</label>
          <select id="category" name="category" defaultValue={v.category ?? ""} className="input" required>
            <option value="" disabled>Chọn…</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className="field-label">Tình trạng</label>
          <select id="condition" name="condition" defaultValue={v.condition ?? ""} className="input" required>
            <option value="" disabled>Chọn…</option>
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="field-label">Mô tả</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          required
          className="input resize-y"
          defaultValue={v.description}
          placeholder="Tình trạng món đồ, lý do bạn muốn trao lại, địa điểm gặp nhau tại cơ sở."
        />
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <SubmitButton className="btn btn-primary w-full md:w-auto md:px-8" pending="Đang lưu…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <li className="group relative aspect-square overflow-hidden rounded-md bg-sunken">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Xóa ảnh"
        className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-scrim text-white transition-colors hover:bg-scrim-strong"
      >
        <XIcon size={14} />
      </button>
    </li>
  );
}
