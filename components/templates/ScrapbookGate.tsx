"use client";

import { useEffect, useState } from "react";
import { Camera, Heart } from "lucide-react";

/**
 * ScrapbookGate — gerbang undangan khusus template Scrapbook Album,
 * sesuai desain referensi: badge "Wedding Photo Album" miring, polaroid
 * besar ber-washi tape dengan foto pasangan sepia + nama tulisan tangan,
 * kartu tamu (Kepadanya Yang Terhormat), dan tombol terakota.
 * Fitur Meduta tetap utuh: nama tamu dari link undangan, background
 * kustom user/admin tampil redup, animasi buka 0.7 dtk, musik latar
 * dimulai saat tombol ditekan (via onOpen).
 */

const SB = {
  cream: "#FAF6F0",
  brown: "#3E2F28",
  brownLight: "#655348",
  terracotta: "#B5533C",
  terracottaLight: "#E39280",
  green: "#6B7A6A",
  paper: "#FFFDF9",
} as const;

const GATE_STYLES = `
  .sbgate-paper {
    background-image: radial-gradient(#655348 0.5px, transparent 0.5px);
    background-size: 24px 24px;
    opacity: 0.05;
  }
  .sbgate-polaroid {
    box-shadow: 0 14px 30px -6px rgba(62, 47, 40, 0.16), 0 10px 14px -8px rgba(62, 47, 40, 0.1);
  }
  .sbgate-tape-pink {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 92px;
    height: 26px;
    background-color: rgba(227, 146, 128, 0.42);
    backdrop-filter: blur(2px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-left: 2px dashed rgba(255, 255, 255, 0.5);
    border-right: 2px dashed rgba(255, 255, 255, 0.5);
    z-index: 10;
  }
  .sbgate-tape-green {
    position: absolute;
    top: -10px;
    right: 15px;
    transform: rotate(4deg);
    width: 75px;
    height: 22px;
    background-color: rgba(107, 122, 106, 0.35);
    backdrop-filter: blur(2px);
    border-left: 2px dashed rgba(255, 255, 255, 0.4);
    border-right: 2px dashed rgba(255, 255, 255, 0.4);
    z-index: 10;
  }
  .sbgate-photo {
    filter: contrast(1.04) sepia(0.15);
  }
  .sbgate-hand {
    font-family: "Caveat", "Comic Sans MS", cursive;
  }
  .sbgate-btn {
    background: ${SB.terracotta};
    transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  }
  .sbgate-btn:hover {
    background: #a04631;
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 12px 26px -8px rgba(181, 83, 60, 0.55);
  }
  .sbgate-btn:active {
    transform: scale(0.97);
  }
`;

export default function ScrapbookGate({
  eventName = "Wedding Photo Album",
  groomNick,
  brideNick,
  guestName,
  eventDate,
  location,
  tagline,
  onOpen,
  backgroundUrl,
  photoUrl,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  eventDate?: string;
  location?: string;
  tagline?: string;
  onOpen?: () => void;
  backgroundUrl?: string;
  photoUrl?: string;
}) {
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);

  // Kunci scroll halaman selama gerbang tertutup
  useEffect(() => {
    if (open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (open) return null;

  const handleOpen = () => {
    if (closing) return;
    setClosing(true);
    onOpen?.();
    // Unmount setelah animasi buka selesai (0.7 dtk)
    window.setTimeout(() => setOpen(true), 700);
  };

  // Tanggal format polaroid: DD.MM.YYYY
  const d = eventDate ? new Date(eventDate) : null;
  const dateLabel =
    d && !Number.isNaN(d.getTime())
      ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
      : "";
  const placeLabel = location?.split(",")[0]?.trim().toUpperCase() ?? "";
  const metaLine = [dateLabel, placeLabel].filter(Boolean).join(" • ");

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center overflow-hidden ${
        closing ? "animate-gate-open" : ""
      }`}
      style={{ background: SB.cream }}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{GATE_STYLES}</style>

      {/* Tekstur kertas */}
      <div className="sbgate-paper pointer-events-none absolute inset-0" />

      {/* Background kustom user/admin (redup di belakang) */}
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-15"
        />
      )}

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center px-5 py-8">
        {/* Badge "Wedding Photo Album" */}
        <div
          className="sbgate-hand -rotate-3 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
          style={{
            background: "rgba(227, 146, 128, 0.2)",
            border: "1px solid rgba(181, 83, 60, 0.3)",
            color: SB.terracotta,
          }}
        >
          <Camera style={{ width: 14, height: 14 }} />
          <span style={{ letterSpacing: "0.08em" }}>{eventName}</span>
        </div>

        {/* Polaroid utama */}
        <div
          className="sbgate-polaroid relative mb-8 w-full max-w-[300px] rotate-1 rounded-sm border p-4 pb-12 transition-transform duration-500 hover:rotate-0"
          style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
        >
          <span className="sbgate-tape-pink" aria-hidden />
          <div
            className="aspect-[4/5] w-full overflow-hidden rounded-sm"
            style={{ background: SB.cream }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                photoUrl ||
                "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80"
              }
              alt="Foto pasangan"
              className="sbgate-photo h-full w-full object-cover"
            />
          </div>
          <p
            className="sbgate-hand mt-4 text-center text-2xl font-bold"
            style={{ color: SB.brown }}
          >
            {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
          </p>
          <p
            className="mt-1 text-center text-xs font-medium uppercase tracking-widest"
            style={{ color: SB.brownLight }}
          >
            {metaLine || "\u00A0"}
          </p>
        </div>

        {/* Kartu tamu */}
        <div
          className="relative mb-7 w-full rounded-lg border p-5 shadow-sm"
          style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.1)" }}
        >
          <span className="sbgate-tape-green" aria-hidden />
          <p
            className="text-center text-xs font-medium uppercase tracking-wider"
            style={{ color: SB.brownLight }}
          >
            Kepadanya Yang Terhormat
          </p>
          <p
            className="mt-1 text-center font-[family-name:var(--font-serif-elegant)] text-2xl font-bold capitalize"
            style={{ color: SB.brown }}
          >
            {guestName ?? "Tamu Undangan"}
          </p>
          <p
            className="mt-2 text-center text-xs italic"
            style={{ color: SB.green }}
          >
            &ldquo;{tagline ?? "Kami mengundang Anda untuk merayakan cinta & kehangatan hari bahagia kami."}&rdquo;
          </p>
        </div>

        {/* Tombol buka */}
        <button
          type="button"
          onClick={handleOpen}
          className="sbgate-btn group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-wider shadow-lg active:scale-95"
          style={{ color: SB.cream }}
        >
          <span>Buka Undangan</span>
          <Heart
            className="fill-current transition-transform duration-300 group-hover:scale-125"
            style={{ width: 16, height: 16, color: SB.terracottaLight }}
          />
        </button>
      </div>
    </div>
  );
}
