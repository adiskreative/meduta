"use client";

import { useState, useTransition } from "react";
import { User, Send, MessageCircle, Check, Copy, Loader2 } from "lucide-react";
import { slugifyName } from "@/lib/guest-link";
import { addGuestFromShareToken } from "@/lib/actions/share";

export default function WhatsAppShareForm({
  shareToken,
  invitationSlug,
  appUrl,
}: {
  /** Token rahasia panel share — antar actions melalui token, bukan session,
   * sehingga panel bisa dipakai tanpa login. */
  shareToken: string;
  invitationSlug: string;
  appUrl: string;
}) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const trimmedName = name.trim();
  const hasName = trimmedName.length >= 2;
  const digitalLink = `${appUrl}/u/${invitationSlug}?to=${encodeURIComponent(
    slugifyName(trimmedName),
  )}`;

  function buildMessage(): string {
    return [
      `Assalamu'alaikum wr. wb.
      
      Kepada Yth:
      Bapak/Ibu 
      
      ${trimmedName},`,
      "",

      "Dengan penuh rasa syukur, kami mengundang bapak/ibu untuk menghadiri acara pernikahan kami. Berikut Link undangan digital yang bisa Bapak/Ibu akses:",
      "",
      digitalLink,
      "",
      "Terima kasih 🙏",

      "Wassalamu'alaikum wr. wb.",

      "mohon maaf 🙏 apabila ada kesalahan dalam penulisan nama atau gelar. Semoga Bapak/Ibu berkenan hadir dan memberikan doa restu.",
      
    ].join("\n");
  }

  function shareToWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    if (!hasName) return;

    setStatus(null);
    setStatusIsError(false);
    const message = encodeURIComponent(buildMessage());
    const target = `https://wa.me/?text=${message}`;
    const whatsappWindow = window.open(target, "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;

    // Simpan tamu tanpa nomor telepon; penerima dipilih langsung di WhatsApp.
    startTransition(async () => {
      const form = new FormData();
      form.set("name", trimmedName);
      const state = await addGuestFromShareToken(shareToken, form);
      setStatus(state.message ?? null);
      setStatusIsError(!state.success);
    });
  }

  async function copyLink() {
    if (!hasName) return;
    try {
      await navigator.clipboard.writeText(digitalLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  const inputClass =
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 border-zinc-300";

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          Share ke WhatsApp
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Isi nama penerima, lalu pilih kontak tujuan langsung di WhatsApp untuk mengirim undangan personalisasi.
        </p>
      </div>

      {status && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            statusIsError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {status}
        </div>
      )}

      <form onSubmit={shareToWhatsApp} className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <User className="h-4 w-4 text-zinc-400" />
            Nama penerima
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: Rizky Pratama"
            className={inputClass}
          />
        </div>

        {hasName && (
          <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 px-4 py-3">
            <span className="text-xs font-medium text-zinc-500">Link undangan personal:</span>
            <p className="truncate text-sm text-zinc-700">{digitalLink}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!hasName || isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "Menyimpan..." : "Share ke WhatsApp"}
          </button>
          <button
            type="button"
            onClick={copyLink}
            disabled={!hasName}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Tersalin" : "Salin Link"}
          </button>
        </div>
        <p className="text-xs text-zinc-400">
          Setiap nama menghasilkan link undangan dengan sapaan yang dipersonalisasi
          ({`?to=${name ? slugifyName(trimmedName) : "nama"}`}).
        </p>
      </form>
    </div>
  );
}
