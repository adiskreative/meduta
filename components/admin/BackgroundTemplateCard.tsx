"use client";

import { useState, useTransition } from "react";
import { Check, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { setBackground, removeBackground } from "@/lib/actions/admin-decoration";

type AssetOption = { id: string; name: string; url: string; thumbnail: string | null };

/**
 * Kontrol per template di halaman Kelola Background:
 * pilih aset BACKGROUND → pasang (mengganti yang aktif), atau hapus
 * background kustom agar kembali ke bawaan template.
 */
export default function BackgroundTemplateCard({
  templateId,
  templateName,
  activeBg,
  assets,
}: {
  templateId: string;
  templateName: string;
  activeBg: string | null;
  assets: AssetOption[];
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [confirming, setConfirming] = useState<"set" | "remove" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>, kind: "set" | "remove") => {
    setMessage(null);
    startTransition(async () => {
      try {
        await fn();
        setMessage({ ok: true, text: kind === "set" ? "Background diganti." : "Kembali ke bawaan." });
        setConfirming(null);
        setAssetId("");
        router.refresh();
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Gagal." });
        setConfirming(null);
      }
    });
  };

  const handleSet = () => {
    if (!assetId) return;
    if (confirming !== "set") {
      setConfirming("set");
      return;
    }
    run(() => setBackground(templateId, assetId), "set");
  };

  const handleRemove = () => {
    if (confirming !== "remove") {
      setConfirming("remove");
      return;
    }
    run(() => removeBackground(templateId), "remove");
  };

  return (
    <div className="space-y-2">
      {/* Ganti background */}
      <div className="flex gap-2">
        <select
          value={assetId}
          onChange={(e) => {
            setAssetId(e.target.value);
            setConfirming(null);
            setMessage(null);
          }}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          aria-label={`Pilih background untuk ${templateName}`}
        >
          <option value="">Pilih background…</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSet}
          disabled={!assetId || isPending}
          title={!assetId ? "Pilih background dulu" : undefined}
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            confirming === "set"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {confirming === "set" ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Yakin?
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Ganti
            </>
          )}
        </button>
      </div>

      {/* Hapus background kustom */}
      <button
        type="button"
        onClick={handleRemove}
        disabled={!activeBg || isPending}
        title={!activeBg ? "Template ini memakai bawaan" : undefined}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:bg-transparent disabled:hover:text-zinc-700"
      >
        {confirming === "remove" ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Yakin hapus?
          </>
        ) : (
          <>
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? "Memproses…" : "Hapus — kembali ke bawaan"}
          </>
        )}
      </button>

      {message && (
        <p className={`text-[11px] ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
