"use client";

import { useActionState } from "react";
import { Save, Eye, Music } from "lucide-react";
import { saveMusic, MusicState } from "@/lib/actions/content";

export default function MusicForm({
  invitationId,
  defaultMusicUrl,
}: {
  invitationId: string;
  defaultMusicUrl: string;
}) {
  const boundAction = saveMusic.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<MusicState | undefined, FormData>(
    boundAction,
    undefined,
  );

  const inputClass = (hasError: boolean) =>
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
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Musik Latar</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Atur lagu yang diputar saat tamu membuka undangan Anda.
        </p>

        <label
          htmlFor="musicUrl"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          URL musik / audio
        </label>
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            id="musicUrl"
            name="musicUrl"
            type="text"
            defaultValue={defaultMusicUrl}
            placeholder="https://cdn.example.com/lagu.mp3"
            className={inputClass(!!state?.errors?.musicUrl)}
          />
        </div>
        {state?.errors?.musicUrl && (
          <p className="mt-1 text-xs text-red-600">{state.errors.musicUrl[0]}</p>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          Kosongkan untuk menghapus musik latar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Musik Latar"}
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
