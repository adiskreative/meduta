"use client";

import { useEffect, useState } from "react";
import { Flower2, MailOpen } from "lucide-react";
import { formatDate } from "./types";

/**
 * FlowerGate — gerbang khusus template Enchanted Flower Garden.
 * Sesuai referensi: latar gradasi pink-lavender-peach, dua pintu bunga
 * kiri-kanan yang bergeser membuka saat tombol ditekan, kartu glass di
 * tengah dengan badge bunga berputar, nama pasangan script gradasi,
 * kotak tamu, dan tombol gradasi rose-coral-purple.
 *
 * Fitur Meduta tetap utuh: nama tamu dari link undangan, animasi buka
 * lalu onOpen (musik mulai, scroll lepas).
 */

/* Latar pintu: gradasi pink lembut + ornamen bunga sway.
 * Pintu membawa SELURUH visual gerbang (gradasi, glow, ornamen)
 * dengan teknik irisan 200% — saat ditarik terbuka, template di
 * belakangnya yang terlihat (bukan latar gerbang). Sengaja TANPA foto:
 * foto gerbang (user/mempelai) tidak dipakai di sini karena bentrok
 * dengan estetika pastel taman bunga — sesuai referensi aslinya. */
function GateDoor({
  side,
  closing,
}: {
  side: "left" | "right";
  closing: boolean;
}) {
  const isLeft = side === "left";
  return (
    <div
      className={`absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} w-1/2 overflow-hidden`}
      style={{
        transform: closing
          ? `translateX(${isLeft ? "-100%" : "100%"})`
          : "translateX(0)",
        transition: "transform 1.1s cubic-bezier(0.7, 0, 0.25, 1)",
        willChange: "transform",
      }}
    >
      {/* Gradasi penuh selebar gerbang (200% lebar pintu) */}
      <div
        className="absolute inset-y-0 w-[200%]"
        style={{
          [isLeft ? "left" : "right"]: 0,
          background:
            "linear-gradient(135deg, #ffe3ef 0%, #fde8e4 30%, #f3e4f9 60%, #ffe9dd 100%)",
        }}
      />
      {/* Glow ambient */}
      <div
        className={`pointer-events-none absolute h-80 w-80 rounded-full bg-rose-300/40 ${
          isLeft ? "-left-16 -top-16" : "-right-16 -bottom-16"
        }`}
        style={{ filter: "blur(64px)" }}
      />
      {/* Ornamen setengah bunga di tepi tengah pintu */}
      <svg
        viewBox="0 0 100 200"
        className={`absolute top-1/2 h-72 w-24 -translate-y-1/2 text-rose-300/50 ${
          isLeft ? "right-3" : "left-3"
        }`}
        fill="currentColor"
        style={{ animation: "flowerSway 4s ease-in-out infinite" }}
      >
        <path d="M10,10 Q50,100 10,190 Q90,100 10,10 Z" />
      </svg>
      {/* Kelopak kecil tersebar */}
      <div
        className="absolute left-6 top-16 h-3 w-3 rounded-full bg-pink-300/60"
        style={{ animation: "flowerSway 5s ease-in-out infinite" }}
      />
      <div
        className={`absolute bottom-24 h-2.5 w-2.5 rounded-full bg-purple-300/60 ${
          isLeft ? "right-10" : "left-10"
        }`}
        style={{ animation: "flowerSway 6s ease-in-out infinite" }}
      />
    </div>
  );
}

export default function FlowerGate({
  eventName = "The Wedding Of",
  groomNick,
  brideNick,
  eventDate,
  guestName,
  onOpen,
  embedded = false,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
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
    // Pintu ditarik terbuka dulu (1.1 dtk); parent (unmount + musik +
    // scroll) baru dipanggil setelah animasi selesai agar pintu tidak
    // terpotong mendadak di tengah animasi.
    window.setTimeout(() => {
      onOpen?.();
      setOpen(true);
    }, 1150);
  };

  const names = `${groomNick ?? "Pria"} & ${brideNick ?? "Wanita"}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden p-4 text-center"
      role="dialog"
      aria-label="Buka undangan"
    >
      {/* Kartu konten di tengah — SOLID (tanpa backdrop-blur agar teks
          selalu tajam; blur pada elemen ber-teks dirender kabur oleh
          rasterisasi layer Chromium) — memudar cepat saat pintu mulai tertarik */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border-2 border-white p-8 text-center shadow-[0_20px_40px_rgba(123,44,191,0.18)] sm:p-10"
        style={{
          background:
            "linear-gradient(160deg, #fff7fb 0%, #fff4f0 55%, #f9f4fd 100%)",
          transform: closing ? "scale(0.92)" : "scale(1)",
          opacity: closing ? 0 : 1,
          transition: "transform 450ms ease, opacity 450ms ease",
        }}
      >
        {/* Badge bunga */}
        <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 via-orange-400 to-amber-300 p-1 shadow-lg">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            <Flower2
              className="h-10 w-10 text-rose-500"
              style={{ animation: "flowerSpin 18s linear infinite" }}
            />
          </div>
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-purple-800">
          {eventName}
        </p>
        <h1
          className="mb-3 text-4xl font-bold leading-tight sm:text-5xl"
          style={{
            fontFamily: "var(--font-script)",
            background:
              "linear-gradient(135deg, #e60067 0%, #ff5232 40%, #8b008b 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {names}
        </h1>

        {eventDate && (
          <p className="text-xs font-medium tracking-[0.25em] text-gray-600">
            {formatDate(eventDate)}
          </p>
        )}

        {/* Kotak tamu */}
        <div className="my-6 rounded-2xl border border-orange-200/80 bg-white p-4 shadow-inner">
          <p className="mb-1 text-xs text-gray-500">
            Kepada Yth. Bapak/Ibu/Saudara/i:
          </p>
          <h3 className="font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-purple-950">
            {guestName ?? "Tamu Undangan Spesial"}
          </h3>
          <p className="mt-1 text-xs font-medium text-orange-500">Di Tempat</p>
        </div>

        {/* Tombol buka */}
        <button
          type="button"
          onClick={handleOpen}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
        >
          {/* Efek ripple hover */}
          <span className="absolute h-0 w-0 rounded-full bg-white opacity-20 transition-all duration-500 ease-out group-hover:h-56 group-hover:w-56" />
          <MailOpen className="mr-2 h-5 w-5 animate-pulse" />
          <span className="tracking-wide">Buka Undangan</span>
        </button>
      </div>

      {/* Dua pintu penutup penuh — membawa seluruh visual, ditarik terbuka saat tombol ditekan */}
      <GateDoor side="left" closing={closing} />
      <GateDoor side="right" closing={closing} />
    </div>
  );
}
