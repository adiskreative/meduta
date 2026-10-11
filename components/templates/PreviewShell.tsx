"use client";

import { useEffect, useState } from "react";
import { BookOpen, Monitor } from "lucide-react";

/**
 * Bingkai preview ala linkundangan:
 * - Konten SELALU dirender di viewport ponsel nyata 440×956 (iPhone
 *   16 Pro Max — CSS px perangkat asli) di dalam iframe — rendering
 *   identik piksel dengan ponsel asli.
 * - Seluruh mockup lalu DI-SCALE (transform) agar setinggi jendela
 *   browser, dengan rasio terkunci — ukuran "pas memegang ponsel".
 * - Detail khas iPhone 16 Pro Max: Dynamic Island, bingkai titanium,
 *   tombol samping (aksi, volume, daya, kontrol kamera).
 * - Bar PREVIEW melayang DI DALAM layar, di bawah Dynamic Island;
 *   di mode desktop pindah ke kanan-atas agar tidak menutupi konten.
 * - Layar sempit (<640px): full-screen tanpa bingkai ganda.
 *
 * Kunci arsitektural: SATU iframe persisten — toggle mode hanya
 * mengubah inline style pembungkus, pohon JSX tetap sama sehingga
 * React TIDAK me-remount iframe (tidak ada reload). State di dalam
 * template (gerbang terbuka, musik, posisi scroll) bertahan saat
 * berpindah mode ponsel ⇄ desktop.
 */

const SCREEN_W = 440; // iPhone 16 Pro Max: 440×956 CSS px
const SCREEN_H = 956;
const BORDER = 14; // ketebalan bingkai titanium
const BODY_RADIUS = 64;
const SCREEN_RADIUS = 52;

export default function PreviewShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [narrow, setNarrow] = useState(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const isNarrow = window.innerWidth < 640;
      setNarrow(isNarrow);
      // Skala agar mockup (layar + bingkai) muat setinggi jendela
      setScale(Math.min(1, (window.innerHeight - 24) / (SCREEN_H + BORDER * 2)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isDesktop = mode === "desktop";
  const isMockup = mode === "mobile" && !narrow; // mockup iPhone di browser lebar
  const bodyW = SCREEN_W + BORDER * 2;
  const bodyH = SCREEN_H + BORDER * 2;

  return (
    /* Lapisan penempatan — inline style penuh (kebal Tailwind lambat) */
    <div
      style={
        isDesktop
          ? { position: "fixed", inset: 0, background: "#f4f4f5", padding: 10 }
          : narrow
            ? {
                position: "relative",
                height: "100svh",
                width: "100%",
                background: "#fff",
                overflow: "hidden",
              }
            : {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100svh",
                background: "#f4f4f5",
              }
      }
    >
      {/* Pengukur ukuran-hasil-skala agar penempatan tengah tepat */}
      <div
        style={
          isMockup
            ? { width: bodyW * scale, height: bodyH * scale, flexShrink: 0 }
            : { width: "100%", height: "100%" }
        }
      >
        {/* Chrome perangkat (mockup) / jendela (desktop) / polos (sempit) */}
        <div
          style={
            isMockup
              ? {
                  position: "relative",
                  width: bodyW,
                  height: bodyH,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  borderRadius: BODY_RADIUS,
                  border: `${BORDER}px solid #1c1c1f`,
                  boxShadow:
                    "0 0 0 2px #3f3f46, 0 25px 50px -12px rgba(0,0,0,0.5)",
                  background: "#18181b",
                }
              : isDesktop
                ? {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    border: "6px solid #18181b",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
                    background: "#fff",
                    overflow: "hidden",
                  }
                : {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    background: "#fff",
                    overflow: "hidden",
                  }
          }
        >
          {/* Tombol samping titanium — hanya tampil di mockup iPhone */}
          <div style={{ position: "absolute", left: -17, top: 190, width: 4, height: 32, borderRadius: 2, background: "#3f3f46", visibility: isMockup ? "visible" : "hidden" }} />
          <div style={{ position: "absolute", left: -17, top: 250, width: 4, height: 62, borderRadius: 2, background: "#3f3f46", visibility: isMockup ? "visible" : "hidden" }} />
          <div style={{ position: "absolute", left: -17, top: 324, width: 4, height: 62, borderRadius: 2, background: "#3f3f46", visibility: isMockup ? "visible" : "hidden" }} />
          <div style={{ position: "absolute", right: -17, top: 280, width: 4, height: 96, borderRadius: 2, background: "#3f3f46", visibility: isMockup ? "visible" : "hidden" }} />
          <div style={{ position: "absolute", right: -17, top: 420, width: 4, height: 40, borderRadius: 2, background: "#565661", visibility: isMockup ? "visible" : "hidden" }} />

          {/* Layar */}
          <div
            style={
              isMockup
                ? {
                    position: "relative",
                    width: SCREEN_W,
                    height: SCREEN_H,
                    borderRadius: SCREEN_RADIUS,
                    overflow: "hidden",
                    background: "#fff",
                  }
                : {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: isDesktop ? 10 : 0,
                    overflow: "hidden",
                    background: "#fff",
                  }
            }
          >
            {/* Dynamic Island khas iPhone 16 Pro Max — hanya mockup */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 12,
                transform: "translateX(-50%)",
                width: 126,
                height: 37,
                borderRadius: 20,
                background: "#000",
                zIndex: 40,
                visibility: isMockup ? "visible" : "hidden",
              }}
            />
            <PreviewBar
              mode={mode}
              onToggle={() => setMode(isDesktop ? "mobile" : "desktop")}
              topOffset={isMockup ? 60 : 10}
              alignRight={!isMockup}
            />
            {/* Iframe persisten — TIDAK pernah di-remount antar mode */}
            <iframe
              src="?frame=1"
              title="Pratinjau undangan"
              className="block border-0 bg-white"
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBar({
  mode,
  onToggle,
  topOffset = 10,
  alignRight = false,
}: {
  mode: "mobile" | "desktop";
  onToggle: () => void;
  topOffset?: number;
  alignRight?: boolean;
}) {
  return (
    <div
      className="absolute z-50 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur"
      style={{
        top: topOffset,
        ...(alignRight
          ? { right: 14 }
          : { left: "50%", transform: "translateX(-50%)" }),
      }}
    >
      <p className="text-xs font-bold tracking-[0.25em] text-zinc-800">
        PREVIEW
      </p>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white shadow transition hover:bg-zinc-700"
      >
        {mode === "mobile" ? (
          <>
            <Monitor className="h-3 w-3" />
            DESKTOP
          </>
        ) : (
          <>
            <BookOpen className="h-3 w-3" />
            PONSEL
          </>
        )}
      </button>
    </div>
  );
}
