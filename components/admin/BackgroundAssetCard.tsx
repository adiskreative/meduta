"use client";

import { useState, useTransition } from "react";
import { Check, Mountain } from "lucide-react";
import { useRouter } from "next/navigation";
import { setBackground } from "@/lib/actions/admin-decoration";

type TemplateOption = { id: string; name: string };

/**
 * Kartu aset BACKGROUND di galeri: pilih satu template,
 * lalu pasang/hapus background untuk template itu.
 */
export default function BackgroundAssetCard({
  asset,
  templates,
}: {
  asset: { id: string; name: string; url: string; thumbnail: string | null };
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSet = () => {
    if (!templateId) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await setBackground(templateId, asset.id);
        const tpl = templates.find((t) => t.id === templateId);
        setMessage({ ok: true, text: `Terpasang untuk ${tpl?.name ?? "template"}.` });
        setConfirming(false);
        router.refresh();
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Gagal memasang." });
        setConfirming(false);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-md">
      <div className="relative aspect-[3/4] bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.thumbnail ?? asset.url}
          alt={asset.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-zinc-900/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <Mountain className="h-3 w-3 shrink-0" />
          <span className="truncate">{asset.name}</span>
        </span>
      </div>

      <div className="space-y-2 p-3">
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setConfirming(false);
            setMessage(null);
          }}
          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          aria-label={`Pilih template untuk ${asset.name}`}
        >
          <option value="">Pasang ke template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSet}
          disabled={!templateId || isPending}
          title={!templateId ? "Pilih template dulu" : undefined}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            confirming
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {confirming ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Yakin pasang?
            </>
          ) : isPending ? (
            "Memasang…"
          ) : (
            "Pasang"
          )}
        </button>

        {message && (
          <p className={`text-[11px] leading-snug ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
