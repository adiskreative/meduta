"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
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
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}
