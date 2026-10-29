"use client";

import { useRef, useState, useActionState } from "react";
import {
  Upload,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  Trash2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  saveUserBackground,
  BackgroundState,
} from "@/lib/actions/content";
import { uploadInvitationBackground } from "@/lib/actions/upload";
import { compressImageForUpload } from "@/lib/image";

/**
 * Form background undangan milik user (per-undangan, bukan per-template):
 * - Upload foto dari perangkat (dikompres otomatis bila > 3MB) atau isi URL
 * - Pratinjau rasio 9:16 seperti layar undangan
 * - Simpan → langsung dipakai di cover & gerbang undangan
 * - Hapus → kembali ke background template
 */
export default function BackgroundForm({
  invitationId,
  defaultBackgroundUrl,
}: {
  invitationId: string;
  defaultBackgroundUrl: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(defaultBackgroundUrl || null);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState<BackgroundState | undefined, FormData>(
    async (prev, formData) => {
      const result = await saveUserBackground(invitationId, prev, formData);
      if (result.success) router.refresh();
      return result;
    },
    undefined,
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploading(true);
    setUploadStatus(null);

    try {
      // Kompres otomatis bila file di atas batas (mis. foto kamera HP 4-8MB)
      const file = await compressImageForUpload(original);
      const wasCompressed = file !== original;

      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadInvitationBackground(formData);

      if (result.error || !result.url) {
        setUploadStatus({ ok: false, text: result.error ?? "Upload gagal." });
        return;
      }

      // Isi otomatis kolom URL + pratinjau — user tinggal klik Simpan
      const input = document.getElementById("backgroundUrl") as HTMLInputElement | null;
      if (input) input.value = result.url;
      setPreview(result.url);
      setUploadStatus({
        ok: true,
        text: wasCompressed
          ? `Foto dikompres otomatis (${(original.size / 1024 / 1024).toFixed(1)}MB → ${(file.size / 1024 / 1024).toFixed(2)}MB). Klik Simpan untuk memakai.`
          : "Foto terunggah. Klik Simpan untuk memakai.",
      });
      router.refresh();
    } catch {
      setUploadStatus({ ok: false, text: "Terjadi kesalahan saat upload." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const clearBackground = async () => {
    setRemoving(true);
    try {
      const formData = new FormData();
      formData.append("backgroundUrl", "");
      await saveUserBackground(invitationId, undefined, formData);
      const input = document.getElementById("backgroundUrl") as HTMLInputElement | null;
      if (input) input.value = "";
      setPreview(null);
      setUploadStatus({ ok: true, text: "Background dihapus - kembali ke bawaan template." });
      router.refresh();
    } catch {
      setUploadStatus({ ok: false, text: "Gagal menghapus background." });
    } finally {
      setRemoving(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <form action={formAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Background Undangan</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Foto latar untuk cover &amp; gerbang undangan Anda. Bersifat per-undangan -
            tidak mengganggu undangan user lain.
          </p>
        </div>

        {state?.message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {state.message}
          </div>
        )}

        {/* Upload dari perangkat */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Unggah foto dari perangkat
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Mengunggah..." : "Pilih Foto"}
          </button>
          {uploadStatus && (
            <p
              className={`mt-1.5 flex items-start gap-1 text-xs ${
                uploadStatus.ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {uploadStatus.ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
              {uploadStatus.text}
            </p>
          )}
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            JPG/PNG/WebP, otomatis dikompres bila lebih dari 3MB. Disarankan rasio potret{" "}
            <span className="font-medium text-zinc-500">9:16</span> (contoh: 1080×1920px) -
            pas penuh dengan layar undangan.
          </p>
        </div>

        {/* Atau URL langsung */}
        <div>
          <label htmlFor="backgroundUrl" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Atau tempel URL foto
          </label>
          <input
            id="backgroundUrl"
            name="backgroundUrl"
            type="url"
            defaultValue={defaultBackgroundUrl}
            placeholder="https://... (kosongkan untuk memakai bawaan template)"
            className={inputClass(!!state?.errors?.backgroundUrl)}
          />
          {state?.errors?.backgroundUrl && (
            <p className="mt-1 text-xs text-red-600">{state.errors.backgroundUrl[0]}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Menyimpan..." : "Simpan Background"}
          </button>
          {defaultBackgroundUrl && (
            <button
              type="button"
              onClick={clearBackground}
              disabled={removing}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {removing ? "Menghapus..." : "Hapus - pakai bawaan template"}
            </button>
          )}
        </div>
      </form>

      {/* Pratinjau 9:16 seperti layar undangan */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-zinc-900">Pratinjau</p>
        <div className="mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl border-4 border-zinc-900 bg-zinc-100 shadow-xl">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau background" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-zinc-400">
              <ImageIcon className="h-8 w-8" />
              <p className="text-xs leading-relaxed">
                Belum ada background kustom - undangan memakai latar bawaan template.
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-zinc-400">
          Cover &amp; gerbang “Buka Undangan” akan memakai foto ini, dilapisi gradasi warna
          template agar teks tetap terbaca.
        </p>
      </div>
    </div>
  );
}
