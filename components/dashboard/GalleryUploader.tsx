"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, X, Image as ImageIcon } from "lucide-react";
import { uploadGalleryImage } from "@/lib/actions/upload";
import { compressImageForUpload } from "@/lib/image";

const MAX_SIZE_MB = 3;

export default function GalleryUploader({
  targetId,
}: {
  targetId: string; // id input gallery.url[] yang akan diisi
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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

      const result = await uploadGalleryImage(formData);

      if (result.error || !result.url) {
        setStatus({ ok: false, text: result.error ?? "Upload gagal." });
        URL.revokeObjectURL(objectUrl);
        setPreview(null);
        return;
      }

      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (input) input.value = result.url;

      setStatus({
        ok: true,
        text: wasCompressed
          ? `Foto dikompres otomatis (${(original.size / 1024 / 1024).toFixed(1)}MB → ${(file.size / 1024 / 1024).toFixed(2)}MB) dan berhasil diunggah.`
          : "Foto berhasil diunggah.",
      });
      setPreview(result.url);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setStatus({ ok: false, text: "Terjadi kesalahan saat upload." });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Pratinjau foto"
          className="h-12 w-12 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}

      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {busy ? "Mengunggah..." : "Unggah dari file"}
        </button>

        {status && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${
              status.ok ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {status.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {status.text}
          </p>
        )}

        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          JPG/PNG/WebP, maks {MAX_SIZE_MB}MB. Disarankan rasio potret <span className="font-medium text-zinc-500">4:5</span> (contoh: 960×1200px) — foto terpotong otomatis di tengah sesuai frame.
        </p>
      </div>
    </div>
  );
}