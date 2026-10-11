"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { regenerateThumbnail, type ThumbState } from "@/lib/actions/admin-thumbnail";

/**
 * Tombol "Perbarui Thumbnail" di kartu template (Admin → Kelola Template).
 * Menjalankan regenerasi screenshot statis template tsb di server
 * (Chrome headless) tanpa perlu terminal, lalu me-refresh kartu.
 */
export default function RegenerateThumbButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ThumbState | null>(null);

  function handleRegenerate() {
    setResult(null);
    startTransition(async () => {
      const res = await regenerateThumbnail(templateId);
      setResult(res);
      if (res.ok) router.refresh();
      // Auto-hide pesan sukses setelah 4 detik
      if (res.ok) setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <div className="col-span-2">
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isPending}
        title="Ambil ulang screenshot template untuk thumbnail landing & Pilih Tema"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Mengambil screenshot... (±30 dtk)" : "Perbarui Thumbnail"}
      </button>
      {result?.ok && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" /> {result.message}
        </p>
      )}
      {result && !result.ok && (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {result.message}
        </p>
      )}
    </div>
  );
}
