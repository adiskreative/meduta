import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { LogoWithText } from "@/components/Logo";

export const metadata: Metadata = {
  title: "MEDUTA | Lupa Password",
  description: "Atur ulang password akun Meduta Anda",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoWithText
              textClass="text-rose-600"
              markClass="h-10 w-auto"
              textSize="text-2xl"
            />
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Lupa password?
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Masukkan email akun Anda untuk menerima tautan pengaturan ulang
              password.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
