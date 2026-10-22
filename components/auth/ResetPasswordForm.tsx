"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";
import {
  resetPassword,
  type PasswordResetState,
} from "@/lib/actions/password-reset";

type ResetPasswordFormProps = {
  email: string;
  token: string;
};

export default function ResetPasswordForm({
  email,
  token,
}: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState<
    PasswordResetState | undefined,
    FormData
  >(resetPassword, undefined);
  const hasValidLink = Boolean(email && token);

  return (
    <form action={formAction} className="space-y-4">
      {!hasValidLink && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          Tautan reset tidak valid. Minta tautan baru untuk melanjutkan.
        </div>
      )}
      {state?.message && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {state.message}
        </div>
      )}

      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Password baru
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={!hasValidLink || isPending}
            placeholder="Minimal 8 karakter, huruf dan angka"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-zinc-100"
          />
        </div>
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Konfirmasi password baru
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={!hasValidLink || isPending}
            placeholder="Ulangi password baru"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-zinc-100"
          />
        </div>
        {state?.errors?.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!hasValidLink || isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan password baru
      </button>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-rose-600 hover:underline">
          Kembali ke login
        </Link>
      </p>
    </form>
  );
}
