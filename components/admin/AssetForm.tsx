"use client";

import { useState, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Link2, Image as ImageIcon, FileIcon, Music, X } from "lucide-react";
import {
  createAssetFromUpload,
  createAssetFromUrl,
  AdminAssetState,
} from "@/lib/actions/admin-asset";
import {
  chunkMusicFiles,
  MAX_ASSET_FILE_MB,
  MAX_MUSIC_FILES_PER_UPLOAD,
  validateAssetFile,
} from "@/lib/asset-limits";

type MusicUploadResponse = {
  success: boolean;
  message?: string;
  uploadedNames?: string[];
  errors?: string[];
};

const DESIGN_TYPE_OPTIONS = [
  { value: "IMAGE", label: "Gambar" },
  { value: "FRAME", label: "Bingkai" },
  { value: "DECOR", label: "Dekorasi / Bunga" },
  { value: "BACKGROUND", label: "Background" },
  { value: "GALLERY", label: "Galeri" },
];

type AssetFormVariant = "design" | "music";

const formatFileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/**
 * Form tambah aset. Varian "design" dipakai di /admin/assets,
 * varian "music" dipakai di /admin/music — tipe aset dikunci agar
 * aset desain dan musik tidak tercampur di satu halaman.
 * Varian musik menerima beberapa file sekaligus (unggah batch).
 */
