"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

/**
 * SAKLAR ARAH BUNGA — ubah false -> true untuk membalik:
 * - cornerFlipY   : balik atas-bawah bunga pojok (pangkal bunga di tepi atas layar)
 * - swapCorners   : tukar sisi mirror bunga pojok (kiri jadi mirror, kanan jadi asli)
 * - borderFlipY   : balik atas-bawah border bunga bawah
 * - garlandFlipY  : balik atas-bawah garland atas
 * - garlandFlipX  : balik kiri-kanan garland atas
 */
const FLIP = {
  cornerFlipY: true,
  swapCorners: false,
  borderFlipY: false,
  garlandFlipY: false,
  garlandFlipX: false,
};

// Skala vertikal & poros goyang bunga pojok (poros harus tetap di tepi atas layar)
const CORNER_Y = FLIP.cornerFlipY ? -1 : 1;
const CORNER_ORIGIN = FLIP.cornerFlipY ? "0% 100%" : "0% 0%";

/**
 * RomanGate — Gerbang pembuka template Roman Romance (Villa Romana):
 * - Dikerudungi Garland Peony & Mawar di bagian atas secara proporsional.
 * - Sudut atas diapit karangan mawar & eucalyptus yang bergoyang tertiup angin sepoi.
 * - Centerpiece: Amplop surat vintage dengan segel lilin merah daun dafnah (laurel) & aksen bunga burgundy.
 * - Latar: Istana Romawi watercolor samar di tengah kanvas travertine marmer hangat.
 * - Dasar: Untaian bunga floral-border membingkai tepi bawah secara alami.
 * - Plat nama tamu kehormatan & tombol "Buka Undangan" berefek segel emas bercahaya.
 */

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
      // FIX 1: py-6 -> pt-6 agar border bunga bawah menempel rapat ke tepi layar
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-between overflow-hidden bg-[#FAF6F0] px-4 pt-6 text-center ${
        closing ? "rm-out" : ""
      }`}
      role="dialog"
      aria-label="Buka undangan pernikahan"
    >
      <style>{ROMAN_GATE_STYLES}</style>

      {/* Sapuan cahaya marmer travertine hangat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,253,247,0.96) 0%, rgba(247,240,230,0.88) 60%, rgba(238,226,210,0.96) 100%)",
        }}
      />

      {/* Istana Romawi samar di tengah latar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/palace.webp"
          alt=""
          className="max-h-[520px] w-auto max-w-full object-contain"
        />
      </div>

      {/* Garland Peony Mahkota Atas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{
          transform: `scale(${FLIP.garlandFlipX ? -1 : 1}, ${FLIP.garlandFlipY ? -1 : 1})`,
          transformOrigin: "50% 0%",
        }}
      >
        {/* FIX 2: pakai rm-sway-garland (poros di tepi atas tengah, goyang lebih halus)
            agar garland tetap menempel di tepi atas layar saat bergoyang */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/garland-peony.webp"
          alt=""
          className="rm-sway-garland w-full max-w-[70vw] object-contain drop-shadow-sm sm:w-200"
        />
      </div>

      {/* Bunga sudut kiri atas */}
      {/* FIX 3: pakai rm-sway-corner (poros di pojok) agar bunga tidak menjauh dari tepi layar saat bergoyang */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-2 top-0 z-10 block w-50 opacity-75 sm:w-60"
        style={{ transform: `scale(${FLIP.swapCorners ? -1 : 1}, ${CORNER_Y})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-rose.webp"
          alt=""
          className="rm-sway-corner block w-full"
          style={{ transformOrigin: CORNER_ORIGIN }}
        />
      </span>

      {/* Bunga sudut kanan atas (mirror) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 z-10 block w-50 opacity-75 sm:w-60"
        style={{ transform: `scale(${FLIP.swapCorners ? 1 : -1}, ${CORNER_Y})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-rose.webp"
          alt=""
          className="rm-sway-corner block w-full"
          style={{ animationDelay: "0.8s", transformOrigin: CORNER_ORIGIN }}
        />
      </span>

      {/* Bunga sudut kiri bawah (duplikat bunga pojok atas, dibalik vertikal) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-2 bottom-0 z-[15] block w-50 opacity-75 sm:w-60"
        style={{ transform: `scale(${FLIP.swapCorners ? -1 : 1}, ${-CORNER_Y})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-rose.webp"
          alt=""
          className="rm-sway-corner block w-full"
          style={{ animationDelay: "0.4s", transformOrigin: CORNER_ORIGIN }}
        />
      </span>

      {/* Bunga sudut kanan bawah (mirror dari kiri bawah) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 bottom-0 z-[15] block w-50 opacity-75 sm:w-60"
        style={{ transform: `scale(${FLIP.swapCorners ? 1 : -1}, ${-CORNER_Y})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-rose.webp"
          alt=""
          className="rm-sway-corner block w-full"
          style={{ animationDelay: "1.2s", transformOrigin: CORNER_ORIGIN }}
        />
      </span>

      {/* Spacer Atas agar Garland Peony punya ruang napas */}
      <div className="h-24 sm:h-36 shrink-0" />

      {/* Konten Tengah Gerbang */}
      <div className="relative z-20 flex w-full max-w-md flex-col items-center my-auto px-4">
        {/* Monogram Villa Romana */}
        <div
          className="rm-fade-up inline-flex items-center justify-center rounded-full border border-[#C59B27]/40 bg-white/85 px-4 py-1 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="font-[family-name:var(--font-serif-elegant)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A2021]">
            Villa Romana &bull; Matrimonio
          </span>
        </div>

        {/* The Wedding of */}
        <p
          className="rm-fade-up mt-3 font-[family-name:var(--font-script)] text-3xl text-[#7A2021] sm:text-4xl"
          style={{ animationDelay: "0.3s" }}
        >
          The Wedding of
        </p>

        {/* Nama Pasangan */}
        <h1
          className="rm-fade-up mt-0.5 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wider text-[#2A1B18] sm:text-3xl"
          style={{ animationDelay: "0.45s" }}
        >
          {groomNick ?? "Groom"} <span className="font-normal text-[#C59B27]">&amp;</span> {brideNick ?? "Bride"}
        </h1>

        {/* Centerpiece: Amplop Segel Lilin Merah Daun Dafnah */}
        <div
          className="rm-fade-up rm-float relative my-4 w-48 max-w-[65vw] sm:w-56"
          style={{ animationDelay: "0.6s" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/roman/envelope-wax.webp"
            alt="Undangan Pernikahan"
            className="w-full drop-shadow-[0_16px_28px_rgba(122,32,33,0.18)]"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span
              className="font-[family-name:var(--font-serif-elegant)] text-base font-bold tracking-widest text-[#FFF8ED]"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              {groomInitial} &bull; {brideInitial}
            </span>
          </div>
        </div>

        {/* Kartu Penerima Undangan (Tamu) */}
        <div
          className="rm-fade-up relative w-full max-w-xs rounded-2xl border border-[#C59B27]/30 bg-white/90 p-3.5 shadow-[0_8px_20px_rgba(74,30,20,0.06)] backdrop-blur-sm"
          style={{ animationDelay: "0.75s" }}
        >
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7A2021] px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm"
          >
            Kepada Yth.
          </span>
          <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-lg font-bold text-[#2A1B18] sm:text-xl">
            {guestName ?? "Tamu Undangan"}
          </p>
          <p className="mt-0.5 text-[12px] italic text-[#6B554D]">
            Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di hari bahagia kami.
          </p>
        </div>

        {/* Tombol Buka Undangan */}
        <button
          type="button"
          onClick={handleOpen}
          className="rm-btn-in group relative mt-6 flex items-center justify-center gap-2.5 rounded-full px-9 py-3 font-[family-name:var(--font-serif-elegant)] text-sm font-bold uppercase tracking-wider text-white shadow-xl transition-all duration-300 hover:scale-[1.04] active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8B263E 0%, #7A2021 55%, #591617 100%)",
            border: "5px solid #C59B27",
          }}
          aria-label="Buka Undangan Pernikahan"
        >
          <span className="relative flex h-5 w-10 items-center justify-center rounded-full bg-[#C59B27] text-white shadow-inner">
            <Mail className="h-5 w-7" strokeWidth={2.5} />
          </span>
          <span className="relative tracking-[0.15em]">Buka Undangan</span>
        </button>
      </div>

      {/* Border Bunga Bagian Bawah */}
      {/* FIX 4: h-10/h-14 + object-cover memotong gambar -> h-auto agar utuh dan menempel di dasar */}
      <div
        aria-hidden
        className="pointer-events-none relative z-10 flex w-full max-w-2xl shrink-0 overflow-hidden opacity-85"
        style={{ transform: FLIP.borderFlipY ? "scaleY(-1)" : "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/floral-border.webp"
          alt=""
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSS Gerbang                                                        */
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
    50% { transform: translateY(-6px); }
  }
  .rm-float {
    animation: rmFloat 5s ease-in-out infinite;
  }
  @keyframes rmSwayLeft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    35% { transform: rotate(-3deg) translate(-2px, -1px); }
    70% { transform: rotate(-1deg) translate(-1px, 0); }
  }
  /* Garland: menggantung dari tepi atas tengah, goyang halus tanpa bergeser */
  @keyframes rmSwayGarland {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-1.2deg); }
  }
  .rm-sway-garland {
    transform-origin: 50% 0%;
    animation: rmSwayGarland 6s ease-in-out infinite;
  }
  /* Bunga pojok: poros di pojok layar (kiri-atas gambar), sehingga bunga
     tetap menempel ke sudut. Untuk sisi kanan, poros ikut ter-mirror. */
  .rm-sway-corner {
    transform-origin: 0% 0%;
    animation: rmSwayLeft 5.8s ease-in-out infinite;
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
    .rm-sway-corner, .rm-sway-garland, .rm-float { animation: none !important; }
  }
`;