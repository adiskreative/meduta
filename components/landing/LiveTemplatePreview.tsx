"use client";

import THUMBS_META from "@/lib/thumbs-meta.json";
import {
  THUMB_PHONE_W,
  THUMB_BORDER,
  THUMB_SCREEN_W,
  THUMB_SCALE,
  THUMB_SCREEN_H,
  THUMB_INNER_H,
} from "@/lib/thumb-constants";

/**
 * Thumbnail template hemat resource:
 * - Isi bingkai ponsel adalah SCREENSHOT STATIS full-halaman template
 *   (public/thumbs/<key>.webp, hasil tangkapan Chrome headless dari
 *   /preview/<key>?shot=1) — nol iframe, nol render React per kartu.
 * - Pan hover memakai CSS :hover MURNI (compositor-driven): gambar
 *   bergeser ping-pong naik-turun selama kursor di atas kartu. Tanpa
 *   JS per frame, tanpa state animasi — berhenti otomatis saat kursor
 *   pergi/tab tidak aktif, dan dihormati prefers-reduced-motion.
 * - Dimensi gambar diambil dari lib/thumbs-meta.json (manifest statis,
 *   diregenerasi scripts/generate-thumbs.mjs) sehingga animasi presisi
 *   tanpa menunggu event onLoad.
 * - Fallback otomatis ke iframe live (?embed=1) bila thumbnail belum ada.
 * - Regenerasi: node scripts/generate-thumbs.mjs
 */

// Semua dimensi dari lib/thumb-constants.ts — satu sumber kebenaran
// bersama mode ?shot=1, sehingga thumbnail & live tidak mungkin beda.
const PHONE_W = THUMB_PHONE_W;
const BORDER = THUMB_BORDER;
const SCREEN_W = THUMB_SCREEN_W;
const SCALE = THUMB_SCALE;
const SCREEN_H = THUMB_SCREEN_H;
const INNER_H = THUMB_INNER_H;
const FRAME_H = SCREEN_H + BORDER * 2;

type Meta = { w: number; h: number };
const META = THUMBS_META as Record<string, Meta>;

export default function LiveTemplatePreview({ templateKey }: { templateKey: string }) {
  const meta = META[templateKey];
  const hasThumb = !!meta;

  // Tinggi tampil gambar pada lebar PHONE_W, lalu jarak pan setelah diskala
  const displayedH = meta ? (meta.h * PHONE_W) / meta.w : 0;
  const maxShift = Math.max(0, Math.round(displayedH * SCALE - SCREEN_H));
  const canPan = maxShift >= 8;
  // Durasi bolak-balik proporsional panjang halaman (dibatasi 6–14 detik)
  const dur = Math.min(14, Math.max(6, displayedH / 24));

  return (
    <div
      className="meduta-thumb-frame relative overflow-hidden rounded-[2.25rem] border-[10px] border-zinc-900 bg-black shadow-2xl"
      style={{ width: SCREEN_W + BORDER * 2, height: FRAME_H }}
    >
      {hasThumb ? (
        <>
          {/* Keyframes + hover rule — nilai presisi per kartu (skala & jarak) */}
          <style>{`
            @keyframes meduta-thumb-pan-${templateKey} {
              0%, 100% { transform: translateY(0px) scale(${SCALE}); }
              50% { transform: translateY(-${maxShift}px) scale(${SCALE}); }
            }
            ${
              canPan
                ? `.meduta-thumb-frame:hover .meduta-thumb-img-${templateKey} { animation: meduta-thumb-pan-${templateKey} ${dur}s ease-in-out infinite; }`
                : ""
            }
            @media (prefers-reduced-motion: reduce) {
              .meduta-thumb-img-${templateKey} { animation: none !important; }
            }
          `}</style>

          {/* Notch ponsel */}
          <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />

          <div
            className="absolute left-0 top-0 origin-top-left overflow-hidden"
            style={{ width: PHONE_W, height: INNER_H }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/thumbs/${templateKey}.webp`}
              alt={`Tampilan template ${templateKey}`}
              width={PHONE_W}
              height={Math.round(displayedH)}
              className={`meduta-thumb-img-${templateKey} pointer-events-none block origin-top-left select-none`}
              draggable={false}
              style={{ width: PHONE_W, height: "auto", transform: `scale(${SCALE})` }}
            />
          </div>
        </>
      ) : (
        <>
          {/* Fallback: iframe live bila thumbnail statis belum tersedia */}
          <style>{`
            @media (prefers-reduced-motion: reduce) {
              .meduta-thumb-live { animation: none !important; }
            }
          `}</style>
          <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
          <div
            className="meduta-thumb-live absolute left-0 top-0 origin-top-left"
            style={{ width: PHONE_W, height: INNER_H, transform: `scale(${SCALE})` }}
          >
            <iframe
              src={`/preview/${templateKey}?embed=1`}
              title={`Pratinjau live template ${templateKey}`}
              loading="lazy"
              tabIndex={-1}
              className="pointer-events-none block border-0"
              style={{ width: PHONE_W, height: INNER_H }}
            />
          </div>
        </>
      )}
    </div>
  );
}
