"use client";

import { useActionState, useState } from "react";
import { Save, Trash2, Image as ImageIcon } from "lucide-react";
import {
  saveUserGatePhoto,
  BackgroundState,
} from "@/lib/actions/content";
import GalleryUploader from "./GalleryUploader";

/**
 * Form "Foto Gerbang" — pilihan user untuk foto khusus halaman
 * "Buka Undangan". Kosong = prioritas otomatis (foto admin/dekorasi →
 * foto mempelai → galeri pertama → bawaan template).
 *
 * Upload memakai GalleryUploader (action uploadGalleryImage); URL hasil
 * upload diterima lewat callback dan disimpan ke hidden input.
 */

export default function GatePhotoForm({
  invitationId,
  defaultGatePhoto,
  groomPhoto,
  bridePhoto,
  firstGallery,
}: {
  invitationId: string;
  defaultGatePhoto?: string;
  groomPhoto?: string;
  bridePhoto?: string;
  firstGallery?: string;
}) {
  const boundAction = saveUserGatePhoto.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<BackgroundState | undefined, FormData>(
    boundAction,
    undefined,
  );
  const [photoUrl, setPhotoUrl] = useState<string>(defaultGatePhoto ?? "");

  const effective = photoUrl || groomPhoto || bridePhoto || firstGallery;
  const source = photoUrl
    ? "Pilihan Anda"
    : groomPhoto
      ? "Foto mempelai pria"
      : bridePhoto
        ? "Foto mempelai wanita"
        : firstGallery
          ? "Galeri foto pertama"
          : "Bawaan template";

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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Foto Gerbang</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Foto yang tampil di halaman &quot;Buka Undangan&quot;. Rasio terbaik{" "}
            <strong>4:5 portrait</strong> (contoh 1080×1350px), JPG/PNG/WebP — foto
            di atas 3MB dikompres otomatis.
          </p>
        </div>

        {/* Pratinjau foto aktif + sumbernya */}
        <div className="mb-5 flex items-center gap-4 rounded-xl bg-zinc-50 p-4">
          <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {effective ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={effective}
                alt="Foto gerbang aktif"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-zinc-300" />
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Sedang tampil
            </p>
            <p className="text-sm font-medium text-zinc-800">{source}</p>
            {!photoUrl && effective && (
              <p className="mt-1 text-xs text-zinc-400">
                Otomatis — unggah foto sendiri untuk mengganti.
              </p>
            )}
          </div>
        </div>

        <input type="hidden" name="gatePhotoUrl" value={photoUrl} readOnly />
        <GalleryUploader
          targetId="gatePhotoUrl-hidden"
          onUploaded={(url) => setPhotoUrl(url)}
        />
        <input id="gatePhotoUrl-hidden" type="hidden" readOnly />

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Menyimpan..." : "Simpan Foto Gerbang"}
          </button>
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl("")}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <Trash2 className="h-4 w-4" />
              Pakai Otomatis
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
