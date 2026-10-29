"use client";

import { useState } from "react";
import { Copy, Check, Eye, Link2 } from "lucide-react";

type GuestItem = {
  id: string;
  name: string;
  uniqueLink: string;
};

/** Daftar tamu + link personal, dipakai di panel share dan dashboard. */
export default function GuestLinksList({
  guests,
  appUrl,
}: {
  guests: GuestItem[];
  appUrl: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(link);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  if (guests.length === 0) {
    return (
      <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        Belum ada tamu. Isi nama penerima di atas untuk membuat link undangan.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <Link2 className="h-4 w-4" />
        Daftar Tamu &amp; Link Undangan ({guests.length})
      </p>
      {guests.map((guest) => {
        const full = `${appUrl}/u/${guest.uniqueLink}`;
        return (
          <div
            key={guest.id}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800">{guest.name}</p>
              <p className="truncate text-xs text-zinc-500">{full}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={full}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <Eye className="h-3.5 w-3.5" />
                Buka
              </a>
              <button
                type="button"
                onClick={() => copyLink(full)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                {copied === full ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === full ? "Tersalin" : "Salin"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