export default function AssetForm({
  variant = "design",
}: {
  variant?: AssetFormVariant;
}) {
  const isMusic = variant === "music";
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [ignoredFileCount, setIgnoredFileCount] = useState(0);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Samakan state pilihan file dengan isi input agar yang terkirim konsisten. */
  const syncSelectedFiles = (nextFiles: File[]) => {
    setSelectedFiles(nextFiles);
    setPreview(null);
    if (!fileInputRef.current) return;

    if (nextFiles.length === 0) {
      fileInputRef.current.value = "";
      return;
    }
    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    fileInputRef.current.files = transfer.files;
  };

  /** Bersihkan semua pesan validasi pilihan file. */
  const resetFileNotices = () => {
    setIgnoredFileCount(0);
    setRejectedFiles([]);
  };

  const [uploadState, uploadAction, uploadPending] = useActionState<
    AdminAssetState | undefined,
    FormData
  >(async (previousState, formData) => {
    const type = String(formData.get("type") ?? "IMAGE");

    // Aset desain tetap satu file — langsung diteruskan ke server action.
    if (type !== "MUSIC") {
      const result = await createAssetFromUpload(previousState, formData);
      if (result.success) {
        syncSelectedFiles([]);
        resetFileNotices();
      }
      return result;
    }

    const files = formData
      .getAll("file")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      return { errors: { file: ["Pilih file terlebih dahulu."] } };
    }

    // Musik diunggah lewat route handler /api (bukan server action) supaya
    // body tidak ikut dibuffer & dipotong oleh proxy di /admin.
    const uploadedNames: string[] = [];
    const failures: string[] = [];

    for (const chunk of chunkMusicFiles(files)) {
      const body = new FormData();
      chunk.forEach((file) => body.append("file", file));

      try {
        const response = await fetch("/api/admin/music/upload", {
          method: "POST",
          body,
        });
        const data = (await response.json().catch(() => null)) as
          | MusicUploadResponse
          | null;

        if (!response.ok) {
          failures.push(
            ...(data?.errors?.length
              ? data.errors
              : [`Gagal mengunggah ${chunk.length} file musik.`]),
          );
          continue;
        }

        uploadedNames.push(...(data?.uploadedNames ?? []));
        failures.push(...(data?.errors ?? []));
      } catch {
        failures.push(
          `Gagal menghubungi server saat mengunggah ${chunk.length} file musik.`,
        );
      }
    }

    // Sisakan file yang gagal supaya bisa dicoba ulang tanpa duplikat.
    const uploaded = new Set(uploadedNames);
    syncSelectedFiles(files.filter((file) => !uploaded.has(file.name)));
    resetFileNotices();

    if (uploadedNames.length > 0) router.refresh();

    if (uploadedNames.length === 0) {
      return { errors: { file: failures }, success: false, uploadedNames: [] };
    }

    const failureNote =
      failures.length > 0 ? ` ${failures.length} file gagal: ${failures.join(" ")}` : "";
    return {
      success: failures.length === 0,
      message: `${uploadedNames.length} musik berhasil diunggah.${failureNote}`,
      uploadedNames,
    };
  }, undefined);

  const [urlState, urlAction, urlPending] = useActionState<
    AdminAssetState | undefined,
    FormData
  >(createAssetFromUrl, undefined);

  const state = tab === "upload" ? uploadState : urlState;
  const isPending = tab === "upload" ? uploadPending : urlPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Musik: potong ke batas pilihan. Desain: hanya file pertama.
    const limited = isMusic
      ? files.slice(0, MAX_MUSIC_FILES_PER_UPLOAD)
      : files.slice(0, 1);

    // Validasi di klien supaya file kebesaran/format salah tidak pernah dikirim.
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of limited) {
      const error = validateAssetFile(file, isMusic ? "MUSIC" : "IMAGE");
      if (error) rejected.push(error);
      else accepted.push(file);
    }

    syncSelectedFiles(accepted);
    setIgnoredFileCount(files.length - limited.length);
    setRejectedFiles(rejected);

    const first = accepted[0];
    if (!isMusic && first?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(first);
    }
  };

  const clearFiles = () => {
    syncSelectedFiles([]);
    resetFileNotices();
  };

  const removeFile = (index: number) => {
    syncSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-5 flex gap-1 rounded-lg bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "upload"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "url"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Link2 className="h-4 w-4" />
          Dari URL
        </button>
      </div>

      {state?.message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <form
        action={tab === "upload" ? uploadAction : urlAction}
        className="space-y-4"
      >
        <div>
          {isMusic ? (
            <input type="hidden" name="type" value="MUSIC" />
          ) : (
            <>
              <label
                htmlFor="type"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Kategori aset
              </label>
              <select
                id="type"
                name="type"
                defaultValue="IMAGE"
                className={`${inputClass(!!state?.errors?.type)} sm:max-w-xs`}
              >
                {DESIGN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {state?.errors?.type && (
                <p className="mt-1 text-xs text-red-600">{state.errors.type[0]}</p>
              )}
            </>
          )}
          <p className="mt-1.5 text-xs text-zinc-400">
            Nama aset dibuat otomatis dari nama file/URL - tidak perlu menulis judul.
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          multiple={isMusic}
          accept={isMusic ? "audio/*" : "image/*"}
          disabled={tab !== "upload"}
          className="hidden"
          onChange={handleFileChange}
        />

        {tab === "upload" ? (
          <div>
            <label
              htmlFor="file"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              {isMusic ? "File musik" : "File"}
            </label>
            {selectedFiles.length > 0 ? (
              isMusic ? (
                <div className="rounded-lg border border-zinc-300 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-700">
                      {selectedFiles.length} file dipilih
                    </p>
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label="Hapus semua file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="mt-1 divide-y divide-zinc-100">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${file.lastModified}`}
                        className="flex items-center justify-between gap-2 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Music className="h-4 w-4 shrink-0 text-zinc-400" />
                          <span className="truncate text-sm text-zinc-600">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-zinc-400">
                            {formatFileSize(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                            aria-label={`Hapus ${file.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-zinc-400">
                    Total{" "}
                    {formatFileSize(
                      selectedFiles.reduce((total, file) => total + file.size, 0),
                    )}{" "}
                    — semua file akan diunggah sekaligus.
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg border border-zinc-300 bg-white p-3">
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {preview ? (
                    <img
                      src={preview}
                      alt={selectedFiles[0].name}
                      className="mx-auto max-h-40 rounded object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <FileIcon className="h-5 w-5 text-zinc-400" />
                      <span className="truncate">{selectedFiles[0].name}</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">
                    {formatFileSize(selectedFiles[0].size)}
                  </p>
                </div>
              )
            ) : (
              <label
                htmlFor="file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 transition hover:border-rose-300 hover:bg-rose-50"
              >
                {isMusic ? (
                  <Music className="h-5 w-5 shrink-0" />
                ) : (
                  <ImageIcon className="h-5 w-5 shrink-0" />
                )}
                <span>
                  {isMusic
                    ? `Klik untuk pilih beberapa file musik sekaligus (maks ${MAX_MUSIC_FILES_PER_UPLOAD} file, @${MAX_ASSET_FILE_MB}MB)`
                    : `Klik untuk pilih file (maks ${MAX_ASSET_FILE_MB}MB)`}
                </span>
              </label>
            )}
            {isMusic && ignoredFileCount > 0 && (
              <p className="mt-1 text-xs text-amber-600">
                {ignoredFileCount} file lainnya diabaikan karena batas{" "}
                {MAX_MUSIC_FILES_PER_UPLOAD} file per unggah.
              </p>
            )}
            {rejectedFiles.map((error) => (
              <p key={error} className="mt-1 text-xs text-amber-600">
                {error}
              </p>
            ))}
            {state?.errors?.file?.map((error) => (
              <p key={error} className="mt-1 text-xs text-red-600">
                {error}
              </p>
            ))}
          </div>
        ) : (
          <div>
            <label
              htmlFor="url"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              URL aset
            </label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder={
                isMusic
                  ? "https://cdn.example.com/musik.mp3"
                  : "https://cdn.example.com/aset.png"
              }
              className={inputClass(!!state?.errors?.url)}
            />
            {state?.errors?.url && (
              <p className="mt-1 text-xs text-red-600">{state.errors.url[0]}</p>
            )}
            {!isMusic && (
              <>
                <label
                  htmlFor="thumbnail"
                  className="mb-1.5 mt-4 block text-sm font-medium text-zinc-700"
                >
                  URL thumbnail (opsional)
                </label>
                <input
                  id="thumbnail"
                  name="thumbnail"
                  type="url"
                  placeholder="https://cdn.example.com/thumb.png"
                  className={inputClass(!!state?.errors?.thumbnail)}
                />
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {isPending ? "Menyimpan..." : isMusic ? "Simpan Musik" : "Simpan Aset"}
        </button>
      </form>
    </div>
  );
}
