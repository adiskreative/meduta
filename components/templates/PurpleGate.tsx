"use client";

import { useEffect, useState } from "react";

/**
 * PurpleGate — gerbang template Purple Blossom, adopsi Artboard 1
 * referensi "purple flower.svg":
 * - Latar plum gelap #240016.
 * - Buket rose putih menggantung di 2 sudut atas (animasi sway angin).
 * - Arch kain gorden + rangkaian bunga peach (aset _Image13), mirror kiri/kanan.
 * - "The Wedding of" script krem + inisial emas pasangan.
 * - "Kepada Yth. :" + nama tamu, tombol pill krem #DAC8C0.
 * - Monstera + lavender mengapit bawah (kiri & kanan, mirror).
 *
 * ANIMASI DAUN/BUNGA "TERTIUP ANGIN" (permintaan user):
 * - Sway berancha (rotate di origin bawah/batang) + drift horizontal kecil.
 * - ARAH SESUAI SISI: elemen di sisi KIRI bergerak dari kanan-ke-kiri
 *   (rotate negatif); elemen di sisi KANAN dari kiri-ke-kanan (rotate
 *   positif) — seperti angin sepoi bertiup menjauh dari tengah.
 */

const PLUM = "#240016";
const CREAM = "#DAC8C0";
const GOLD = "#E8B54D";

