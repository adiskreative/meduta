"use client";

import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { formatDate } from "./types";
import {
  ASSET_FLOWER_PINK,
  ASSET_WEDDING_LOGO,
  BRAND_BG,
} from "./berkreative-assets";

/**
 * Halaman "Buka Undangan" Berkreative Royale.
 *
 * Dibuat khusus agar senada dengan cover utama: latar navy berpola daun,
 * cahaya fuchsia-pink-violet, karangan rose putih di dua sudut, logo script
 * "the Wedding of", nama display + ampersand emas, kartu kaca, dan tombol
 * gradasi fuchsia. Foto gerbang (jika diatur user/admin) tetap dipakai
 * sebagai latar penuh dengan tirai warna brand agar tidak keluar tema.
 */
export default function BerkreativeGate({
  eventName = "Undangan Pernikahan",
  groomNick,
  brideNick,
  eventDate,
  guestName,
  onOpen,
  backgroundUrl,
  photoUrl,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  onOpen?: () => void;
  backgroundUrl?: string;
  photoUrl?: string;
}) {
  // Kunci scroll halaman selama gerbang tertutup.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] overflow-hidden bg-[#0b1030] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Buka undangan"
    >
      {/* Foto gerbang > background kustom > pola navy bawaan */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl || backgroundUrl || BRAND_BG}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 38%" }}
      />

      {/* Tirai warna brand supaya foto apa pun tetap menyatu dengan cover */}
      <div className="absolute inset-0 bg-[#0b1030]/40" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,16,48,0.82) 0%, rgba(26,11,46,0.56) 42%, rgba(45,10,36,0.92) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 16% 4%, rgba(217,70,239,0.36), transparent 46%), radial-gradient(ellipse at 86% 24%, rgba(59,130,246,0.24), transparent 48%), radial-gradient(ellipse at 50% 98%, rgba(244,63,94,0.32), transparent 55%)",
        }}
      />

      {/* Rose putih di dua sudut — sama seperti cover utama */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSET_FLOWER_PINK}
        alt=""
        aria-hidden
        className="animate-float-slow pointer-events-none absolute -left-8 -top-2 z-0 w-72 opacity-95 drop-shadow-[0_8px_24px_rgba(236,72,153,0.45)] sm:w-96"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-2 -right-8 z-0 block w-72 sm:w-96"
        style={{ transform: "scale(-1, -1)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSET_FLOWER_PINK}
          alt=""
          className="animate-float-slower block w-full opacity-95 drop-shadow-[0_8px_24px_rgba(236,72,153,0.45)]"
        />
      </span>

      {/* Bingkai ganda: putih tipis + emas samar */}
      <div className="pointer-events-none absolute inset-3 rounded-[2.5rem] border border-white/20 sm:inset-5" />
      <div className="pointer-events-none absolute inset-5 rounded-[2rem] border border-amber-200/15 sm:inset-7" />

      <div className="relative z-10 flex h-full flex-col overflow-y-auto px-7 py-8 text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="m-auto flex w-full max-w-md flex-col items-center md:max-w-lg">
          {/* Logo script dibuat putih agar terbaca di atas latar gelap */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSET_WEDDING_LOGO}
            alt=""
            className="animate-float-slow w-44 [filter:brightness(0)_invert(1)] drop-shadow-[0_8px_28px_rgba(236,72,153,0.6)] sm:w-52 md:w-60 [@media(min-height:900px)]:w-64"
          />

          <p className="animate-fade-up mt-3 text-[10px] font-semibold uppercase tracking-[0.42em] text-fuchsia-200 md:mt-4">
            {eventName}
          </p>

          <h1 className="animate-fade-up-delay-1 mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl md:text-6xl [@media(min-height:900px)]:text-7xl">
            {groomNick ?? "Pria"}
            <span className="text-gold-shimmer mx-2 inline-block font-[family-name:var(--font-script)] text-4xl font-normal sm:text-5xl md:text-6xl [@media(min-height:900px)]:text-7xl">
              &amp;
            </span>
            {brideNick ?? "Wanita"}
          </h1>

          {eventDate ? (
            <div className="animate-fade-up-delay-2 mt-5 flex w-full items-center justify-center gap-2 md:mt-7 md:gap-3 [@media(min-height:900px)]:mt-9">
              <span className="h-px max-w-8 flex-1 bg-gradient-to-r from-transparent to-amber-300/70 sm:max-w-16" />
              <p className="whitespace-nowrap text-[10px] uppercase leading-relaxed tracking-[0.16em] text-white/85 sm:text-[11px] sm:tracking-[0.25em]">
                {formatDate(eventDate)}
              </p>
              <span className="h-px max-w-8 flex-1 bg-gradient-to-l from-transparent to-amber-300/70 sm:max-w-16" />
            </div>
          ) : null}

          {guestName ? (
            <div className="animate-fade-up-delay-3 mt-8 w-full max-w-xs rounded-3xl border border-white/25 bg-white/10 p-5 shadow-2xl shadow-fuchsia-900/40 backdrop-blur-md md:mt-10 md:p-6 [@media(min-height:900px)]:mt-12 [@media(min-height:900px)]:p-7">
              <p className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-200">
                Kepada Yth.
              </p>
              <p className="mt-1 break-words font-[family-name:var(--font-script)] text-3xl text-white md:text-4xl">
                {guestName}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onOpen?.()}
            className="animate-fade-up-delay-4 group mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-white shadow-2xl shadow-pink-600/45 ring-1 ring-amber-200/40 transition-all duration-300 hover:scale-[1.04] hover:from-fuchsia-500 hover:via-pink-500 hover:to-rose-400 active:scale-95 md:mt-10 md:px-10 md:py-4 md:text-base [@media(min-height:900px)]:mt-12"
          >
            <BookOpen className="h-4 w-4 text-amber-200 transition-transform duration-300 group-hover:-rotate-12" />
            Buka Undangan
          </button>

          <p className="mt-4 text-[9px] uppercase tracking-[0.34em] text-white/45 md:mt-6 [@media(min-height:900px)]:mt-8">
            Meduta · Undangan Digital
          </p>
        </div>
      </div>
    </div>
  );
}
