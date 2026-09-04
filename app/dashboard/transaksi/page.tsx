import Link from "next/link";
import { CreditCard, Package, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Transaksi | Meduta" };

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-amber-100 text-amber-700" },
  success: { label: "Berhasil", className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Gagal", className: "bg-red-100 text-red-600" },
};

export default async function TransaksiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Transaksi</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Riwayat pembayaran dan paket undangan Anda.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
          <CreditCard className="h-5 w-5 text-rose-500" />
          <h2 className="font-semibold text-zinc-900">Riwayat Transaksi</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">Belum ada transaksi.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Pembayaran paket akan muncul di sini setelah Anda melakukan transaksi.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-rose-600 hover:underline"
            >
              Lihat paket harga
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {transactions.map((t) => {
              const meta = STATUS_META[t.status] ?? { label: t.status, className: "bg-zinc-100 text-zinc-600" };
              return (
                <div key={t.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{t.packageName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(t.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-900">
                      Rp {(t.amount ?? 0).toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
