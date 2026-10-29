"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Save, Play, Pause, Music, Scissors, RotateCcw, Library } from "lucide-react";
import { saveMusic, MusicState } from "@/lib/actions/content";
import MusicUploader from "./MusicUploader";

type StockMusic = { id: string; name: string; url: string };

/** Format detik menjadi "m:ss" untuk label pemotong. */
function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export default function MusicForm({
  invitationId,
  defaultMusicUrl,
  defaultMusicStart = 0,
  defaultMusicEnd = 0,
  stockMusic = [],
}: {
  invitationId: string;
  defaultMusicUrl: string;
  defaultMusicStart?: number;
  defaultMusicEnd?: number;
  stockMusic?: StockMusic[];
}) {
  const boundAction = saveMusic.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<MusicState | undefined, FormData>(
    boundAction,
    undefined,
  );

  const [url, setUrl] = useState(defaultMusicUrl);
  const [start, setStart] = useState(defaultMusicStart);
  const [end, setEnd] = useState(defaultMusicEnd);
  const [duration, setDuration] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const stockAudioRef = useRef<HTMLAudioElement>(null);

  // Hentikan pemutaran pratinjau saat form selesai menyimpan (status baru masuk);
  // pause memicu handler onPause yang menyinkronkan state.
  useEffect(() => {
    if (state) audioRef.current?.pause();
  }, [state]);

  // Reset potongan saat lagu berganti
  function selectUrl(nextUrl: string) {
    setUrl(nextUrl);
    setStart(0);
    setEnd(0);
    setDuration(0);
    setPreviewing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function togglePreview() {
    const audio = audioRef.current;
    if (!audio || !url) return;
    // Pratinjau selalu dimulai dari titik potong awal
    const segStart = start > 0 ? start : 0;
    if (previewing) {
      audio.pause();
    } else {
      if (audio.currentTime < segStart) audio.currentTime = segStart;
      audio.play().catch(() => {});
    }
  }

  function toggleStockPreview(item: StockMusic) {
    const audio = stockAudioRef.current;
    if (!audio) return;
    if (previewingId === item.id) {
      audio.pause();
      setPreviewingId(null);
    } else {
      audio.src = item.url;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setPreviewingId(item.id);
    }
  }

  const effectiveEnd = end > start ? end : duration;
  const trimDisabled = !url;

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* ===== Koleksi musik stok (dikelola admin) ===== */}
      {stockMusic.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Library className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-semibold text-zinc-900">Koleksi Musik</h2>
          </div>
          <p className="mb-4 text-sm text-zinc-500">
            Pilih lagu favorit Anda dari koleksi Meduta - tinggal klik, tanpa perlu
            mengisi link.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {stockMusic.map((item) => {
              const selected = url === item.url;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    selected
                      ? "border-rose-300 bg-rose-50/60"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleStockPreview(item)}
                    aria-label={previewingId === item.id ? "Hentikan pratinjau" : "Pratinjau lagu"}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                      previewingId === item.id
                        ? "bg-rose-600 text-white"
                        : "bg-white text-rose-500 shadow-sm ring-1 ring-zinc-200 hover:bg-rose-50"
                    }`}
                  >
                    {previewingId === item.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">{item.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {selected ? "Terpilih" : "Lagu koleksi"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectUrl(item.url)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    {selected ? "Dipilih" : "Pilih"}
                  </button>
                </div>
              );
            })}
          </div>
          <audio
            ref={stockAudioRef}
            preload="none"
            onEnded={() => setPreviewingId(null)}
            onPause={() => setPreviewingId(null)}
            className="hidden"
          />
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <Music className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Musik Latar</h2>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          Atur lagu yang diputar saat tamu membuka undangan Anda.
        </p>

        <label
          htmlFor="musicUrl"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          URL musik / audio
        </label>
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            id="musicUrl"
            name="musicUrl"
            type="text"
            value={url}
            onChange={(e) => selectUrl(e.target.value)}
            placeholder="https://cdn.example.com/lagu.mp3"
            className={inputClass(!!state?.errors?.musicUrl)}
          />
        </div>
        {state?.errors?.musicUrl && (
          <p className="mt-1 text-xs text-red-600">{state.errors.musicUrl[0]}</p>
        )}

        <div className="mt-5 border-t border-zinc-100 pt-5">
          <p className="mb-2 text-sm font-medium text-zinc-700">
            Atau unggah dari komputer Anda
          </p>
          <MusicUploader
            targetId="musicUrl"
            initialUrl={defaultMusicUrl}
            onUploaded={(uploaded) => selectUrl(uploaded)}
          />
        </div>
      </div>

      {/* ===== Mode potong lagu ===== */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <Scissors className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Mode Potong Lagu</h2>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          Pilih bagian lagu yang diputar di undangan - geser untuk menentukan mulai
          dan akhir. Kosongkan untuk memutar lagu dari awal.
        </p>

        {!url ? (
          <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Pilih atau unggah lagu terlebih dahulu untuk memotong.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                <span>{formatTime(start)}</span>
                <span className="text-zinc-400">
                  {formatTime(duration)} total
                </span>
              </div>

              <label className="mt-3 block text-xs font-medium text-zinc-700">
                Mulai dari: <span className="text-rose-600">{formatTime(start)}</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, 1)}
                  step={1}
                  value={start}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStart(Math.min(v, effectiveEnd > 0 ? effectiveEnd - 1 : v));
                  }}
                  className="mt-1 w-full accent-rose-600"
                />
              </label>

              <label className="mt-3 block text-xs font-medium text-zinc-700">
                Sampai dengan:{" "}
                <span className="text-rose-600">
                  {end > start ? formatTime(end) : "akhir lagu"}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, 1)}
                  step={1}
                  value={end > start ? end : Math.max(duration, 0)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEnd(v > start ? v : 0);
                  }}
                  className="mt-1 w-full accent-rose-600"
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={togglePreview}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  {previewing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {previewing ? "Hentikan" : "Pratinjau Potongan"}
                </button>
                {(start > 0 || end > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStart(0);
                      setEnd(0);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Putar lagu penuh
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Saat undangan dibuka, lagu diputar mulai{" "}
              <span className="font-medium text-zinc-600">{formatTime(start)}</span>
              {end > start
                ? ` sampai ${formatTime(end)} lalu diulang di bagian itu.`
                : " (sampai selesai)."}
            </p>
          </div>
        )}

        {/* Audio pratinjau potongan (tersembunyi) */}
        <audio
          ref={audioRef}
          src={url || undefined}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (Number.isFinite(el.duration)) setDuration(el.duration);
          }}
          onTimeUpdate={() => {
            const el = audioRef.current;
            if (!el || !previewing) return;
            // Hentikan pratinjau di batas potongan akhir (jika diatur)
            if (end > start && el.currentTime >= end) {
              el.pause();
              el.currentTime = start;
            }
          }}
          onEnded={() => setPreviewing(false)}
          onPause={() => setPreviewing(false)}
          onPlay={() => setPreviewing(true)}
          className="hidden"
        />

        {/* Nilai potongan ikut tersimpan bersama form */}
        <input type="hidden" name="musicStart" value={String(start)} />
        <input type="hidden" name="musicEnd" value={String(end > start ? end : 0)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Musik Latar"}
        </button>
        <button
          type="button"
          onClick={togglePreview}
          disabled={trimDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {previewing ? "Hentikan Pratinjau" : "Preview"}
        </button>
      </div>
    </form>
  );
}
