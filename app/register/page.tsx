import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import { LogoWithText } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Daftar | Meduta",
  description: "Buat akun Meduta gratis",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoWithText textClass="text-rose-600" markClass="h-10 w-auto" textSize="text-2xl" />
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Buat akun baru
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Marijo buat Undangan Digital Gratis!, cepat, dan mudah. Kamu bisa buat akun sekarang atau masuk dengan akun Google.
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}