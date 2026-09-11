"use client";

import { useState } from "react";
import { BookOpen, Monitor } from "lucide-react";

/**
 * Bingkai preview ala "linkundangan":
 * template ditampilkan di dalam mockup ponsel di tengah halaman,
 * dengan badge PREVIEW dan tombol GANTI DESKTOP MODE.
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
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 py-6">
      <PreviewBar mode={mode} onToggle={() => setMode("desktop")} />

      {/* Mockup ponsel */}
      <div className="mt-24 w-[380px] max-w-[92vw]">
        <div className="rounded-[2.2rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl">
          <div className="@container relative h-[calc(100vh-190px)] max-h-[760px] min-h-[480px] overflow-hidden rounded-[1.6rem] bg-white">
            {/* Island/ear notch ala smartphone */}
            <div className="pointer-events-none absolute left-1/2 top-2 z-40 h-4 w-20 -translate-x-1/2 rounded-full bg-zinc-900/90" />
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
      <div className="flex flex-col items-center">
        <div className="rounded-b-xl border border-zinc-300 bg-white px-6 py-1.5 shadow-md">
          <p className="text-sm font-bold tracking-[0.3em] text-zinc-800">PREVIEW</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 inline-flex items-center gap-1.5 border border-zinc-300 bg-zinc-900 px-3 py-1 text-[10px] font-bold tracking-widest text-white shadow-md transition hover:bg-zinc-700"
        >
          {mode === "mobile" ? (
            <>
              <Monitor className="h-3 w-3" />
              GANTI DESKTOP MODE
            </>
          ) : (
            <>
              <BookOpen className="h-3 w-3" />
              GANTI MODE PONSEL
            </>
          )}
        </button>
      </div>
    </div>
  );
}
