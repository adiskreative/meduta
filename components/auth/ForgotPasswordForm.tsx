"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import {
  requestPasswordReset,
  type PasswordResetRequestState,
} from "@/lib/actions/password-reset";

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    PasswordResetRequestState | undefined,
    FormData
  >(requestPasswordReset, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div
          role={state.success ? "status" : "alert"}
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            defaultValue={state?.fieldValues?.email}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Kirim tautan reset
      </button>

      <p className="text-center text-sm text-zinc-500">
        Ingat password?{" "}
        <Link href="/login" className="font-medium text-rose-600 hover:underline">
          Kembali ke login
        </Link>
      </p>
    </form>
  );
}
