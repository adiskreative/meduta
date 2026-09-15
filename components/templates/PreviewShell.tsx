"use client";

import { useState } from "react";
import { BookOpen, Monitor } from "lucide-react";

/**
 * Bingkai preview ala "linkundangan":
 * - Desktop: template tampil di dalam mockup ponsel di tengah halaman.
 * - Ponsel asli (layar sempit): mockup DILEPAS — template full-screen,
 *   karena bingkai ganda (ponsel dalam ponsel) hanya menyita layar.
 *   Bar preview menyusut jadi satu pil kecil.
 */
export default function PreviewShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");

  if (mode === "desktop") {
    return (
      <div className="min-h-screen bg-zinc-100">
        <PreviewBar mode={mode} onToggle={() => setMode("mobile")} />

        {/* Bingkai "desktop" lebar */}
        <div className="p-4 pt-28 sm:p-8 sm:pt-28">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border-4 border-zinc-900 bg-white shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="mx-auto rounded-md bg-white px-3 py-0.5 text-[10px] text-zinc-400">
                meduta — pratinjau undangan
              </span>
            </div>
            <div className="gate-locked @container max-h-[80vh] overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto overscroll-contain">{children}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 sm:py-6">
      <PreviewBar mode={mode} onToggle={() => setMode("desktop")} />

      {/* Layar sempit: full-screen tanpa bingkai. sm ke atas: mockup ponsel. */}
      <div className="mt-12 w-full sm:mt-24 sm:w-[380px] sm:max-w-[92vw]">
        <div className="h-full bg-zinc-900 sm:rounded-[2.2rem] sm:border-[10px] sm:shadow-2xl">
          <div className="@container relative h-[calc(100svh-48px)] overflow-hidden bg-white sm:h-[calc(100vh-190px)] sm:max-h-[760px] sm:min-h-[480px] sm:rounded-[1.6rem]">
            {/* Island/ear notch ala smartphone — hanya di mockup (desktop) */}
            <div className="pointer-events-none absolute left-1/2 top-2 z-40 hidden h-4 w-20 -translate-x-1/2 rounded-full bg-zinc-900/90 sm:block" />
            {/* gate-locked: transform agar overlay gerbang fixed menempel di layar ponsel,
                scroll diteruskan ke pembungkus dalam */}
            <div className="gate-locked h-full">
              <div className="h-full overflow-y-auto overscroll-contain">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBar({
  mode,
  onToggle,
}: {
  mode: "mobile" | "desktop";
  onToggle: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
      {/* Ponsel: satu pil ramping satu baris. Desktop: tumpukan seperti semula. */}
      <div className="flex items-center gap-2 rounded-b-xl border border-zinc-300 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-b-xl sm:border-0 sm:bg-transparent sm:px-6 sm:py-1.5 sm:shadow-none sm:backdrop-blur-none">
        <p className="text-xs font-bold tracking-[0.3em] text-zinc-800 sm:text-center sm:text-sm">
          PREVIEW
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1.5 border border-zinc-300 bg-zinc-900 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white shadow-md transition hover:bg-zinc-700 sm:mt-1 sm:px-3"
        >
          {mode === "mobile" ? (
            <>
              <Monitor className="h-3 w-3" />
              <span className="hidden sm:inline">GANTI DESKTOP MODE</span>
              <span className="sm:hidden">DESKTOP</span>
            </>
          ) : (
            <>
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">GANTI MODE PONSEL</span>
              <span className="sm:hidden">PONSEL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
