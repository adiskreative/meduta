"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, X, Music } from "lucide-react";
import { uploadMusic } from "@/lib/actions/upload";

/**
 * Tombol unggah file musik dari komputer.
 * Setelah berhasil, input (by id) diisi URL publik file di Supabase Storage,
 * dan pratinjau pemutar audio kecil ditampilkan.
 */
export default function MusicUploader({
  targetId,
  initialUrl,
}: {
  targetId: string; // id input musicUrl yang akan diisi
  initialUrl?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadMusic(formData);

      if (result.error || !result.url) {
        setStatus({ ok: false, text: result.error ?? "Upload gagal." });
        return;
      }

      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (input) input.value = result.url;

      setPreviewUrl(result.url);
      setStatus({ ok: true, text: "Musik berhasil diunggah — jangan lupa simpan." });
    } catch {
      setStatus({ ok: false, text: "Terjadi kesalahan saat upload." });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
          <Music className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-[220px]">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac"
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
            {busy ? "Mengunggah..." : "Unggah musik dari file"}
          </button>
          <p className="mt-1 text-[11px] text-zinc-400">
            MP3/WAV/OGG/M4A, maksimal 10MB.
          </p>

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
        </div>
      </div>

      {previewUrl && (
        <audio
          controls
          src={previewUrl}
          className="h-10 w-full max-w-md"
          preload="none"
        />
      )}
    </div>
  );
}
