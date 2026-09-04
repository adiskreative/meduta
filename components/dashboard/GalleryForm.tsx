"use client";

import { useActionState, useState } from "react";
import { Save, Eye, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { saveGallery, GalleryState } from "@/lib/actions/content";

type GalleryItem = { id: string; url?: string; caption?: string };

export default function GalleryForm({
  invitationId,
  defaultGallery,
}: {
  invitationId: string;
  defaultGallery: GalleryItem[];
}) {
  const boundAction = saveGallery.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<GalleryState | undefined, FormData>(
    boundAction,
    undefined,
  );
  const [items, setItems] = useState<GalleryItem[]>(defaultGallery);

  function add() {
    setItems((prev) => [...prev, { id: crypto.randomUUID() }]);
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Galeri Foto</h2>
            <p className="text-sm text-zinc-500">
              Tambahkan tautan foto untuk galeri undangan.
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Plus className="h-4 w-4" />
            Tambah Foto
          </button>
        </div>

        {items.length === 0 && (
          <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Belum ada foto galeri. Klik {`"Tambah Foto"`} untuk menambahkan.
          </p>
        )}

        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <ImageIcon className="h-4 w-4 text-zinc-400" />
                  Foto galeri
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <input name="gallery.id[]" type="hidden" value={item.id} />
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  {item.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="mt-1 h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <input
                    name="gallery.url[]"
                    type="text"
                    placeholder="URL gambar (cth: https://images.com/foto.jpg)"
                    defaultValue={item.url ?? ""}
                    className={inputClass()}
                  />
                </div>
                <input
                  name="gallery.caption[]"
                  type="text"
                  placeholder="Keterangan (opsional)"
                  defaultValue={item.caption ?? ""}
                  className={inputClass()}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Galeri"}
        </button>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Eye className="h-4 w-4" />
          Preview
        </a>
      </div>
    </form>
  );
}
