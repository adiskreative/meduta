"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLinkButton({
  url,
  label = "Salin Link",
  variant = "outline",
}: {
  url: string;
  label?: string;
  variant?: "outline" | "solid";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  const base = "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
  const cls =
    variant === "solid"
      ? `${base} bg-zinc-900 text-white hover:bg-zinc-800`
      : `${base} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`;

  return (
    <button type="button" onClick={handleCopy} className={cls}>
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Tersalin" : label}
    </button>
  );
}
