import Link from "next/link";
import { Clock } from "lucide-react";

/**
 * Halaman yang tampil saat masa aktif undangan habis.
 * Menjelaskan kondisi kepada tamu & mengarahkan pemilik untuk upgrade.
 */
export default function ExpiredPage({ owner }: { owner?: string | null }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Masa Aktif Undangan Berakhir
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Undangan pernikahan{owner ? ` dari ${owner}` : ""} sudah melewati masa
          aktif paketnya sehingga halaman ini tidak dapat dibuka lagi.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Jika Anda pemilik undangan, aktifkan paket Premium untuk menampilkan
          kembali undangan Anda tanpa batas masa aktif.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Aktifkan Premium Kembali
        </Link>
        <p className="mt-6 text-xs text-zinc-400">
          © {new Date().getFullYear()} MEDUTA
        </p>
      </div>
    </main>
  );
}
