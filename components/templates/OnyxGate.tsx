"use client";

import { useEffect, useState } from "react";
import { OnyxRibbons } from "./OnyxDecor";
import { getGateTitleUrl } from "@/lib/decoration";
import type { Decoration } from "./types";

/**
 * OnyxGate — gerbang template Onyx Elegance, adopsi 1:1 dari Artboard 1
 * referensi "black elegan.svg":
 * - Latar onyx pekat #202020 + buket bunga di 4 sudut.
 * - Judul neon script (aset kaligrafi admin "the"; fallback teks neon).
 * - Karangan bunga putih (wreath) dengan inisial pasangan di tengah.
 * - "Kepada Yth. :" + nama tamu SERIF KAPITAL (tanpa kotak).
 * - Tombol pink terisi (aset asli) dengan teks script "Buka Undangan".
 * - Animasi CSS murni: fade-up, neon flicker, wreath scale-in, debu.
 */

function GoldDust({ count = 20 }: { count?: number }) {
  const specks = Array.from({ length: count }, (_, i) => {
    const seed = (i * 7919) % 100;
    return {
      left: `${(seed * 0.97 + 1.5) % 100}%`,
      top: `${(seed * 1.31 + 3) % 100}%`,
      size: 2 + ((i * 13) % 4),
      delay: `${(i % 10) * 1.1}s`,
      duration: `${9 + (i % 7)}s`,
      gold: i % 3 === 0,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {specks.map((s, i) => (
        <span
          key={i}
          className="onyx-dust absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
            background: s.gold ? "#fbbf24" : "#F50260",
            boxShadow: s.gold
              ? "0 0 6px rgba(251,191,36,.8)"
              : "0 0 6px rgba(245,2,96,.8)",
          }}
        />
      ))}
    </div>
  );
}

