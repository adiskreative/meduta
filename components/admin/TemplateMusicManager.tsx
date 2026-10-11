"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, X, Music, Trash2 } from "lucide-react";
import {
  uploadTemplateMusic,
  removeTemplateMusic,
} from "@/lib/actions/upload";

/**
 * Kelola musik default template di admin panel:
 * unggah file musik, pratinjau, dan hapus.
 * URL langsung tersimpan di kolom defaultMusicUrl template.
 */
export default function TemplateMusicManager({
  templateId,
  defaultMusicUrl,
}: {
  templateId: string;
  defaultMusicUrl?: string | null;
}) {
  const [url, setUrl] = useState<string | null>(defaultMusicUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadTemplateMusic(templateId, formData);

      if (result.error || !result.url) {
        setStatus({ ok: false, text: result.error ?? "Upload gagal." });
        return;
      }

      setUrl(result.url);
      setStatus({ ok: true, text: "Musik default template tersimpan." });
    } catch {
      setStatus({ ok: false, text: "Terjadi kesalahan saat upload." });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setStatus(null);
    try {
      const result = await removeTemplateMusic(templateId);
      if (result.error) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      setUrl(null);
      setStatus({ ok: true, text: "Musik default dihapus." });
    } catch {
      setStatus({ ok: false, text: "Terjadi kesalahan saat menghapus." });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">
        Musik Default Template
      </h2>
      <p className="mb-4 text-sm text-zinc-500">
        Musik bawaan yang otomatis terpakai oleh undangan baru yang memilih
        template ini (pengguna tetap bisa menggantinya lewat dashboard mereka).
      </p>

      {url ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Music className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate text-xs text-zinc-500">{url}</span>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={url} preload="none" className="h-10 w-full max-w-md" />
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Hapus Musik Default
          </button>
        </div>
      ) : (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          Belum ada musik default. Unggah file untuk menambahkannya.
        </p>
      )}

      <div className="mt-4 border-t border-zinc-100 pt-4">
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
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {busy ? "Mengunggah..." : url ? "Ganti Musik" : "Tambah Musik"}
        </button>
        <p className="mt-1.5 text-[11px] text-zinc-400">
          MP3/WAV/OGG/M4A, maksimal 10MB. Tersimpan otomatis setelah terunggah.
        </p>

        {status && (
          <p
            className={`mt-2 flex items-center gap-1 text-xs ${
              status.ok ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {status.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {status.text}
          </p>
        )}
      </div>
    </div>
  );
}
