"use client";

import { useActionState, useState } from "react";
import { Save, Users } from "lucide-react";
import {
  createGuestsByShareToken,
  type ShareGuestsState,
} from "@/lib/actions/share";
import GuestLinksList from "@/components/dashboard/GuestLinksList";

/**
 * Generator link tamu massal pada panel /share — versi tanpa login:
 * otentikasi lewat shareToken, tanpa opsi kirim email.
 */
export default function ShareGuestsForm({
  shareToken,
  appUrl,
  savedGuests = [],
}: {
  shareToken: string;
  appUrl: string;
  savedGuests?: { id: string; name: string; uniqueLink: string }[];
}) {
  const boundAction = createGuestsByShareToken.bind(null, shareToken);
  const [state, formAction, isPending] = useActionState<
    ShareGuestsState | undefined,
    FormData
  >(boundAction, undefined);

  const [namesText, setNamesText] = useState("");

  // Sukses: kosongkan textarea; tamu baru digabung ke daftar riwayat.
  const lastSuccess = state?.success;
  const [clearedSuccess, setClearedSuccess] = useState(lastSuccess);
  if (lastSuccess && clearedSuccess !== lastSuccess) {
    setClearedSuccess(lastSuccess);
    setNamesText("");
  }

  const createdLinks = state?.createdGuests ?? [];
  const seenLinks = new Set<string>();
  const allGuests = [
    ...createdLinks.map((guest) => ({
      id: guest.uniqueLink + guest.name,
      name: guest.name,
      uniqueLink: guest.uniqueLink,
    })),
    ...savedGuests,
  ].filter((guest) => {
    if (seenLinks.has(guest.uniqueLink)) return false;
    seenLinks.add(guest.uniqueLink);
    return true;
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <Users className="h-5 w-5 text-rose-600" />
          Atur Nama Penerima Undangan
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Tulis satu nama per baris untuk membuat link undangan personal.
        </p>
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

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="appUrl" value={appUrl} />
        <div>
          <label
            htmlFor="share-names"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Nama penerima (pisahkan tiap baris)
          </label>
          <textarea
            id="share-names"
            name="names"
            rows={6}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder={"cth:\nBapak Ahmad & Ibu Siti\nRizky Pratama"}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
          {state?.errors?.names && (
            <p className="mt-1 text-xs text-red-600">{state.errors.names[0]}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Membuat..." : "Generate Link Undangan"}
        </button>
      </form>

      <div className="mt-6">
        <GuestLinksList guests={allGuests} appUrl={appUrl} />
      </div>
    </div>
  );
}
