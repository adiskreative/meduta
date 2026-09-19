"use client";

import { useActionState, useState } from "react";
import { Save, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import {
  saveTemplateGallery,
  saveTemplateGatePhoto,
  TemplateGalleryState,
} from "@/lib/actions/admin-template-gallery";
import SamplePhotoUploader from "./SamplePhotoUploader";

/**
 * Panel kelola Galeri & Foto Gerbang pada template (khusus admin).
 * Dipasang di Admin → Kelola Template → Dekorasi (berdampingan dengan
 * form dekorasi biasa).
 *
 * - Galeri template: foto contoh yang tampil di section galeri pratinjau
 *   (sampleData.gallery) + fallback foto gerbang.
 * - Foto gerbang template: foto khusus halaman "Buka Undangan"
 *   (sampleData.gatePhotoUrl). Pilihan user selalu menang atas ini.
 */

type Item = { id: string; url: string; caption?: string };

export default function TemplateGalleryManager({
  templateId,
  defaultGallery,
  defaultGatePhoto,
}: {
  templateId: string;
  defaultGallery: Item[];
  defaultGatePhoto?: string;
}) {
  const boundGallery = saveTemplateGallery.bind(null, templateId);
  const boundGate = saveTemplateGatePhoto.bind(null, templateId);
  const [galleryState, galleryAction, galleryPending] = useActionState<
    TemplateGalleryState | undefined,
    FormData
  >(boundGallery, undefined);
  const [gateState, gateAction, gatePending] = useActionState<
    TemplateGalleryState | undefined,
    FormData
  >(boundGate, undefined);

  const [items, setItems] = useState<Item[]>(
    defaultGallery.length > 0
      ? defaultGallery
      : [{ id: "slot-1", url: "" }],
  );

  function add() {
    setItems((prev) => [...prev, { id: `slot-${Date.now()}`, url: "" }]);
  }
  function remove(id: string) {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((i) => i.id !== id) : [{ id: "slot-1", url: "" }],
    );
  }
  function setUrl(id: string, url: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, url } : i)));
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

  return (
    <div className="space-y-6">
      {/* --- Galeri template --- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Galeri Template
          </h2>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Plus className="h-4 w-4" />
            Tambah Foto
          </button>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-zinc-500">
          Foto contoh yang tampil di section galeri pratinjau template ini — juga
          jadi cadangan foto gerbang bila foto gerbang dikosongkan. Upload langsung
          atau tempel URL (rasio terbaik 4:5 portrait, JPG/WebP, maks 3MB).
        </p>

        {galleryState?.message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              galleryState.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {galleryState.message}
          </div>
        )}

        <form action={galleryAction} className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <ImageIcon className="h-4 w-4 text-zinc-400" />
                  Foto {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="hidden"
                name="gallery.url[]"
                value={item.url}
                readOnly
              />
              <SamplePhotoUploader
                fieldId={`gallery-preview-${item.id}`}
                currentUrl={item.url}
                onUploaded={(url) => setUrl(item.id, url)}
                onCleared={() => setUrl(item.id, "")}
              />
              <input
                name="gallery.caption[]"
                placeholder="Keterangan (opsional)"
                defaultValue={item.caption ?? ""}
                className={`${inputClass} mt-3`}
                maxLength={120}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={galleryPending}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {galleryPending ? "Menyimpan..." : "Simpan Galeri"}
          </button>
        </form>
      </div>

      {/* --- Foto gerbang template --- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Foto Gerbang Template
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-zinc-500">
          Foto khusus halaman &quot;Buka Undangan&quot; semua undangan yang memakai
          template ini. Bila dikosongkan: pakai foto mempelai → galeri pertama →
          foto bawaan template. Pilihan foto gerbang dari user selalu menang atas
          nilai ini.
        </p>

        {gateState?.message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              gateState.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {gateState.message}
          </div>
        )}

        <form action={gateAction} className="space-y-3">
          <input
            type="hidden"
            id={`gate-${templateId}`}
            name="gatePhotoUrl"
            defaultValue={defaultGatePhoto ?? ""}
          />
          <SamplePhotoUploader
            fieldId={`gate-${templateId}`}
            currentUrl={defaultGatePhoto}
          />
          <button
            type="submit"
            disabled={gatePending}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {gatePending ? "Menyimpan..." : "Simpan Foto Gerbang"}
          </button>
        </form>
      </div>
    </div>
  );
}
