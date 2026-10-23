"use client";

import { useCallback, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Hook musik latar: membuat elemen Audio (loop) dari `url`
 * dan menyediakan kontrol play/pause/toggle.
 * Panggil `play()` di dalam handler klik (mis. tombol "Buka Undangan")
 * agar tidak diblokir kebijakan autoplay browser.
 */
export function useBackgroundMusic(url?: string) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!url) return;
    const el = new Audio(url);
    el.loop = true;
    setAudio(el);
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, [url]);

  // Sinkronkan state dengan event elemen audio
  useEffect(() => {
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [audio]);

  const play = useCallback(() => {
    audio?.play().catch(() => {
      /* diblokir autoplay policy / gagal load — abaikan */
    });
  }, [audio]);

  const pause = useCallback(() => audio?.pause(), [audio]);

  const toggle = useCallback(() => {
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [audio]);

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
