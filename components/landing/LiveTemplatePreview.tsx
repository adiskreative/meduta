"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thumbnail live template presisi:
 * 1. Iflaya memuat preview mode embed (?embed=1) dengan tinggi TETAP
 *    satu layar ponsel — tidak pernah diubah, sehingga tidak ada
 *    feedback loop dengan elemen 100vh di dalam template.
 * 2. Pan hover dilakukan dengan window.scrollTo DI DALAM iframe
 *    (same-origin) via rAF: posisi scroll selalu dihitung dari
 *    scrollHeight dokumen asli saat itu — presisi otomatis walau
 *    gambar/font selesai memuat belakangan, untuk template sepanjang
 *    apa pun. Gerak naik-turun bergantian (ping-pong) dengan easing
 *    halus, kembali ke atas saat kursor pergi.
 * 3. Scrollbar disembunyikan via CSS (html.thumb-embed) dan seluruh
 *    interaksi pointer di dalam iframe dimatikan.
 * 4. Hemat resource: iframe dimuat saat mendekati viewport, pan
 *    berhenti saat tab tersembunyi, hormat prefers-reduced-motion.
 */

const PHONE_W = 390; // lebar desain template (viewport iframe)
const BORDER = 10; // ketebalan bingkai ponsel (border-[10px])
const CARD_W = 240; // lebar total kartu termasuk border (w-60)
const SCREEN_W = CARD_W - BORDER * 2; // lebar layar yang terlihat (220px)
// Presisi: skala dihitung dari LAYAR (di dalam border), bukan lebar total —
// tanpa ini konten terpotong di kanan dan tampak bergeser dari tengah.
const SCALE = SCREEN_W / PHONE_W;
const SCREEN_H = Math.round(SCREEN_W * (19 / 9)); // layar terlihat rasio 9:19
const INNER_H = Math.round(SCREEN_H / SCALE); // tinggi viewport iframe (≈823)
const FRAME_H = SCREEN_H + BORDER * 2; // tinggi total bingkai tampil

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export default function LiveTemplatePreview({ templateKey }: { templateKey: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [inView, setInView] = useState(false);

  const getDoc = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow;
      const doc = win?.document;
      if (!win || !doc?.documentElement) return null;
      return { win, doc };
    } catch {
      return null;
    }
  }, []);

  const stopPan = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Kembali ke atas dengan halus saat kursor pergi
  const scrollBackToTop = useCallback(() => {
    stopPan();
    const d = getDoc();
    if (!d) return;
    const startY = d.win.scrollY;
    if (startY <= 1) {
      d.win.scrollTo(0, 0);
      return;
    }
    const t0 = performance.now();
    const DUR = 600;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      const y = startY * (1 - easeInOutSine(p));
      d.win.scrollTo(0, y);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(step);
  }, [getDoc, stopPan]);

  // Pan ping-pong: turun lalu naik bergantian selama hover
  const startPan = useCallback(() => {
    const d = getDoc();
    if (!d) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stopPan();

    const t0 = performance.now();
    const maxScroll = () =>
      Math.max(
        0,
        Math.max(
          d.doc.documentElement.scrollHeight,
          d.doc.body?.scrollHeight ?? 0,
        ) - d.doc.documentElement.clientHeight,
      );

    const step = (now: number) => {
      const max = maxScroll();
      if (max > 10) {
        // Durasi tiap arah proporsional jarak, dibatasi 6–14 detik
        const dur = Math.min(14000, Math.max(6000, (max * SCALE) / 24));
        const phase = ((now - t0) % (dur * 2)) / dur; // 0..2
        const goingDown = phase < 1;
        const eased = easeInOutSine(goingDown ? phase : phase - 1);
        const y = max * (goingDown ? eased : 1 - eased);
        d.win.scrollTo(0, y);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [getDoc, stopPan]);

  // Berhenti saat tab tersembunyi (hemat CPU)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopPan();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stopPan]);

  // Bersih-bersih saat unmount
  useEffect(() => stopPan, [stopPan]);

  // Muat iframe hanya saat mendekati viewport (hemat resource)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-[2.25rem] border-[10px] border-zinc-900 bg-black shadow-2xl"
      style={{ width: SCREEN_W + BORDER * 2, height: FRAME_H }}
      onMouseEnter={startPan}
      onMouseLeave={scrollBackToTop}
    >
      {/* Notch ponsel */}
      <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: PHONE_W, transform: `scale(${SCALE})` }}
      >
        {inView ? (
          <iframe
            ref={iframeRef}
            src={`/preview/${templateKey}?embed=1`}
            title={`Pratinjau live template ${templateKey}`}
            loading="lazy"
            tabIndex={-1}
            className="pointer-events-none block border-0"
            style={{ width: PHONE_W, height: INNER_H }}
          />
        ) : (
          <div style={{ width: PHONE_W, height: INNER_H }} className="bg-zinc-100" />
        )}
      </div>
    </div>
  );
}
