"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitWish, WishState } from "@/lib/actions/wish";

type Props = {
  invitationId: string;
  accentClass?: string;
  borderClass?: string;
};

export default function WishForm({
  invitationId,
  accentClass = "bg-rose-600 hover:bg-rose-700",
  borderClass = "border-zinc-300 focus:border-rose-400 focus:ring-rose-100",
}: Props) {
  const bound = submitWish.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<WishState | undefined, FormData>(
    bound,
    undefined,
  );

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:ring-2 ${borderClass} ${
      hasError ? "border-red-400" : ""
    }`;

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}
      <div>
        <label htmlFor="guestName" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Nama Anda
        </label>
        <input
          id="guestName"
          name="guestName"
          type="text"
          className={inputClass(!!state?.errors?.guestName)}
          placeholder="Nama"
        />
        {state?.errors?.guestName && (
          <p className="mt-1 text-xs text-red-600">{state.errors.guestName[0]}</p>
        )}
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Ucapan &amp; Doa
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={inputClass(!!state?.errors?.message)}
          placeholder="Tulis ucapan dan doa terbaik Anda..."
        />
        {state?.errors?.message && (
          <p className="mt-1 text-xs text-red-600">{state.errors.message[0]}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${accentClass}`}
      >
        <Send className="h-4 w-4" />
        {isPending ? "Mengirim..." : "Kirim Ucapan"}
      </button>
    </form>
  );
}
