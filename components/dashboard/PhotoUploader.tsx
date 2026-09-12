"use client";

import { useRef, useState } from "react";
import { Upload, ImageIcon, Check, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/lib/actions/upload";
import { compressImageForUpload } from "@/lib/image";

type Props = {
  fieldId: string; // id/name dari input photoUrl
  currentUrl?: string;
};

const MAX_SIZE_MB = 3;

export default function PhotoUploader({ fieldId, currentUrl }: Props) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return;
    setBusy(true);
    setStatus(null);

    try {
      // Kompres otomatis bila file di atas batas (mis. foto kamera HP 4-8MB)
      const file = await compressImageForUpload(original);
      const wasCompressed = file !== original;

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAvatar(formData);

      if (result.error || !result.url) {
        setStatus({ type: "error", text: result.error ?? "Upload gagal." });
        URL.revokeObjectURL(objectUrl);
        setPreview(currentUrl);
        return;
      }

      const input = document.getElementById(fieldId) as HTMLInputElement | null;
      if (input) input.value = result.url;

      setStatus({
        type: "success",
        text: wasCompressed
          ? `Foto dikompres otomatis (${(original.size / 1024 / 1024).toFixed(1)}MB → ${(file.size / 1024 / 1024).toFixed(2)}MB) dan berhasil diunggah.`
          : "Foto berhasil diunggah.",
      });
      setPreview(result.url);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setStatus({ type: "error", text: "Terjadi kesalahan saat upload." });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-4">
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Pratinjau foto"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}

        <div className="flex-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Mengunggah..." : "Unggah Foto"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          {currentUrl && (
            <p className="mt-1 text-xs text-zinc-400">Klik untuk mengganti foto.</p>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">Ketentuan foto:</span> format
        JPG/PNG/WebP, maksimal {MAX_SIZE_MB}MB. Disarankan <span className="font-medium text-zinc-600">persegi 1:1</span> (contoh: 800×800px)
        dengan wajah di tengah — foto tampil bulat dan terpotong otomatis di tengah.
      </p>

      {status && (
        <p
          className={`mt-2 flex items-center gap-1 text-xs ${
            status.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {status.type === "success" ? <Check className="h-3.5 w-3.5" /> : null}
          {status.text}
        </p>
      )}
    </div>
  );
}
