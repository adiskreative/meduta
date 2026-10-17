"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";

/**
 * Tombol pembayaran paket Premium via DOKU Checkout (redirect hosted page).
 *
 * Alur:
 * 1. Klik → POST /api/doku/checkout → { paymentUrl, invoiceNumber }
 * 2. Redirect browser ke halaman pembayaran hosted DOKU.
 * 3. Setelah selesai, DOKU redirect kembali ke /dashboard/upgrade?doku=finish…
 *    dan status premium di-refresh dari server.
 */
export default function DokuCheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      window.location.href = data.paymentUrl;
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
        {loading ? "Menyiapkan pembayaran..." : "Bayar via DOKU"}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
