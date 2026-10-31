"use client";

import { useEffect, useState } from "react";

/**
 * RomanGate — Gerbang pembuka template Roman Romance (Villa Romana):
 * - Latar travertine hangat dengan sapuan watercolor Istana Romawi & air mancur.
 * - Karangan bunga mawar & eucalyptus di sudut atas bergoyang lembut ditiup angin Mediterania.
 * - Centerpiece: Amplop surat vintage bertali rami dengan segel lilin merah berembos daun dafnah (laurel).
 * - "The Wedding of" kaligrafi Romawi + inisial emas pasangan.
 * - Nama tamu kehormatan dalam plat perkamen ber-lis emas.
 * - Tombol "Buka Undangan" bergaya segel lilin emas dengan animasi glow & unfolding lembut.
 */

const GOLD = "#C59B27";
const WINE = "#7A2021";

export default function RomanGate({
  groomNick,
  brideNick,
  guestName,
  onOpen,
  embedded = false,
}: {
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  onOpen?: () => void;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(embedded);
  const [closing, setClosing] = useState(false);

  // Kunci scroll halaman saat gerbang tertutup
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
    window.setTimeout(() => {
      onOpen?.();
      setOpen(true);
    }, 750);
  };

  const groomInitial = (groomNick ?? "P").charAt(0).toUpperCase();
  const brideInitial = (brideNick ?? "W").charAt(0).toUpperCase();

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-[#FAF6F0] px-4 py-8 text-center ${
        closing ? "rm-out" : ""
      }`}
      role="dialog"
      aria-label="Buka undangan pernikahan"
    >
      <style>{ROMAN_GATE_STYLES}</style>

      {/* Sapuan cahaya hangat Mediterania di latar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,253,247,0.95) 0%, rgba(247,240,230,0.85) 60%, rgba(238,226,210,0.95) 100%)",
        }}
      />

      {/* Ilustrasi Istana Romawi samar sebagai latar atmosferik */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-10 flex items-center justify-center opacity-25"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/palace.webp"
          alt=""
          className="max-h-[650px] w-auto max-w-full object-contain"
        />
      </div>

      {/* Bunga sudut kiri atas — sway angin sepoi */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/roman/corner-rose.webp"
        alt=""
        aria-hidden
        className="rm-sway-left pointer-events-none absolute -left-4 -top-4 z-20 w-36 sm:w-48"
      />

      {/* Bunga sudut kanan atas (mirror) — sway arah berlawanan */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 z-20 block w-36 sm:w-48"
        style={{ transform: "scaleX(-1)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-rose.webp"
          alt=""
          className="rm-sway-left w-full"
          style={{ animationDelay: "0.8s" }}
        />
      </span>

      {/* Konten Utama Gerbang */}
      <div className="relative z-20 flex w-full max-w-md flex-col items-center px-4">
        {/* Monogram / Inisial Romawi Klasik */}
        <div
          className="rm-fade-up inline-flex items-center justify-center rounded-full border border-[#C59B27]/40 bg-white/80 px-5 py-1.5 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="font-[family-name:var(--font-serif-elegant)] text-xs font-semibold uppercase tracking-[0.3em] text-[#7A2021]">
            Villa Romana • Matrimonio
          </span>
        </div>

        {/* The Wedding of */}
        <p
          className="rm-fade-up mt-4 font-[family-name:var(--font-script)] text-3xl text-[#7A2021] sm:text-4xl"
          style={{ animationDelay: "0.3s" }}
        >
          The Wedding of
        </p>

        {/* Nama Pasangan Mempelai */}
        <h1
          className="rm-fade-up mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold uppercase tracking-wider text-[#2A1B18] sm:text-4xl"
          style={{ animationDelay: "0.45s" }}
        >
          {groomNick ?? "Groom"} <span className="font-normal text-[#C59B27]">&amp;</span> {brideNick ?? "Bride"}
        </h1>

        {/* Centerpiece: Amplop Segel Lilin Daun Dafnah (Laurel Wax Seal) */}
        <div
          className="rm-fade-up rm-float relative my-6 w-56 max-w-[80vw] sm:w-64"
          style={{ animationDelay: "0.6s" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/roman/envelope-wax.webp"
            alt="Undangan Pernikahan"
            className="w-full drop-shadow-[0_18px_32px_rgba(122,32,33,0.18)]"
          />
          {/* Inisial monogram di atas amplop */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span
              className="font-[family-name:var(--font-serif-elegant)] text-lg font-bold tracking-widest text-[#FFF8ED]"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              {groomInitial} &bull; {brideInitial}
            </span>
          </div>
        </div>

        {/* Kartu Penerima Undangan (Tamu) */}
        <div
          className="rm-fade-up relative w-full max-w-xs rounded-2xl border border-[#C59B27]/30 bg-white/85 p-4 shadow-[0_8px_24px_rgba(74,30,20,0.06)] backdrop-blur-sm"
          style={{ animationDelay: "0.75s" }}
        >
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7A2021] px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm"
          >
            Kepada Yth.
          </span>
          <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-[#2A1B18]">
            {guestName ?? "Tamu Undangan"}
          </p>
          <p className="mt-0.5 text-[11px] italic text-[#6B554D]">
            Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di hari bahagia kami.
          </p>
        </div>

        {/* Tombol Buka Undangan Bergaya Wax Seal Romawi */}
        <button
          type="button"
          onClick={handleOpen}
          className="rm-btn-in group relative mt-7 flex items-center justify-center gap-2.5 rounded-full px-10 py-3.5 font-[family-name:var(--font-serif-elegant)] text-base font-bold uppercase tracking-wider text-white shadow-xl transition-all duration-300 hover:scale-[1.04] active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8B263E 0%, #7A2021 55%, #591617 100%)",
            border: "2px solid #C59B27",
          }}
          aria-label="Buka Undangan Pernikahan"
        >
          {/* Efek kilau emas */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          />
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#C59B27] text-white shadow-inner">
            <span className="text-[10px]">&#10084;</span>
          </span>
          <span className="relative tracking-[0.16em]">Buka Undangan</span>
        </button>
      </div>

      {/* Garland Peony & Mawar bawah — membingkai tepi bawah */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-8 z-10 flex justify-center overflow-hidden opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/garland-peony.webp"
          alt=""
          className="rm-sway-left-soft max-h-36 w-auto object-cover"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSS Khusus Gerbang Roman                                            */
/* ------------------------------------------------------------------ */
const ROMAN_GATE_STYLES = `
  @keyframes rmFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .rm-fade-up {
    opacity: 0;
    animation: rmFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes rmFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-7px); }
  }
  .rm-float {
    animation: rmFloat 5s ease-in-out infinite;
  }
  /* Goyangan bunga ditiup angin Mediterania */
  @keyframes rmSwayLeft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    35% { transform: rotate(-3.5deg) translate(-2px, -1px); }
    70% { transform: rotate(-1deg) translate(-1px, 0); }
  }
  .rm-sway-left {
    transform-origin: 15% 15%;
    animation: rmSwayLeft 5.8s ease-in-out infinite;
  }
  @keyframes rmSwayLeftSoft {
    0%, 100% { transform: rotate(0deg) translateY(0); }
    50% { transform: rotate(-1.5deg) translateY(-2px); }
  }
  .rm-sway-left-soft {
    transform-origin: 50% 90%;
    animation: rmSwayLeftSoft 6.5s ease-in-out infinite;
  }
  @keyframes rmBtnGlow {
    0%, 100% { box-shadow: 0 0 16px rgba(197,155,39,0.35), 0 8px 24px rgba(122,32,33,0.35); }
    50% { box-shadow: 0 0 28px rgba(197,155,39,0.65), 0 10px 28px rgba(122,32,33,0.45); }
  }
  .rm-btn-in {
    opacity: 0;
    animation:
      rmFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.95s forwards,
      rmBtnGlow 3s ease-in-out 1.8s infinite;
  }
  @keyframes rmOut {
    to { opacity: 0; transform: scale(1.04); }
  }
  .rm-out {
    animation: rmOut 700ms ease forwards;
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .rm-fade-up, .rm-btn-in { opacity: 1 !important; transform: none !important; animation: none !important; }
    .rm-sway-left, .rm-sway-left-soft, .rm-float { animation: none !important; }
  }
`;

