"use client";

import { useActionState } from "react";
import { Save, Eye, Link2 } from "lucide-react";
import { saveGeneralSettings, GeneralState } from "@/lib/actions/general";

export default function GeneralSettingsForm({
  invitationId,
  defaultEventName,
  defaultSlug,
  slugChangeCount,
  defaultCustomMessage,
}: {
  invitationId: string;
  defaultEventName: string;
  defaultSlug: string;
  slugChangeCount: number;
  defaultCustomMessage: string;
}) {
  const boundAction = saveGeneralSettings.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<GeneralState | undefined, FormData>(
    boundAction,
    undefined,
  );

  const slugRemaining = 3 - slugChangeCount;
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
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Nama Acara</h2>
        <label
          htmlFor="eventName"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Nama acara / undangan
        </label>
        <input
          id="eventName"
          name="eventName"
          type="text"
          defaultValue={defaultEventName}
          placeholder="cth: Pernikahan Rizky & Maharani"
          className={inputClass(!!state?.errors?.eventName)}
        />
        {state?.errors?.eventName && (
          <p className="mt-1 text-xs text-red-600">{state.errors.eventName[0]}</p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Link / URL Undangan
        </h2>
        <p className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
          <Link2 className="h-4 w-4" />
          meduta.com/{defaultSlug}
        </p>

        {slugRemaining > 0 ? (
          <>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Slug undangan
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">meduta.com/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={defaultSlug}
                className={inputClass(!!state?.errors?.slug)}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Sisa kesempatan ganti link: {slugRemaining}x
            </p>
            {state?.errors?.slug && (
              <p className="mt-1 text-xs text-red-600">{state.errors.slug[0]}</p>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Link undangan: <span className="font-medium">meduta.com/{defaultSlug}</span>.
            Batas ganti link (3x) sudah habis.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Pesan / Ucapan di Undangan
        </h2>
        <label
          htmlFor="customMessage"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Pesan custom (opsional)
        </label>
        <textarea
          id="customMessage"
          name="customMessage"
          rows={3}
          defaultValue={defaultCustomMessage}
          placeholder="Tulis sambutan atau pesan khusus untuk tamu..."
          className={inputClass(!!state?.errors?.customMessage)}
        />
        {state?.errors?.customMessage && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.customMessage[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
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