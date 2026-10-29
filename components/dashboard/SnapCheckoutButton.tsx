"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";

export default function SnapCheckoutButton({
  clientKey,
  isProduction,
  invitationId,
}: {
  clientKey: string;
  isProduction: boolean;
  /** Jika diisi: bayar aktivasi premium khusus undangan ini. */
  invitationId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/midtrans/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: invitationId ?? null }),
      });
      const data = (await response.json()) as {
        token?: string;
        redirectUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.token) {
        setError(data.error ?? "Gagal memulai pembayaran.");
        return;
      }

      const snapPay = window.snap?.pay;
      if (typeof snapPay === "function") {
        snapPay.call(window.snap, data.token, {
          onSuccess: () => window.location.reload(),
          onPending: () => window.location.reload(),
          onError: () => window.location.reload(),
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
        {loading ? "Menyiapkan pembayaran..." : "Bayar Sekarang"}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
