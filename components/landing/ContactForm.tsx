"use client";

import { useActionState } from "react";
import { Send, Loader2, CircleCheck } from "lucide-react";
import { sendContactMessage, ContactState } from "@/lib/actions/contact";

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState<ContactState | undefined, FormData>(
    sendContactMessage,
    undefined,
  );

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
      <h3 className="text-lg font-semibold text-zinc-900">Kirim Pesan</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Isi form di bawah, pesan langsung masuk ke email kami dan kami balas secepat mungkin ke email Anda.
      </p>

      {state?.message && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {state.ok && <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />}
          {state.message}
        </div>
      )}

      <form action={formAction} className="mt-5 space-y-4">
        {/* Honeypot anti-spam — disembunyikan dari manusia */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Nama
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              placeholder="Nama Anda"
              className={inputClass(!!state?.errors?.name)}
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="email@anda.com"
              className={inputClass(!!state?.errors?.email)}
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Pesan
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            placeholder="Tulis pertanyaan atau pesanmu di sini..."
            className={inputClass(!!state?.errors?.message)}
          />
          {state?.errors?.message && (
            <p className="mt-1 text-xs text-red-600">{state.errors.message[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-600/30 transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? "Mengirim…" : "Kirim Pesan"}
        </button>
      </form>
    </div>
  );
}
