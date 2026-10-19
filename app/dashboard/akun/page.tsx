import { redirect } from "next/navigation";
import Link from "next/link";
import { House } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountForm from "@/components/dashboard/AccountForm";

export const metadata = { title: "Pengaturan Akun | Meduta" };

export default async function AkunPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pengaturan Akun</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola nama, email, dan password akun Anda.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          <House className="h-4 w-4" />
          Ke Beranda
        </Link>
      </div>

      <AccountForm
        defaultName={user?.name ?? ""}
        defaultEmail={user?.email ?? session.user.email ?? ""}
        hasPassword={!!user?.password}
      />
    </div>
  );
}

// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
