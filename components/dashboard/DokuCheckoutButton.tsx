"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Wallet, X } from "lucide-react";

/**
 * Tombol pembayaran paket Premium via DOKU Checkout dalam dialog.
 *
 * Alur:
 * 1. Klik → POST /api/doku/checkout → { paymentUrl, invoiceNumber }
 * 2. Tampilkan halaman pembayaran hosted DOKU dalam dialog.
 * 3. Tutup dialog untuk memuat ulang status premium dari server.
 */
export default function DokuCheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const closeCheckout = useCallback(() => {
    setPaymentUrl(null);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!paymentUrl) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCheckout();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [paymentUrl, closeCheckout]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/doku/checkout", { method: "POST" });
      const data = (await res.json()) as {
        paymentUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.paymentUrl) {
        setError(data.error ?? "Gagal memulai pembayaran DOKU.");
        return;
      }
      setPaymentUrl(data.paymentUrl);
    } catch {
      setError("Terjadi kesalahan saat memulai pembayaran DOKU.");
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-600 bg-white px-6 py-3.5 font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Wallet className="h-5 w-5" />
        )}
        {loading ? "Menyiapkan pembayaran..." : "Bayar Sekarang"}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      {paymentUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doku-checkout-title"
          aria-describedby="doku-checkout-description"
        >
          <div className="flex h-[min(90vh,800px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6">
              <h2 id="doku-checkout-title" className="font-semibold text-zinc-900">
                Pembayaran DOKU
              </h2>
              <button
                type="button"
                onClick={closeCheckout}
                aria-label="Tutup pembayaran"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              src={paymentUrl}
              title="Halaman pembayaran DOKU"
              allow="payment *; clipboard-write"
              className="min-h-0 w-full flex-1 border-0"
            />
          </div>
          <p id="doku-checkout-description" className="sr-only">
            Selesaikan pembayaran di jendela ini, lalu tutup untuk memperbarui status akun.
          </p>
        </div>
      )}
    </div>
  );
}
