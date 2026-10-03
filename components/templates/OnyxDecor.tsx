"use client";

import type { CSSProperties } from "react";
import { Heart } from "lucide-react";

/**
 * OnyxDecor — elemen dekor bersama template Onyx Elegance, adopsi
 * referensi "black elegan.svg" (viewBox 0 0 3895 2624, 3 artboard):
 * - Pita/buket bunga sudut (aset _Image1) di 4 sudut, setengah lebar.
 * - OnyxCoupleCircle (Artboard2): foto couple dalam lingkaran dengan
 *   ring emas bertabur bunga kuning melingkarinya.
 * - OnyxPersonFrame (Artboard4): foto persegi dengan backing pink
 *   menjorok ke arah tengah (pasangan kiri-kanan dipisah garis pink).
 * Animasi CSS murni; tanpa backdrop-blur pada teks.
 */

const PINK = "#E5045B";

/* ------------------------------------------------------------------ */
/* Buket bunga sudut — 4 arah, setengah lebar layar                    */
/* ------------------------------------------------------------------ */
export function OnyxRibbons({ animated = true }: { animated?: boolean }) {
  const ribbons: Array<{
    className: string;
    style: CSSProperties;
  }> = [
    {
      // kiri atas
      className: "left-0 top-0",
      style: { transform: "translateX(-15%)" },
    },
    {
      // kanan atas: dicerminkan horizontal
      className: "right-0 top-0",
      style: { transform: "scaleX(-1) translateX(-15%)" },
    },
    {
      // kiri bawah: dicerminkan vertikal
      className: "bottom-0 left-0",
      style: { transform: "scaleY(-1) translateX(-15%)" },
    },
    {
      // kanan bawah: dicerminkan dua arah
      className: "bottom-0 right-0",
      style: { transform: "scale(-1, -1) translateX(-15%)" },
    },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <style>{ONYX_SWAY_STYLES}</style>
      {ribbons.map((r, i) => (
        // Mirror (flip) di wrapper agar sway bunga tidak menimpa transform
        // cermin — animasi angin CSS murni di elemen terpisah (pelajaran:
        // dua penulisan `animation`/`transform` pada elemen sama saling
        // menimpa). Ukuran dinaikkan dari w-1/2 (603px) → 58% (700px)
        // agar buket lebih hadir di sudut layar.
        <span
          key={i}
          className={`absolute block w-[58%] max-w-[700px] ${r.className} ${animated ? "onyx-ribbon-in" : ""}`}
          style={{ ...r.style, animationDelay: `${i * 0.18}s` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/onyx-corner.webp"
            alt=""
            className="ox-sway h-auto w-full"
            style={{
              aspectRatio: "1 / 1",
              animationDelay: `${(i % 2) * 1.7}s`,
              animationDirection: i % 3 === 0 ? "normal" : "reverse",
            }}
          />
        </span>
      ))}
    </div>
  );
}

/* Sway lembut ala angin untuk buket sudut — SATU deklarasi animation per
 * kelas (dua kelas yang sama-sama menulis `animation` saling menimpa;
 * yang terakhir menang → opacity nyangkut). Cermin sudah ditangani
 * wrapper, jadi satu keyframe cukup untuk 4 sudut; variasi arah & jeda
 * via animation-direction/delay inline agar gerak tiap sudut tak seragam. */
const ONYX_SWAY_STYLES = `
  @keyframes onyxSway {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(2.4deg); }
  }
  .ox-sway {
    transform-origin: 50% 88%;
    animation: onyxSway 6.4s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .ox-sway { animation: none !important; }
  }
`;

/* ------------------------------------------------------------------ */
/* Lingkaran couple + ring emas bunga kuning (Artboard2)               */
/* ------------------------------------------------------------------ */
export function OnyxCoupleCircle({
  photo,
  groomPhoto,
  bridePhoto,
  alt = "Foto pasangan",
  className = "",
}: {
  /** Foto couple pilihan user/admin — mengisi penuh lingkaran. */
  photo?: string;
  /** Tanpa foto couple: diptych pria & wanita berdampingan. */
  groomPhoto?: string;
  bridePhoto?: string;
  alt?: string;
  className?: string;
}) {
  const both = groomPhoto && bridePhoto;
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1 / 1" }}>
      {/* Lingkaran foto (±78% kotak — sisakan ruang ring emas) */}
      <div
        className="absolute inset-[11%] overflow-hidden rounded-full"
        style={{
          background: "#241016",
          boxShadow: "0 0 0 2px rgba(229,4,91,0.5), 0 12px 36px rgba(0,0,0,0.55)",
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={alt} className="h-full w-full object-cover object-top" />
        ) : both ? (
          <div className="grid h-full w-full grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={groomPhoto} alt={alt} className="h-full w-full object-cover object-top" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bridePhoto} alt={alt} className="h-full w-full object-cover object-top" />
          </div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(160deg, #3a0a1e 0%, #241016 100%)" }}
          >
            <Heart className="h-14 w-14 fill-current text-[#F50260] onyx-heart-beat" />
          </div>
        )}
      </div>
      {/* Ring emas bertabur bunga kuning melingkari foto (Artboard2).
          Tinggi bebas (h-auto) agar proporsi aset 1078×982 tidak gepeng.
          Diperbesar 104% → 112% agar taburan bunganya lebih menonjol.
          Pemusatan via keyframes (inline transform dipindah ke keyframes
          agar tidak dobel — Tailwind v4 `-translate-*` pakai properti
          `translate`). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/onyx-goldring.webp"
        alt=""
        aria-hidden
        className="onyx-ring-float pointer-events-none absolute left-1/2 top-1/2 z-20 w-[112%]"
      />
      <style>{`
        /* Melayang + goyangan halus — SATU deklarasi animation, semua
           transform (termasuk pemusatan -50%,-50%) hidup di keyframes.
           Animation-fill-mode BOTH wajib: tanpa itu, selama delay 1.8s
           transform keyframes belum berlaku → ring meleset dari pusat. */
        @keyframes onyxRingFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-6px) rotate(2.5deg); }
        }
        .onyx-ring-float { animation: onyxRingFloat 8s ease-in-out 1.8s infinite both; }
        @media (prefers-reduced-motion: reduce) {
          .onyx-ring-float { animation: none !important; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Frame persegi + backing pink (Artboard4)                            */
/* ------------------------------------------------------------------ */
export function OnyxPersonFrame({
  photo,
  alt = "Foto",
  /** Posisi dalam pasangan: "left" backing menjorok kanan-bawah,
   *  "right" cermin (keduanya membentuk pemisah pink di tengah). */
  side = "left",
  className = "",
}: {
  photo?: string;
  alt?: string;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "4 / 5" }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: PINK,
          transform: side === "left" ? "translate(9%, 5%)" : "translate(-9%, 5%)",
        }}
      />
      <div className="absolute inset-0 overflow-hidden" style={{ background: "#241016" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={alt}
            className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(160deg, #3a0a1e 0%, #241016 100%)" }}
          >
            <Heart className="h-10 w-10 fill-current text-[#F50260] onyx-heart-beat" />
          </div>
        )}
      </div>
    </div>
  );
}
