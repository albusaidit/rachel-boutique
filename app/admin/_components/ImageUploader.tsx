"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export function ImageUploader({
  name,
  value,
  onChange,
  max = 8,
}: {
  name: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (files: FileList) => {
    setError(null);
    const remaining = Math.max(0, max - value.length);
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return;

    setBusy(true);
    setProgress(0);
    const next = [...value];

    for (let i = 0; i < list.length; i++) {
      try {
        const fd = new FormData();
        fd.append("file", list[i]);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 503 && body.error === "blob_not_configured") {
            setError(
              "Image uploads aren't configured. Enable a Blob store on Vercel: Storage → Blob → Create.",
            );
          } else if (body.error) {
            setError(`Upload failed: ${body.error}`);
          } else {
            setError("Upload failed");
          }
          break;
        }
        const data = await res.json();
        if (data.url) next.push(data.url);
        setProgress(i + 1);
        onChange([...next]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((url, idx) => (
        <input key={`${name}-${idx}`} type="hidden" name={`${name}[]`} value={url} />
      ))}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`cursor-pointer border-2 border-dashed rounded-md px-4 py-8 text-center transition-colors ${
          dragOver
            ? "border-[var(--a-accent)] bg-[var(--a-line-soft)]"
            : "border-[var(--a-line)] hover:border-[var(--a-ink-faint)]"
        } ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
          }}
        />
        <div className="flex flex-col items-center gap-2 text-[var(--a-ink-muted)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3v12" strokeLinecap="round" />
          </svg>
          <div className="text-sm font-medium text-[var(--a-ink)]">
            {busy
              ? `Uploading ${progress}/${Math.min(max - value.length, 99)}…`
              : "Drop images here or click to choose"}
          </div>
          <div className="text-xs">
            JPEG, PNG, WebP, AVIF or GIF · up to 8 MB · {value.length}/{max} used
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-[var(--a-danger)] bg-[var(--a-danger-bg)] border border-[var(--a-danger-line)] px-3 py-2 rounded-sm">
          {error}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div
              key={url + idx}
              className="relative group aspect-[3/4] bg-[var(--a-line-soft)] overflow-hidden rounded-sm border border-[var(--a-line)]"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 200px"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    className="bg-white/90 text-black w-7 h-7 rounded-sm text-sm flex items-center justify-center disabled:opacity-30"
                    aria-label="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === value.length - 1}
                    className="bg-white/90 text-black w-7 h-7 rounded-sm text-sm flex items-center justify-center disabled:opacity-30"
                    aria-label="Move right"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="bg-[var(--a-danger)] text-white w-7 h-7 rounded-sm text-sm flex items-center justify-center"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              {idx === 0 && (
                <span className="absolute top-1 start-1 bg-[var(--a-accent)] text-[var(--a-accent-fg)] text-[10px] px-1.5 py-0.5 rounded-sm font-semibold">
                  COVER
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
