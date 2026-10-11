"use client";

import { useActionState } from "react";
import { Save, KeyRound, User } from "lucide-react";
import { updateProfile, changePassword, AccountState } from "@/lib/actions/account";

function Message({ state }: { state?: AccountState }) {
  if (!state?.message) return null;
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${
        state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {state.message}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
    hasError ? "border-red-400" : "border-zinc-300"
  }`;
}

export default function AccountForm({
  defaultName,
  defaultEmail,
  hasPassword,
}: {
  defaultName: string;
  defaultEmail: string;
  hasPassword: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    AccountState | undefined,
    FormData
  >(updateProfile, undefined);
  const [passState, passAction, passPending] = useActionState<
    AccountState | undefined,
    FormData
  >(changePassword, undefined);

  return (
    <div className="space-y-6">
      <form action={profileAction} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <User className="h-5 w-5 text-rose-500" />
            Profil
          </h2>
          <Message state={profileState} />

          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Nama
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={defaultName}
            className={inputClass(!!profileState?.errors?.name)}
          />
          {profileState?.errors?.name && (
            <p className="mt-1 text-xs text-red-600">{profileState.errors.name[0]}</p>
          )}

          <label htmlFor="email" className="mb-1.5 mt-4 block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultEmail}
            className={inputClass(!!profileState?.errors?.email)}
          />
          {profileState?.errors?.email && (
            <p className="mt-1 text-xs text-red-600">{profileState.errors.email[0]}</p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {profilePending ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </div>
      </form>

      {hasPassword ? (
        <form action={passAction} className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <KeyRound className="h-5 w-5 text-rose-500" />
              Ganti Password
            </h2>
            <Message state={passState} />

            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Password lama
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className={inputClass(!!passState?.errors?.currentPassword)}
            />
            {passState?.errors?.currentPassword && (
              <p className="mt-1 text-xs text-red-600">
                {passState.errors.currentPassword[0]}
              </p>
            )}

            <label
              htmlFor="newPassword"
              className="mb-1.5 mt-4 block text-sm font-medium text-zinc-700"
            >
              Password baru
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass(!!passState?.errors?.newPassword)}
            />
            {passState?.errors?.newPassword && (
              <p className="mt-1 text-xs text-red-600">
                {passState.errors.newPassword[0]}
              </p>
            )}

            <button
              type="submit"
              disabled={passPending}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {passPending ? "Menyimpan..." : "Ganti Password"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          Akun ini terhubung via Google OAuth. Kelola profil melalui akun Google Anda.
        </div>
      )}
    </div>
  );
}