export default function PurpleGate({
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
    window.setTimeout(() => {
      onOpen?.();
      setOpen(true);
    }, 750);
  };

  const initials = `${(groomNick ?? "P").charAt(0).toUpperCase()} & ${(brideNick ?? "W").charAt(0).toUpperCase()}`;

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden ${closing ? "pp-out" : ""}`}
      style={{ background: PLUM }}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{PURPLE_GATE_STYLES}</style>

      {/* Cahaya lembut di tengah atas (radial, bukan blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% 30%, rgba(232,181,77,0.10) 0%, rgba(36,0,22,0) 55%)",
        }}
      />

      {/* Buket rose putih di 2 sudut atas — sway arah angin.
          Kanan memakai FILE flop (purple-bouquet-right.webp), bukan CSS
          mirror — scaleX konflik dengan rotate keyframes.
          Disetaraikan dengan monstera bawah (w-36/w-44) agar massa
          flora atas-bawah seimbang. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/purple-bouquet.webp"
        alt=""
        aria-hidden
        className="pp-sway-left pointer-events-none absolute left-0 top-0 z-20 w-36 sm:w-44"
        style={{ animationDelay: "0.2s" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/purple-bouquet-right.webp"
        alt=""
        aria-hidden
        className="pp-sway-right pointer-events-none absolute right-0 top-0 z-20 w-36 sm:w-44"
        style={{ animationDelay: "0.9s" }}
      />

      {/* Konten tengah — hierarki Artboard 1 */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-28 text-center">
        {/* Arch kain gorden UTUH (aset _Image3, kain + bunga peach) —
            judul & inisial emas di DALAM lengkungannya (ala A1). */}
        <div className="pp-fade-up relative mt-2 h-[360px] w-full max-w-[340px]" style={{ animationDelay: "0.2s" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/purple-arch.webp"
            alt=""
            aria-hidden
            className="pp-arch-sway absolute inset-x-0 top-0 z-10 mx-auto w-[96%]"
          />
          {/* Judul + inisial emas di tengah arch — warna SOLID + glow
              (background-clip:text tak andal untuk elemen kritis) */}
          <div className="absolute inset-x-0 top-[34%] z-20 flex flex-col items-center">
            <p
              className="pp-fade-up text-[13px] italic text-[#DAC8C0]/90"
              style={{ fontFamily: "var(--font-script)", animationDelay: "0.55s" }}
            >
              The
            </p>
            <h1
              className="pp-fade-up text-4xl leading-tight text-[#DAC8C0] sm:text-5xl"
              style={{
                fontFamily: "var(--font-script)",
                textShadow: "0 0 16px rgba(218,200,192,0.45), 0 2px 6px rgba(0,0,0,0.5)",
                animationDelay: "0.7s",
              }}
            >
              Wedding
            </h1>
            <p
              className="pp-fade-up text-sm italic text-[#DAC8C0]/90"
              style={{ fontFamily: "var(--font-script)", animationDelay: "0.85s" }}
            >
              of
            </p>
            <p
              className="pp-fade-up mt-2 text-5xl text-[#E8B54D] sm:text-6xl"
              style={{
                fontFamily: "var(--font-script)",
                textShadow: "0 0 18px rgba(232,181,77,0.55), 0 2px 8px rgba(0,0,0,0.5)",
                animationDelay: "1s",
              }}
            >
              {initials}
            </p>
          </div>
        </div>

        {/* Kepada Yth. + nama tamu */}
        <p
          className="pp-fade-up mt-10 text-xs italic tracking-wide text-[#DAC8C0]/70"
          style={{ animationDelay: "1.15s" }}
        >
          Kepada Yth :
        </p>
        <p
          className="pp-fade-up mt-1.5 max-w-[280px] text-lg font-medium leading-snug text-[#F3E9E4] sm:text-xl"
          style={{ animationDelay: "1.3s" }}
        >
          {guestName ?? "Tamu Undangan"}
        </p>

        {/* Tombol pill krem */}
        <button
          type="button"
          onClick={handleOpen}
          className="pp-btn-in group relative mt-9 rounded-full px-12 py-3.5 text-lg font-bold text-[#4a2c3a] shadow-xl transition-transform duration-300 hover:scale-[1.05] active:scale-95"
          style={{ background: CREAM }}
          aria-label="Buka Undangan"
        >
          <span className="relative z-10">Buka Undangan</span>
        </button>
      </div>

      {/* Monstera + lavender mengapit bawah — sway arah sesuai sisi.
          Diperbesar agar flora lebih hidup mengisi tepi bawah. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64">
        {/* KIRI: monstera + lavender — bergerak kanan→kiri */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/purple-lavender.webp"
          alt=""
          className="pp-sway-left absolute bottom-0 left-[5%] w-20 sm:w-24"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/purple-monstera.webp"
          alt=""
          className="pp-sway-left absolute bottom-0 left-[15%] w-36 sm:w-44"
          style={{ animationDelay: "0.6s" }}
        />
        {/* KANAN: cermin SEMPURNA kiri — mirror via wrapper scaleX(-1)
            (terpisah dari elemen ber-animasi agar tidak saling menimpa);
            img memakai kelas & delay yang sama dengan kiri → gerak
            ter-cerminkan otomatis, komposisi seimbang. */}
        <span
          className="absolute bottom-0 right-[15%] block w-36 sm:w-44"
          style={{ transform: "scaleX(-1)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/purple-monstera.webp"
            alt=""
            className="pp-sway-left w-full"
            style={{ animationDelay: "0.6s" }}
          />
        </span>
        <span
          className="absolute bottom-0 right-[5%] block w-20 sm:w-24"
          style={{ transform: "scaleX(-1)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/purple-lavender.webp" alt="" className="pp-sway-left w-full" />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSS gerbang — animasi sway angin dua arah + entrance                */
/* ------------------------------------------------------------------ */
const PURPLE_GATE_STYLES = `
  @keyframes ppFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .pp-fade-up {
    opacity: 0;
    animation: ppFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes ppShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .pp-shimmer {
    background-image: linear-gradient(110deg, #DAC8C0 25%, #ffffff 45%, #E8B54D 55%, #DAC8C0 75%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: ppShimmer 6s linear infinite;
  }
  .pp-gold {
    background-image: linear-gradient(110deg, #E8B54D 20%, #F7DFA6 50%, #E8B54D 80%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: ppShimmer 5s linear infinite;
    filter: drop-shadow(0 2px 12px rgba(232,181,77,0.35));
  }
  /* ANIMASI INTI — daun/bunga tertitiup angin.
     KIRI: dari kanan ke kiri (rotate & translate negatif, origin bawah).
     KANAN: dari kiri ke kanan (cermin). Origin bawah agar goyangan
     seperti batang daun, bukan berputar di pusat gambar.
     Dengan "napas" translateY agar terasa melayang ditiup angin. */
  @keyframes ppSwayLeft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    30% { transform: rotate(-4.5deg) translate(-3px, -2px); }
    65% { transform: rotate(-1.5deg) translate(-1px, 0); }
  }
  @keyframes ppSwayRight {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    30% { transform: rotate(4.5deg) translate(3px, -2px); }
    65% { transform: rotate(1.5deg) translate(1px, 0); }
  }
  .pp-sway-left {
    transform-origin: 50% 92%;
    animation: ppSwayLeft 5.4s ease-in-out infinite;
  }
  .pp-sway-right {
    transform-origin: 50% 92%;
    animation: ppSwayRight 6.1s ease-in-out infinite;
  }
  /* Arch utuh: goyangan sangat lembut terpusat di puncak lengkungan */
  @keyframes ppArchSway {
    0%, 100% { transform: rotate(0deg); }
    30% { transform: rotate(-0.9deg); }
    65% { transform: rotate(0.5deg); }
  }
  .pp-arch-sway {
    transform-origin: 50% 6%;
    animation: ppArchSway 7.2s ease-in-out infinite;
  }
  @keyframes ppBtnGlow {
    0%, 100% { box-shadow: 0 0 18px rgba(232,181,77,0.35), 0 8px 24px rgba(0,0,0,0.4); }
    50% { box-shadow: 0 0 34px rgba(232,181,77,0.6), 0 8px 24px rgba(0,0,0,0.4); }
  }
  /* SATU deklarasi animation: fade-up masuk lalu glow berulang
     (dua kelas terpisah saling menimpa — pelajaran bug onyx) */
  .pp-btn-in {
    opacity: 0;
    animation:
      ppFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.45s forwards,
      ppBtnGlow 3.2s ease-in-out 2.6s infinite;
  }
  @keyframes ppOut {
    to { opacity: 0; transform: scale(1.05); }
  }
  .pp-out { animation: ppOut 700ms ease forwards; pointer-events: none; }
  @media (prefers-reduced-motion: reduce) {
    .pp-sway-left, .pp-sway-right, .pp-arch-sway,
    .pp-btn-in, .pp-shimmer, .pp-gold { animation: none !important; }
    .pp-fade-up, .pp-btn-in { opacity: 1 !important; }
  }
`;
