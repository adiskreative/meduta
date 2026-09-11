"use client";

import { useState, useRef, useActionState } from "react";
import { Upload, Link2, Image as ImageIcon, FileIcon, X } from "lucide-react";
import {
  createAssetFromUpload,
  createAssetFromUrl,
  AdminAssetState,
} from "@/lib/actions/admin-asset";

const TYPE_OPTIONS = [
  { value: "IMAGE", label: "Gambar" },
  { value: "FRAME", label: "Bingkai" },
  { value: "DECOR", label: "Dekorasi / Bunga" },
  { value: "BACKGROUND", label: "Background" },
  { value: "MUSIC", label: "Musik" },
  { value: "GALLERY", label: "Galeri" },
];

export default function AssetForm() {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, uploadAction, uploadPending] = useActionState<
    AdminAssetState | undefined,
    FormData
  >(createAssetFromUpload, undefined);

  const [urlState, urlAction, urlPending] = useActionState<
    AdminAssetState | undefined,
    FormData
  >(createAssetFromUrl, undefined);

  const state = tab === "upload" ? uploadState : urlState;
  const isPending = tab === "upload" ? uploadPending : urlPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Nama aset
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="cth: Bunga mawar pojok kiri"
              className={inputClass(!!state?.errors?.name)}
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="type"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Tipe aset
            </label>
            <select
              id="type"
              name="type"
              defaultValue="IMAGE"
              className={inputClass(!!state?.errors?.type)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {state?.errors?.type && (
              <p className="mt-1 text-xs text-red-600">{state.errors.type[0]}</p>
            )}
          </div>
        </div>

        {tab === "upload" ? (
          <div>
            <label
              htmlFor="file"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              File
            </label>
            <input
              ref={fileInputRef}
              id="file"
              name="file"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="relative rounded-lg border border-zinc-300 bg-white p-3">
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
                {preview ? (
                  <img
                    src={preview}
                    alt={selectedFile.name}
                    className="mx-auto max-h-40 rounded object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <FileIcon className="h-5 w-5 text-zinc-400" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <label
                htmlFor="file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-sm text-zinc-500 transition hover:border-rose-300 hover:bg-rose-50"
              >
                <ImageIcon className="h-5 w-5" />
                <span>Klik untuk pilih file (maks 10MB)</span>
              </label>
            )}
            {state?.errors?.file && (
              <p className="mt-1 text-xs text-red-600">{state.errors.file[0]}</p>
            )}
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
              placeholder="https://cdn.example.com/aset.png"
              className={inputClass(!!state?.errors?.url)}
            />
            {state?.errors?.url && (
              <p className="mt-1 text-xs text-red-600">{state.errors.url[0]}</p>
            )}
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
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Aset"}
        </button>
      </form>
    </div>
  );
}
