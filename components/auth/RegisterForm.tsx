"use client";

import { useActionState } from "react";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { signup, SignupState } from "@/lib/actions/auth";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState<SignupState | undefined, FormData>(
    signup,
    undefined,
  );

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Nama Lengkap
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Nama Anda"
            defaultValue={state?.fieldValues?.name}
            className={inputClass(!!state?.errors?.name)}
          />
        </div>
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            defaultValue={state?.fieldValues?.email}
            className={inputClass(!!state?.errors?.email)}
          />
        </div>
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            className={inputClass(!!state?.errors?.password)}
          />
        </div>
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Konfirmasi Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password"
            className={inputClass(!!state?.errors?.confirmPassword)}
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
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Daftar
      </button>

      <p className="text-center text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-rose-600 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}