"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({
  text,
  className = "border border-zinc-300 text-zinc-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
  copiedIconClass = "text-emerald-600",
}: {
  text: string;
  /** Gaya tombol; override untuk tema gelap. */
  className?: string;
  /** Warna ikon saat teks tersalin. */
  copiedIconClass?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia di konteks ini
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Salin nomor"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${className}`}
    >
      {copied ? <Check className={`h-3.5 w-3.5 ${copiedIconClass}`} /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}
