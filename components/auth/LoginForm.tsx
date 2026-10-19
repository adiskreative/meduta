"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const status = searchParams.get("status");

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setServerError(undefined);

    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setIsLoading(false);

    if (res?.error) {
      setServerError(
        "Email atau password salah, atau email belum dikonfirmasi.",
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === "registered" && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          Pendaftaran berhasil. Buka email Anda dan klik tautan konfirmasi
          sebelum masuk.
        </div>
      )}
      {status === "verified" && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          Email berhasil dikonfirmasi. Silakan masuk.
        </div>
      )}
      {status === "verification-invalid" && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Daftar kembali
          untuk mengirim tautan baru.
        </div>
      )}
      {status === "verification-error" && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          Email belum dapat dikonfirmasi karena terjadi kesalahan. Silakan coba
          lagi nanti.
        </div>
      )}
      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...register("email")}
            className={inputClass}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
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
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className={inputClass}
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Masuk
      </button>

      <p className="text-center text-sm text-zinc-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-rose-600 hover:underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}