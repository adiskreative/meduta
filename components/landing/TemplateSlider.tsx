"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TemplateCard, { type TemplateCardData } from "./TemplateCard";

/**
 * Slider template di landing page — paginasi per halaman:
 * - Setiap halaman menampung 6 template (grid 3×2 di desktop, 2×3 di ponsel
 *   dengan zoom ringan agar tetap muat), persis seperti grid lama.
 * - Tombol next/prev + titik indikator bergeser antar halaman dengan
 *   transisi translateX (tanpa library, murah, halus).
 * - Halaman terakhir menampilkan sisa kartu (mis. 8 template = halaman 1
 *   berisi 6, halaman 2 berisi 2).
 */
const PER_PAGE = 6;

export default function TemplateSlider({ templates }: { templates: TemplateCardData[] }) {
  const pages: TemplateCardData[][] = [];
  for (let i = 0; i < templates.length; i += PER_PAGE) {
    pages.push(templates.slice(i, i + PER_PAGE));
  }

  const [page, setPage] = useState(0);
  const total = pages.length;

  // Reset ke halaman pertama bila daftar berubah (mis. hot reload dev)
  useEffect(() => {
    setPage((p) => Math.min(p, total - 1));
  }, [total]);

  const go = (dir: 1 | -1) => setPage((p) => Math.min(total - 1, Math.max(0, p + dir)));

  return (
    <div className="relative">
      {/* Skala kartu agar 2 kolom muat di ponsel & 3 kolom di desktop —
          aturan eksplisit (bukan utility) agar selalu ter-generate */}
      <style>{`
        .meduta-slider-card { zoom: 0.72; }
        @media (min-width: 640px) { .meduta-slider-card { zoom: 0.85; } }
        @media (min-width: 1024px) { .meduta-slider-card { zoom: 1; } }
      `}</style>
      {/* Jendela slider + track bergeser */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((group, gi) => (
            <div key={gi} className="w-full shrink-0" aria-hidden={gi !== page}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-1 lg:grid-cols-3 lg:gap-x-8">
                {group.map((t) => (
                  // zoom ringan di layar kecil agar bingkai ponsel 240px
                  // tetap muat 2 kolom; ukuran penuh kembali di desktop
                  <div key={t.name} className="meduta-slider-card flex justify-center">
                    <TemplateCard template={t} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kontrol: panah + titik indikator */}
      {total > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={page === 0}
            aria-label="Template sebelumnya"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 shadow-sm transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Halaman template ${i + 1}`}
                aria-current={i === page}
                className={`h-2.5 rounded-full transition-all ${
                  i === page ? "w-7 bg-pink-600" : "w-2.5 bg-zinc-300 hover:bg-pink-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={page === total - 1}
            aria-label="Template berikutnya"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 shadow-sm transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      {total > 1 && (
        <p className="mt-3 text-center text-xs text-zinc-400">
          Gunakan tombol untuk melihat semua {templates.length} template
        </p>
      )}
    </div>
  );
}
