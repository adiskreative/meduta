import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Daftar | Meduta",
  description: "Buat akun Meduta gratis",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold text-rose-600">
              Meduta
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Buat akun baru
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Mulai buat undangan digital Anda
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}