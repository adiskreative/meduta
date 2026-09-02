"use client";

import { useActionState, useState } from "react";
import { Save, Copy, Check, Link2, Upload } from "lucide-react";
import { createGuests, GuestState } from "@/lib/actions/guest";

export default function SendInvitationForm({
  invitationId,
  appUrl,
}: {
  invitationId: string;
  appUrl: string;
}) {
  const boundAction = createGuests.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<GuestState | undefined, FormData>(
    boundAction,
    undefined,
  );
  const [namesText, setNamesText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(link);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  const createdLinks = state?.createdGuests ?? [];

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
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Daftar Nama Tamu
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Tulis satu nama per baris. Sistem akan membuat link unik untuk setiap tamu.
        </p>

        <label htmlFor="names" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Nama tamu (pisahkan tiap baris)
        </label>
        <textarea
          id="names"
          name="names"
          rows={8}
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          placeholder={"cth:\nBapak Ahmad & Ibu Siti\nRizky Pratama\nSari Dewi"}
          className={inputClass(!!state?.errors?.names)}
        />
        {state?.errors?.names && (
          <p className="mt-1 text-xs text-red-600">{state.errors.names[0]}</p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Membuat..." : "Generate Link Undangan"}
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-400"
            title="Import CSV/Excel tersedia di versi berikutnya"
          >
            <Upload className="h-4 w-4" />
            Import CSV/Excel
          </button>
        </div>
      </div>

      {(createdLinks.length > 0) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Link2 className="h-4 w-4" />
            Link Undangan Terbuat
          </h2>
          <div className="space-y-2">
            {createdLinks.map((guest) => {
              const full = `${appUrl}/u/${guest.uniqueLink}`;
              return (
                <div
                  key={guest.uniqueLink + guest.name}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{guest.name}</p>
                    <p className="truncate text-xs text-zinc-500">{full}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyLink(full)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    {copied === full ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied === full ? "Tersalin" : "Salin"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}