"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addDecoration, AdminDecorationState } from "@/lib/actions/admin-decoration";

export default function DecorationForm({
  templateId,
  assets,
}: {
  templateId: string;
  assets: { id: string; name: string; type: string }[];
}) {
  const boundAction = addDecoration.bind(null, templateId);
  const [state, formAction, isPending] = useActionState<
    AdminDecorationState | undefined,
    FormData
  >(boundAction, undefined);

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Tambah Dekorasi</h2>

      <p className="mb-4 rounded-lg bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-zinc-500">
        Layer <strong>Background</strong> mengganti foto latar template (cover &amp;
        gerbang "Buka Undangan") — posisi/ukuran tidak diperlukan. Layer{" "}
        <strong>Bingkai</strong> otomatis membungkus area sesuai Penempatan
        (Cover = hero atas, Section = kolom konten). Layer <strong>Dekorasi</strong>{" "}
        mengambang dan perlu posisi/ukuran manual.
      </p>

      {state?.message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="assetId"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Pilih aset
          </label>
          <select
            id="assetId"
            name="assetId"
            required
            className={inputClass(!!state?.errors?.assetId)}
          >
            <option value="">-- Pilih aset --</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.type})
              </option>
            ))}
          </select>
          {state?.errors?.assetId && (
            <p className="mt-1 text-xs text-red-600">{state.errors.assetId[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="placement"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Penempatan
            </label>
            <select
              id="placement"
              name="placement"
              defaultValue="floating"
              className={inputClass()}
            >
              <option value="floating">Floating (mengambang)</option>
              <option value="cover">Cover</option>
              <option value="section">Section</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="layer"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Layer
            </label>
            <select
              id="layer"
              name="layer"
              defaultValue="decor"
              className={inputClass()}
            >
              <option value="decor">Dekorasi</option>
              <option value="frame">Bingkai</option>
              <option value="background">Background (ganti foto latar)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label
              htmlFor="zIndex"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              z-index
            </label>
            <input
              id="zIndex"
              name="zIndex"
              type="number"
              defaultValue={1}
              min={0}
              max={1000}
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor="rotated"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Rotasi (derajat)
            </label>
            <input
              id="rotated"
              name="rotated"
              type="number"
              step="any"
              min={-360}
              max={360}
              placeholder="0"
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor="positionX"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Posisi X
            </label>
            <input
              id="positionX"
              name="positionX"
              type="number"
              placeholder="0"
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor="positionY"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Posisi Y
            </label>
            <input
              id="positionY"
              name="positionY"
              type="number"
              placeholder="0"
              className={inputClass()}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="width"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Lebar (px)
            </label>
            <input
              id="width"
              name="width"
              type="number"
              min={1}
              placeholder="100"
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor="height"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Tinggi (px)
            </label>
            <input
              id="height"
              name="height"
              type="number"
              min={1}
              placeholder="100"
              className={inputClass()}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Tambah Dekorasi"}
        </button>
      </form>
    </div>
  );
}
