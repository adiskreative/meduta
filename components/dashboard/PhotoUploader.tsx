"use client";

import { useRef, useState } from "react";
import { Upload, ImageIcon, Check, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/lib/actions/upload";

type Props = {
  fieldId: string; // id/name dari input photoUrl
  currentUrl?: string;
};

export default function PhotoUploader({ fieldId, currentUrl }: Props) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus(null);

    try {
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

      setStatus({ type: "success", text: "Foto berhasil diunggah." });
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
