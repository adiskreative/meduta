"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Save, Image } from "lucide-react";
import {
  createTemplate,
  updateTemplate,
  AdminTemplateState,
} from "@/lib/actions/admin-template";

export default function TemplateForm({
  mode,
  templateId,
  defaultValues,
}: {
  mode: "create" | "edit";
  templateId?: string;
  defaultValues?: {
    name: string;
    thumbnailUrl: string;
    componentKey: string;
    isPremium: boolean;
  };
}) {
  const action =
    mode === "edit" && templateId
      ? updateTemplate.bind(null, templateId)
      : createTemplate;

  const [state, formAction, isPending] = useActionState<
    AdminTemplateState | undefined,
    FormData
  >(action, undefined);

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Informasi Template
        </h2>

        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Nama template
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name}
          placeholder="cth: Classic Rose"
          className={inputClass(!!state?.errors?.name)}
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}

        <label
          htmlFor="componentKey"
          className="mb-1.5 mt-4 block text-sm font-medium text-zinc-700"
        >
          Component key
        </label>
        <input
          id="componentKey"
          name="componentKey"
          type="text"
          defaultValue={defaultValues?.componentKey}
          placeholder="cth: classic, minimal, floral"
          className={inputClass(!!state?.errors?.componentKey)}
        />
        <p className="mt-1.5 text-xs text-zinc-400">
          Penanda unik yang mengarah ke komponen React yang dirender (lihat
          registry di components/templates).
        </p>
        {state?.errors?.componentKey && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.componentKey[0]}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Tampilan</h2>

        <label
          htmlFor="thumbnailUrl"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          URL thumbnail
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">
            <Image className="h-4 w-4" />
          </span>
          <input
            id="thumbnailUrl"
            name="thumbnailUrl"
            type="url"
            defaultValue={defaultValues?.thumbnailUrl}
            placeholder="https://images.unsplash.com/..."
            className={inputClass(!!state?.errors?.thumbnailUrl)}
          />
        </div>
        {state?.errors?.thumbnailUrl && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.thumbnailUrl[0]}
          </p>
        )}

        {defaultValues?.thumbnailUrl && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Pratinjau thumbnail
            </p>
            <img
              src={defaultValues.thumbnailUrl}
              alt={defaultValues.name}
              className="h-40 w-full rounded-lg object-cover"
            />
          </div>
        )}

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-700">Template Premium</p>
            <p className="text-xs text-zinc-400">
              Ditandai sebagai template berbayar (logo premium).
            </p>
          </div>
          <input
            name="isPremium"
            type="checkbox"
            defaultChecked={defaultValues?.isPremium}
            className="h-5 w-5 rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending
            ? "Menyimpan..."
            : mode === "edit"
              ? "Simpan Perubahan"
              : "Buat Template"}
        </button>
        <Link
          href="/admin/templates"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