export default function OnyxGate({
  eventName = "The Wedding Of",
  groomNick,
  brideNick,
  guestName,
  onOpen,
  embedded = false,
  decorations,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  onOpen?: () => void;
  embedded?: boolean;
  decorations?: Decoration[];
}) {
  const [open, setOpen] = useState(embedded);
  const [closing, setClosing] = useState(false);
  // Judul kaligrafi dari aset admin (nama "the"); undefined = fallback teks
  // Catatan: hook harus di atas early-return `if (open)` agar urutan hook stabil
  const [titleError, setTitleError] = useState(false);

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
  // Judul kaligrafi dari aset admin (nama "the"); undefined = fallback teks
  const titleUrl = getGateTitleUrl(decorations);

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden ${closing ? "onyx-out" : ""}`}
      style={{ background: "#202020" }}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{ONYX_GATE_STYLES}</style>

      {/* Tekstur gradasi radial halus (inline — bukan backdrop-blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 32%, rgba(245,2,96,0.10) 0%, rgba(32,32,32,0) 55%)",
        }}
      />

      <GoldDust />

      {/* Buket bunga di 4 sudut — penempatan ala SVG asli */}
      <OnyxRibbons />

      {/* Konten tengah — hierarki Artboard 1 */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* Judul: aset kaligrafi admin bila ada, fallback teks neon */}
        {titleUrl && !titleError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={titleUrl}
            alt={eventName}
            className="onyx-title-in w-40 sm:w-48"
            onError={() => setTitleError(true)}
          />
        ) : (
          <>
            <h1
              className="onyx-fade-up onyx-neon text-5xl leading-[1.1] sm:text-6xl"
              style={{ fontFamily: "var(--font-script)", animationDelay: "0.15s" }}
            >
              the
              <br />
              Wedding
              <span className="mx-1 inline-block align-middle text-2xl sm:text-3xl">of</span>
            </h1>
            <span className="onyx-fade-up onyx-neon-line mt-1 block h-px w-44" style={{ animationDelay: "0.35s" }} />
          </>
        )}

        {/* Karangan bunga putih + inisial pasangan (Artboard 1) */}
        <div
          className="onyx-wreath-in relative mt-6 flex w-56 items-center justify-center sm:w-64"
          style={{ animationDelay: "0.5s" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/onyx-wreath.webp"
            alt=""
            aria-hidden
            className="onyx-wreath-live w-full"
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-4xl text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-script)", textShadow: "0 2px 14px rgba(0,0,0,0.6)" }}
          >
            {initials}
          </span>
        </div>

        {/* Kepada Yth. + nama tamu kapital (tanpa kotak, ala Artboard 1) */}
        <p
          className="onyx-fade-up mt-6 font-[family-name:var(--font-serif-elegant)] text-xs italic tracking-wide text-white/70"
          style={{ animationDelay: "0.7s" }}
        >
          Kepada Yth. :
        </p>
        <p
          className="onyx-fade-up mt-1.5 font-[family-name:var(--font-serif-elegant)] text-lg font-bold uppercase tracking-[0.18em] text-white sm:text-xl"
          style={{ animationDelay: "0.85s" }}
        >
          {guestName ?? "Tamu Undangan"}
        </p>

        {/* Tombol pink terisi (aset asli _Image5) dengan teks script */}
        <button
          type="button"
          onClick={handleOpen}
          className="onyx-fade-up onyx-btn group relative mt-8 block transition-transform duration-300 hover:scale-[1.04] active:scale-95"
          style={{ animationDelay: "1s" }}
          aria-label="Buka Undangan"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/onyx-label.webp"
            alt=""
            aria-hidden
            className="onyx-btn-glow h-14 w-auto sm:h-16"
          />
          <span
            className="absolute inset-0 flex items-center justify-center pb-1.5 text-2xl text-white sm:text-[28px]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Buka Undangan
          </span>
        </button>
      </div>
    </div>
  );
}

/* CSS gerbang: fade-up bertahap, neon flicker, wreath scale-in, glow
 * tombol, partikel debu, keluar fade-scale */
const ONYX_GATE_STYLES = `
  @keyframes onyxFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .onyx-fade-up {
    opacity: 0;
    animation: onyxFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes onyxShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .onyx-shimmer {
    background-image: linear-gradient(110deg, #ffffff 30%, #ffd7e6 45%, #F50260 50%, #ffd7e6 55%, #ffffff 70%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: onyxShimmer 5s linear infinite;
    text-shadow: none;
    filter: drop-shadow(0 0 14px rgba(245,2,96,0.35));
  }
  @keyframes onyxNeonFlicker {
    0%, 100% { opacity: 1; }
    41% { opacity: 1; }
    42% { opacity: 0.6; }
    43% { opacity: 1; }
    45% { opacity: 0.75; }
    46% { opacity: 1; }
  }
  .onyx-neon {
    color: #ffffff;
    text-shadow:
      0 0 6px rgba(255,255,255,0.55),
      0 0 18px rgba(245,2,96,0.55),
      0 0 42px rgba(245,2,96,0.35);
    animation:
      onyxFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards,
      onyxNeonFlicker 6s linear 1.2s infinite;
  }
  .onyx-neon-line {
    background: linear-gradient(to right, rgba(245,2,96,0) 0%, #F50260 50%, rgba(245,2,96,0) 100%);
    box-shadow: 0 0 12px rgba(245,2,96,0.6);
  }
  /* Judul kaligrafi: fade-up lalu glow — SATU deklarasi animation */
  .onyx-title-in {
    opacity: 0;
    animation:
      onyxFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards,
      onyxGlowPulse 4.5s ease-in-out 1.6s infinite;
  }
  @keyframes onyxGlowPulse {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(245,2,96,0.4)); }
    50% { filter: drop-shadow(0 0 14px rgba(245,2,96,0.8)); }
  }
  .onyx-glow-soft { animation: onyxGlowPulse 4.5s ease-in-out infinite; }
  @keyframes onyxWreathIn {
    from { opacity: 0; transform: scale(0.82); }
    to { opacity: 1; transform: scale(1); }
  }
  .onyx-wreath-in {
    opacity: 0;
    animation: onyxWreathIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes onyxFloatY {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .onyx-float { animation: onyxFloatY 5.5s ease-in-out 1.4s infinite; }
  /* Wreath hidup: melayang + bergoyang lembut — SATU deklarasi animation
     (float + sway digabung dalam satu keyframe agar tidak saling menimpa). */
  @keyframes onyxWreathSway {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    35% { transform: translateY(-7px) rotate(2.2deg); }
    70% { transform: translateY(-2px) rotate(-1.6deg); }
  }
  .onyx-wreath-live { animation: onyxWreathSway 6.8s ease-in-out 1.6s infinite; }
  @media (prefers-reduced-motion: reduce) {
    .onyx-wreath-live { animation: none !important; }
  }
  @keyframes onyxDustRise {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    15% { opacity: 0.9; }
    85% { opacity: 0.5; }
    100% { transform: translateY(-110px) translateX(14px); opacity: 0; }
  }
  .onyx-dust { animation: onyxDustRise linear infinite; }
  @keyframes onyxRibbonIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .onyx-ribbon-in { animation: onyxRibbonIn 1.2s ease both; }
  @keyframes onyxBtnGlow {
    0%, 100% { filter: drop-shadow(0 0 6px rgba(245,2,96,0.35)); }
    50% { filter: drop-shadow(0 0 18px rgba(245,2,96,0.65)); }
  }
  .onyx-btn-glow { animation: onyxBtnGlow 3s ease-in-out infinite; }
  @keyframes onyxHeartBeat {
    0%, 100% { transform: scale(1); }
    12% { transform: scale(1.14); }
    24% { transform: scale(1); }
    36% { transform: scale(1.1); }
  }
  .onyx-heart-beat { animation: onyxHeartBeat 2.4s ease-in-out infinite; }
  @keyframes onyxOut {
    to { opacity: 0; transform: scale(1.05); }
  }
  .onyx-out { animation: onyxOut 700ms ease forwards; pointer-events: none; }
`;
