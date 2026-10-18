import { redirect } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  PREMIUM_PRICE,
  PREMIUM_ORIGINAL_PRICE,
  isPremiumUser,
} from "@/lib/premium";
import { isDokuConfigured } from "@/lib/doku";
import DokuCheckoutButton from "@/components/dashboard/DokuCheckoutButton";

export const metadata = { title: "Upgrade Premium | Meduta" };
export const dynamic = "force-dynamic";

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

const FEATURES = [
  "Unlimited undangan — bebas ganti-ganti template sesuai selera",
  "Masa aktif 1 tahun",
  "Semua template premium",
  "Bebas ganti background & musik latar",
  "Upload galeri foto tanpa batas",
  "Pantau RSVP & ucapan tamu",
  "Kustomisasi domain & branding",
  "Integrasi pembayaran & donasi",
  "Dukungan prioritas",
  "Hapus watermark Meduta",
];

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const premium = await isPremiumUser(session.user.id);

  const dokuReady = isDokuConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Upgrade Premium</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Buka seluruh fitur dan template premium Meduta.
        </p>
      </div>

      {premium ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold text-emerald-800">
            Akun Anda sudah Premium
          </h2>
          <p className="mt-2 text-sm text-emerald-700">
            Semua template & fitur lengkap sudah terbuka. Terima kasih atas kepercayaan Anda!
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-8 shadow-lg">
            <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950">
              Promo
            </span>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-zinc-900">Paket Premium</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Fitur lengkap untuk momen spesial Anda.
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              {/* Harga normal dicoret · harga promo */}
              <span className="text-2xl font-medium text-zinc-400 line-through decoration-red-500 decoration-2">
                {rupiah(PREMIUM_ORIGINAL_PRICE)}
              </span>
              <span className="text-4xl font-bold text-rose-600">
                {rupiah(PREMIUM_PRICE)}
              </span>
              <span className="text-sm text-zinc-500">/ 1 tahun</span>
            </div>
            <p className="mt-1 text-xs font-medium text-emerald-600">
              Hemat {rupiah(PREMIUM_ORIGINAL_PRICE - PREMIUM_PRICE)} (promo
              terbatas)
            </p>

            <ul className="mt-6 space-y-3">
              {FEATURES.map((feat) => (
                <li
                  key={feat}
                  className="flex items-start gap-2 text-sm text-zinc-700"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  {feat}
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-3">
              {dokuReady ? (
                <DokuCheckoutButton />
              ) : (
                <p className="text-center text-sm text-amber-700">
                  Pembayaran DOKU belum tersedia. Silakan hubungi administrator.
                </p>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-zinc-400">
              Pembayaran aman via DOKU (VA bank, e-wallet, QRIS, kartu). Akses
              premium aktif otomatis setelah pembayaran terkonfirmasi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
