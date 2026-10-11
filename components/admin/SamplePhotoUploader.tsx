"use client";

import { useRef, useState } from "react";
import { Upload, ImageIcon, Check, Loader2, X } from "lucide-react";
import { uploadTemplateSamplePhoto } from "@/lib/actions/upload";
import { compressImageForUpload } from "@/lib/image";

type Props = {
  /** id/name input tersembunyi yang diisi URL hasil upload */
  fieldId: string;
  /** URL foto contoh yang sedang aktif (override tersimpan atau bawaan) */
  currentUrl?: string;
  /** Opsional: dipanggil juga dengan URL hasil upload (untuk state React) */
  onUploaded?: (url: string) => void;
  /** Opsional: dipanggil saat foto dibersihkan (input dikosongkan) */
  onCleared?: () => void;
};

/**
 * Uploader foto mempelai contoh (khusus admin, halaman Data Contoh).
 * Menulis URL hasil upload ke input tersembunyi `fieldId` sehingga tetap
 * ikut tersimpan lewat tombol "Simpan Data Contoh" biasa.
 */
export default function SamplePhotoUploader({
  fieldId,
  currentUrl,
  onUploaded,
  onCleared,
}: Props) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [status, setStatus] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return;
    setBusy(true);
    setStatus(null);

    try {
      const file = await compressImageForUpload(original);
      const wasCompressed = file !== original;

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadTemplateSamplePhoto(formData);

      if (result.error || !result.url) {
        setStatus({ type: "error", text: result.error ?? "Upload gagal." });
        URL.revokeObjectURL(objectUrl);
        setPreview(currentUrl);
        return;
      }

      const input = document.getElementById(fieldId) as HTMLInputElement | null;
      if (input) input.value = result.url;
      onUploaded?.(result.url);

      setStatus({
        type: "success",
        text: wasCompressed
          ? `Foto dikompres otomatis (${(original.size / 1024 / 1024).toFixed(1)}MB → ${(file.size / 1024 / 1024).toFixed(2)}MB) dan berhasil diunggah — klik Simpan untuk menerapkan.`
          : "Foto berhasil diunggah — klik Simpan untuk menerapkan.",
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

  function handleClear() {
    const input = document.getElementById(fieldId) as HTMLInputElement | null;
    if (input) input.value = "";
    setPreview(undefined);
    setStatus(null);
    onCleared?.();
  }

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-4">
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Pratinjau foto contoh"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {busy ? "Mengunggah..." : preview ? "Ganti Foto" : "Unggah Foto"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-zinc-400 transition hover:text-red-600"
                title="Kosongkan kolom URL (kembali ke bawaan saat disimpan)"
              >
                <X className="h-3.5 w-3.5" />
                Kosongkan
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          <p className="mt-1 text-xs text-zinc-400">
            URL foto otomatis terisi setelah unggah.
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">Ketentuan foto:</span>{" "}
        JPG/PNG/WebP/GIF, maksimal 3MB (di atas itu dikompres otomatis).
        Disarankan <span className="font-medium text-zinc-600">persegi 1:1</span>{" "}
        (contoh: 800×800px), wajah di tengah — foto tampil bulat.
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
