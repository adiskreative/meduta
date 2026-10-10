"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";

/**
 * Tombol pembayaran paket Premium via Midtrans Snap.
 *
 * Alur:
 * 1. Klik → POST /api/midtrans/checkout → { token, redirectUrl }
 * 2. Coba popup Snap via window.snap.pay(token); bila Snap script gagal tampil
 *    (mis. diblokir), fallback tab baru ke redirectUrl (halaman Snap hosted).
 * 3. Popup selesai ditangani di halaman /dashboard/upgrade?paid=1 (Snap JS
 *    callback onResult), yang me-refresh data premium dari server.
 *
 * Script Snap dimuat dari CDN Midtrans dengan client key env saat render
 * server (diinject middleware server component halaman upgrade).
 */
export default function SnapCheckoutButton({
  clientKey,
  isProduction,
}: {
  clientKey: string;
  isProduction: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/midtrans/checkout", { method: "POST" });
      const data = (await res.json()) as {
        token?: string;
        redirectUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.token) {
        setError(data.error ?? "Gagal memulai pembayaran.");
        return;
      }

      // Pastikan Snap JS siap; kalau tersedia pakai popup, fallback redirect.
      const snapPay = window.snap?.pay;

      if (typeof snapPay === "function") {
        snapPay.call(window.snap, data.token!, {
          onSuccess: () => window.location.reload(),
          onPending: () => window.location.reload(),
          onError: () => window.location.reload(),
          onClose: () => {
            // Tutup tanpa bayar — biarkan user melihat halaman upgrade
          },
        });
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError("Popup pembayaran gagal tampil. Coba muat laman ini kembali.");
      }
    } catch {
      setError("Terjadi kesalahan saat memulai pembayaran.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        data-midtrans-client-key={clientKey}
        data-midtrans-production={isProduction}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Crown className="h-5 w-5" />
        )}
        {loading ? "Menyiapkan pembayaran..." : "Bayar Sekarang via Midtrans"}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
