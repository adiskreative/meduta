import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export const metadata: Metadata = {
  title: "Masuk | Meduta",
  description: "Masuk ke akun Meduta Anda",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold text-rose-600">
              Meduta
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Selamat datang kembali
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Masuk untuk mengelola undangan Anda
            </p>
          </div>

          <Suspense
            fallback={<div className="py-10 text-center text-sm text-zinc-400">Memuat...</div>}
          >
            <LoginForm />
          </Suspense>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400">atau</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <Suspense
            fallback={
              <div className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-500">
                Memuat...
              </div>
            }
          >
            <GoogleLoginButton />
          </Suspense>
        </div>
      </div>
    </div>
  );
}