"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { formatDate } from "./types";

type GateTheme = "classic" | "minimal" | "floral" | "rustic" | "berkreative" | "garden";

/**
 * Gerbang undangan ala undangan digital premium:
 * cover fullscreen menutup seluruh konten, tamu harus menekan
 * "Buka Undangan" untuk melihat isi undangan.
 * Di dalam frame preview (transform), fixed menempel ke layar ponsel.
 */
const THEME_STYLES: Record<
  GateTheme,
  { photo: string; overlay: string; eyebrow: string; amp: string }
> = {
  classic: {
    photo:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70",
    overlay:
      "linear-gradient(to bottom, rgba(8,52,38,0.5), rgba(6,38,28,0.72))",
    eyebrow: "text-amber-200",
    amp: "text-gold-shimmer font-[family-name:var(--font-script)]",
  },
  minimal: {
    photo:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=70",
    overlay:
      "linear-gradient(135deg, rgba(30,27,75,0.82), rgba(76,29,149,0.55), rgba(112,26,117,0.72))",
    eyebrow: "text-fuchsia-200",
    amp: "font-serif italic text-fuchsia-200",
  },
  floral: {
    photo:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=70",
    overlay:
      "linear-gradient(to bottom, rgba(120,26,60,0.42), rgba(88,14,50,0.66))",
    eyebrow: "text-rose-100",
    amp: "font-[family-name:var(--font-script)] text-pink-200",
  },
  rustic: {
    photo:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200&q=80",
    overlay:
      "linear-gradient(to bottom, rgba(15,23,18,0.5), rgba(10,15,12,0.78))",
    eyebrow: "text-amber-100",
    amp: "font-[family-name:var(--font-script)] text-amber-200",
  },
  berkreative: {
    // Navy brand Meduta dengan bingkai bunga pink-biru
    photo: "/design/bg-new-opt.jpg",
    overlay:
      "linear-gradient(to bottom, rgba(11,16,48,0.55), rgba(45,10,36,0.78))",
    eyebrow: "text-fuchsia-200",
    amp: "text-gold-shimmer font-[family-name:var(--font-script)]",
  },
  garden: {
    // Taman bunga ungu — stationery royal garden
    photo:
      "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates/background/45d062d5-746e-4476-8891-862c0d6ae302.jpg",
    overlay:
      "linear-gradient(to bottom, rgba(46,16,60,0.45), rgba(88,14,50,0.72))",
    eyebrow: "text-amber-100",
    amp: "font-[family-name:var(--font-script)] text-pink-200",
  },
};

export default function InvitationGate({
  theme = "classic",
  eventName = "The Wedding Of",
  groomNick,
  brideNick,
  eventDate,
  guestName,
  onOpen,
  /** Mode embed (thumbnail live): gerbang disembunyikan agar konten terlihat. */
  embedded = false,
  /** Background kustom dari admin — menggantikan foto bawaan tema. */
  backgroundUrl,
}: {
  theme?: GateTheme;
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  onOpen?: () => void;
  embedded?: boolean;
  backgroundUrl?: string;
}) {
  const [open, setOpen] = useState(embedded);
  const [closing, setClosing] = useState(false);
  const t = THEME_STYLES[theme];

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
    window.setTimeout(() => setOpen(true), 700);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-zinc-900 text-center text-white ${
        closing ? "animate-gate-open" : ""
      }`}
      role="dialog"
      aria-label="Buka undangan"
    >
      {/* Foto latar + gradasi sesuai tema (atau background kustom admin) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl || t.photo}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ backgroundImage: t.overlay }} />

      {/* Bingkai halus */}
      <div className="pointer-events-none absolute inset-4 rounded-[2.5rem] border border-white/20 sm:inset-6" />

      <div className="relative z-10 flex flex-col items-center px-6">
        <p
          className={`animate-fade-up font-[family-name:var(--font-serif-elegant)] text-lg italic tracking-wide ${t.eyebrow}`}
        >
          {eventName}
        </p>

        <h1 className="animate-fade-up-delay-1 mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
          {groomNick ?? "Pria"}{" "}
          <span className={`mx-1 inline-block ${t.amp}`}>&amp;</span>{" "}
          {brideNick ?? "Wanita"}
        </h1>

        {eventDate && (
          <p className="animate-fade-up-delay-2 mt-4 max-w-[260px] text-sm leading-relaxed tracking-[0.25em] text-white/80">
            {formatDate(eventDate)}
          </p>
        )}

        {guestName && (
          <div className="animate-fade-up-delay-3 mt-12">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/75">
              Kepada Yth.
            </p>
            <p className="mt-1 text-2xl font-semibold">{guestName}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpen}
          className="animate-fade-up-delay-4 group mt-10 inline-flex items-center gap-2.5 rounded-full border border-amber-100/60 bg-[#faf5e9] px-8 py-3.5 text-sm font-semibold tracking-wide text-zinc-800 shadow-2xl shadow-black/30 transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95"
        >
          <BookOpen className="h-4 w-4 text-amber-700 transition-transform duration-300 group-hover:-rotate-12" />
          Buka Undangan
        </button>
      </div>
    </div>
  );
}
