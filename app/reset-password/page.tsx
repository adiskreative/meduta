import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { LogoWithText } from "@/components/Logo";

export const metadata: Metadata = {
  title: "MEDUTA | Atur Ulang Password",
  description: "Buat password baru untuk akun Meduta Anda",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const token = typeof params.token === "string" ? params.token : "";

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
              Atur ulang password
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Buat password baru untuk akun Anda.
            </p>
          </div>
          <ResetPasswordForm email={email} token={token} />
        </div>
      </div>
    </div>
  );
}
