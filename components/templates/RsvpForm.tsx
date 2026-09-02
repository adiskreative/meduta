"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitRsvp, RsvpVisitorState } from "@/lib/actions/rsvp-visitor";

type Props = {
  invitationId: string;
  initialName?: string;
  accentClass?: string;
  borderClass?: string;
};

export default function RsvpForm({
  invitationId,
  initialName,
  accentClass = "bg-rose-600 hover:bg-rose-700",
  borderClass = "border-zinc-300 focus:border-rose-400 focus:ring-rose-100",
}: Props) {
  const bound = submitRsvp.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<RsvpVisitorState | undefined, FormData>(
    bound,
    undefined,
  );

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:ring-2 ${borderClass} ${
      hasError ? "border-red-400" : ""
    }`;

  if (state?.submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-700">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && !state.success && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
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
          defaultValue={initialName ?? ""}
          className={inputClass(!!state?.errors?.guestName)}
          placeholder="Nama"
        />
        {state?.errors?.guestName && (
          <p className="mt-1 text-xs text-red-600">{state.errors.guestName[0]}</p>
        )}
      </div>
      <div>
        <label htmlFor="guestCount" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Jumlah Tamu
        </label>
        <input
          id="guestCount"
          name="guestCount"
          type="number"
          min={1}
          max={20}
          defaultValue={1}
          className={inputClass(!!state?.errors?.guestCount)}
        />
        {state?.errors?.guestCount && (
          <p className="mt-1 text-xs text-red-600">{state.errors.guestCount[0]}</p>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          name="status"
          value="CONFIRMED"
          disabled={isPending}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${accentClass}`}
        >
          {isPending ? "Mengirim..." : "Saya Hadir"}
        </button>
        <button
          type="submit"
          name="status"
          value="DECLINED"
          disabled={isPending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Tidak Bisa Hadir
        </button>
      </div>
    </form>
  );
}
