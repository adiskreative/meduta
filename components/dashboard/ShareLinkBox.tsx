"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, RefreshCw, Share2, ShieldCheck } from "lucide-react";
import {
  getOrCreateShareToken,
  regenerateShareToken,
} from "@/lib/actions/share";

/**
 * Kotak link halaman "Sebarkan Undangan" yang bisa dibuka tanpa login.
 * Token lama-missing lazily dibuat saat mount (undangan dari versi sebelum
 * fitur ini belum punya token).
 */
export default function ShareLinkBox({
  invitationId,
  shareToken,
  appUrl,
}: {
  invitationId: string;
  shareToken: string | null;
  appUrl: string;
}) {
  const [token, setToken] = useState(shareToken);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Undangan lama tidak punya token — buatkan otomatis supaya link selalu siap.
  useEffect(() => {
    if (token) return;
    startTransition(async () => {
      const created = await getOrCreateShareToken(invitationId);
      if (created) setToken(created);
    });
  }, [token, invitationId]);

  const shareUrl = token ? `${appUrl}/share/${token}` : null;

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
          <Share2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Link Sebarkan Undangan
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            Fitur Sebarkan Undangan dapat digunakan tanpa perlu login user.
          </p>
        </div>
      </div>

      {shareUrl ? (
        <>
          <div className="mb-4 flex flex-col gap-2 rounded-lg bg-zinc-50 px-4 py-3">
            <span className="text-xs font-medium text-zinc-500">
              Panel bagikan undangan:
            </span>
            <p className="truncate text-sm text-zinc-700">{shareUrl}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Tersalin" : "Salin Link"}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Buka Panel
            </a>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const rotated = await regenerateShareToken(invitationId);
                  if (rotated) setToken(rotated);
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
              Ganti Link
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Siapkan link ini ke keluarga/panitia agar mereka bisa menyiapkan link
            undangan untuk setiap tamu tanpa harus tahu akun Anda. Jika link
            tersebar ke orang yang salah, gunakan <strong>Ganti Link</strong> -
            link lama otomatis mati.
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Menyiapkan link bagikan...</p>
      )}
    </div>
  );
}
