"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Hook musik latar: membuat elemen Audio (loop) dari `url`
 * dan menyediakan kontrol play/pause/toggle.
 * Panggil `play()` di dalam handler klik (mis. tombol "Buka Undangan")
 * agar tidak diblokir kebijakan autoplay browser.
 *
 * Mode potong: `startSeconds` > 0 memulai lagu dari detik tsb, dan
 * `endSeconds` > start membuat lagu diputar ulang dalam segmen itu saja
 * (kembali ke `startSeconds` saat mencapai batas akhir).
 */
export function useBackgroundMusic(url?: string, startSeconds = 0, endSeconds = 0) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Sinkronisasi ke sistem eksternal (elemen Audio): buang elemen lama
    // dan buat yang baru setiap lagu/potongan berubah.
    audioRef.current?.pause();
    if (!url) {
      audioRef.current = null;
      return;
    }

    const el = new Audio(url);
    el.loop = true;
    audioRef.current = el;

    const start = startSeconds > 0 ? startSeconds : 0;
    const end = endSeconds > start ? endSeconds : 0;
    // Segmen akhir efektif: jika start > 0 tanpa end, potong di akhir lagu
    // agar intro sebelum start tidak ikut saat loop berputar.
    let segmentEnd = end;
    const seekToStart = () => {
      try {
        el.currentTime = start;
      } catch {
        /* metadata belum siap — diabaikan */
      }
    };
    const onLoadedMetadata = () => {
      if (start > 0 && !end && Number.isFinite(el.duration)) {
        segmentEnd = el.duration;
      }
      if (start > 0) seekToStart();
    };
    const onTimeUpdate = () => {
      if (segmentEnd && el.currentTime >= segmentEnd) seekToStart();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.pause();
      el.currentTime = 0;
    };
  }, [url, startSeconds, endSeconds]);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      /* diblokir autoplay policy / gagal load — abaikan */
    });
  }, []);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, []);

  return { isPlaying, play, pause, toggle };
}

export type MusicController = ReturnType<typeof useBackgroundMusic>;

/**
 * Tombol melayang play/pause musik latar (kanan bawah).
 * Warna disesuaikan tiap template lewat props class.
 */
export function MusicFab({
  isPlaying,
  onToggle,
  positionClassName = "fixed bottom-5 right-5 z-50",
  buttonClassName = "bg-zinc-900 text-white",
  playingIconClassName = "h-5 w-5 animate-pulse",
  pausedIconClassName = "h-5 w-5 opacity-70",
}: {
  isPlaying: boolean;
  onToggle: () => void;
  positionClassName?: string;
  buttonClassName?: string;
  playingIconClassName?: string;
  pausedIconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isPlaying ? "Matikan musik latar" : "Putar musik latar"}
      title={isPlaying ? "Matikan Musik" : "Putar Musik"}
      className={`${positionClassName} flex h-11 w-11 items-center justify-center rounded-full shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${buttonClassName}`}
    >
      {isPlaying ? (
        <Volume2 className={playingIconClassName} />
      ) : (
        <VolumeX className={pausedIconClassName} />
      )}
    </button>
  );
}
