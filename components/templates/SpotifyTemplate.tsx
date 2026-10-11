"use client";

import { useEffect, useState } from "react";
import {
  ArrowUp,
  AtSign,
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Heart,
  ListMusic,
  MapPin,
  Pause,
  Play,
  Quote,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishList from "./WishList";
import WishForm from "./WishForm";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown } from "./SharedWidgets";
import {
  formatDate,
  formatTime,
  splitAgenda,
  type TemplateProps,
} from "./types";
import {
  getBackgroundUrl,
  getGatePhotoUrl,
  resolveGatePhoto,
} from "@/lib/decoration";

/**
 * Spotify Album — template #17 bergaya player Spotify (adopsi referensi
 * HTML "wedify_spotify_style_digital_wedding_invitation"), diubah 100%
 * data-driven sesuai arsitektur Meduta:
 * - Gerbang = layar "PLAY ALBUM" ala intro Spotify + tombol Play besar
 *   (memutar musik latar user; tanpa synthesizer WebAudio agar tidak
 *   memutar suara hardcode ketika admin tidak mengatur musik)
 * - Sticky header ala Spotify dengan nav anchor + indikator equalizer
 * - Hero album (artwork + metadata + Verified Couple + tombol Play/Like/
 *   Simpan Tanggal/Share), banner countdown, Tracklist (acara), Popular
 *   Tracks (kisah cinta), Featured Artists (mempelai), Discography
 *   (galeri + lightbox), Lyrics (pesan penutup), Fan Reviews (RSVP +
 *   ulasan/ucapan), Digital Gift Plan (kado + salin), player bar bawah
 * - Fitur Meduta yang diwiring: musik latar user (BackgroundMusic),
 *   RSVP & ucapan tersimpan DB (server action), kado digital + salin,
 *   background/foto gerbang kustom (dekorasi admin & pilihan user),
 *   mode embed & shot (gerbang terbuka, musik mati), DraftNotice.
 * Konvensi CSS: prefix `sp-` (Spotify). Tanpa backdrop-blur pada kartu
 * berisi teks; animasi transform via keyframes saja (Tailwind v4).
 */

const GREEN = "#1DB954";
const GREEN_DARK = "#1aa34a";
const BLACK = "#121212";
const CARD = "#181818";
const LIGHT = "#282828";
const TEXTGRAY = "#b3b3b3";
const GOLD = "#D4AF37";

/* ------------------------------------------------------------------ */
/* CSS khusus template (prefix sp- = spotify)                          */
/* ------------------------------------------------------------------ */
const SP_STYLES = `
  html { scroll-behavior: smooth; }
  .sp-card {
    background-color: ${CARD};
    transition: background-color 0.3s ease, transform 0.3s ease;
  }
  .sp-card:hover { background-color: ${LIGHT}; }
  @keyframes spEq {
    0%, 100% { transform: scaleY(0.25); }
    50% { transform: scaleY(1); }
  }
  .sp-eq span {
    display: block; width: 3px; background: ${GREEN};
    transform-origin: bottom;
    animation: spEq 0.8s ease-in-out infinite;
  }
  .sp-eq span:nth-child(2) { animation-duration: 1.1s; animation-delay: 0.2s; }
  .sp-eq span:nth-child(3) { animation-duration: 0.9s; animation-delay: 0.4s; }
  .sp-eq-paused span { animation-play-state: paused; transform: scaleY(0.25); }
  @keyframes spFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .sp-fade-up {
    opacity: 0;
    animation: spFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .sp-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .sp-reveal.sp-visible { opacity: 1; transform: translateY(0); }
  @keyframes spScrollBounce {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(7px); opacity: 0.5; }
  }
  .sp-scroll-hint { animation: spScrollBounce 1.8s ease-in-out infinite; }
  @keyframes spVinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .sp-vinyl { animation: spVinylSpin 9s linear infinite; }
  .sp-paused { animation-play-state: paused; }
  @keyframes spPulseGreen {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(29,185,84,0.35)); }
    50% { filter: drop-shadow(0 0 14px rgba(29,185,84,0.7)); }
  }
  .sp-glow { animation: spPulseGreen 3.6s ease-in-out infinite; }
  .sp-track-row { transition: background-color 0.2s ease; }
  .sp-track-row:hover { background-color: ${LIGHT}; }
  .sp-track-row:hover .sp-track-num { display: none; }
  .sp-track-row:hover .sp-track-play { display: inline-flex; }
  @media (prefers-reduced-motion: reduce) {
    .sp-eq span, .sp-fade-up, .sp-scroll-hint, .sp-vinyl, .sp-glow {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .sp-reveal { opacity: 1; transform: none; transition: none; }
  }
`;

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll                                                    */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sp-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("sp-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

/** Equalizer 3 bar ala Spotify (beranimasi saat musik berputar). */
function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span
      aria-hidden
      className={`sp-eq inline-flex h-3 items-end gap-[2px] ${playing ? "" : "sp-eq-paused"}`}
    >
      <span className="h-3" />
      <span className="h-3" />
      <span className="h-3" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang: intro Spotify                                              */
/* ------------------------------------------------------------------ */
function SpotifyGate({
  groomNick,
  brideNick,
  guestName,
  onOpen,
  embedded = false,
  gatePhoto,
}: {
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  onOpen?: () => void;
  embedded?: boolean;
  gatePhoto?: string;
}) {
  const [open, setOpen] = useState(embedded);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (open) return null;

  const handleOpen = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      onOpen?.();
      setOpen(true);
    }, 700);
  };

  const couple = `${groomNick ?? "Pengantin"} & ${brideNick ?? "Pengantin"}`;

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden ${closing ? "sp-gate-out" : ""}`}
      style={{ background: BLACK }}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{SP_GATE_STYLES}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 30%, rgba(29,185,84,0.14) 0%, rgba(18,18,18,0) 60%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="sp-gate-fade flex items-center gap-3" style={{ animationDelay: "0.1s" }}>
          <span
            className="sp-glow flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: GREEN }}
          >
            <ListMusic className="h-6 w-6 text-black" />
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Medify
          </span>
        </div>
        <p
          className="sp-gate-fade mt-4 text-[11px] font-bold uppercase tracking-[0.3em]"
          style={{ color: TEXTGRAY, animationDelay: "0.3s" }}
        >
          Wedding Album Special Release
        </p>

        {/* Kartu tamu */}
        <div
          className="sp-gate-fade mt-8 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          style={{ background: CARD, border: `1px solid ${LIGHT}`, animationDelay: "0.45s" }}
        >
          <div
            className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full"
            style={{ border: `2px solid ${GREEN}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gatePhoto ?? "/design/onyx-goldring.webp"}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          </div>
          <span
            className="mb-1 block text-[11px] font-bold uppercase tracking-widest"
            style={{ color: GREEN }}
          >
            Mendengarkan sebagai tamu VIP
          </span>
          <h2 className="text-xl font-bold text-white">{guestName ?? "Tamu Undangan"}</h2>
          <p className="mt-1 text-xs" style={{ color: TEXTGRAY }}>
            Anda diundang mendengarkan Wedding Album {couple}
          </p>
        </div>

        {/* Tombol play besar */}
        <button
          type="button"
          onClick={handleOpen}
          className="sp-gate-fade mt-8 inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-black transition-transform duration-300 hover:scale-105 active:scale-95"
          style={{
            background: GREEN,
            boxShadow: "0 8px 24px rgba(29,185,84,0.4)",
            animationDelay: "0.6s",
          }}
          aria-label="Buka Undangan"
        >
          <Play className="h-5 w-5 fill-black" />
          Play Album — Buka Undangan
        </button>
        <p
          className="sp-gate-fade mt-5 text-[11px]"
          style={{ color: TEXTGRAY, animationDelay: "0.75s" }}
        >
          Klik untuk memutar album & membuka undangan
        </p>
      </div>
    </div>
  );
}

const SP_GATE_STYLES = `
  @keyframes spGateFade {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .sp-gate-fade {
    opacity: 0;
    animation: spGateFade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes spGateOut {
    to { opacity: 0; transform: scale(1.04); }
  }
  .sp-gate-out { animation: spGateOut 700ms ease forwards; pointer-events: none; }
  @media (prefers-reduced-motion: reduce) {
    .sp-gate-fade { animation: none !important; opacity: 1 !important; }
  }
`;

/* ------------------------------------------------------------------ */
/* Komponen utama                                                      */
/* ------------------------------------------------------------------ */
type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function SpotifyTemplate(props: TemplateProps) {
  // Mode embed/shot (thumbnail live & screenshot): gerbang terbuka, musik mati
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <SpotifyShell
      {...props}
      data={isEmbed ? { ...props.data, musicUrl: undefined } : props.data}
      gateOpen={gateOpen}
      onGateOpen={() => {
        setGateOpen(true);
        music.play();
      }}
      music={music}
    />
  );
}

function SpotifyShell({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
  decorations,
  gateOpen = true,
  onGateOpen,
  music,
}: TemplateProps & GateProps & { music?: MusicController }) {
  useReveal();

  if (!isPublished) {
    return <DraftNotice />;
  }

  const groom = data.groom;
  const bride = data.bride;
  const groomNick = groom?.nickname ?? groom?.name ?? "Pengantin";
  const brideNick = bride?.nickname ?? bride?.name ?? "Pengantin";
  const agenda = splitAgenda(data.events, {
    date: data.eventDate,
    time: data.eventTime,
    venue: [data.venueName, data.location].filter(Boolean).join(", "),
    mapUrl: data.locationMap,
  });
  const events = agenda.additional;
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];
  const albumCover = resolveGatePhoto({
    gatePhotoUrl: data.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: groom?.photoUrl,
    bridePhotoUrl: bride?.photoUrl,
    firstGalleryUrl: gallery[0]?.url,
  });
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  const albumTitle = `${groomNick} & ${brideNick}`;
  const eventTitle = data.eventName ?? `Pernikahan ${albumTitle}`;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans text-white"
      style={{ background: BLACK }}
    >
      <style>{SP_STYLES}</style>
      {bgUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgUrl}
            alt=""
            className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{ background: "rgba(18,18,18,0.82)" }}
          />
        </>
      ) : null}

      {/* Gerbang tertutup = overlay fullscreen */}
      {!gateOpen ? (
        <SpotifyGate
          groomNick={groomNick}
          brideNick={brideNick}
          guestName={guestName}
          onOpen={onGateOpen}
          gatePhoto={albumCover}
        />
      ) : null}

      <SpotifyHeader
        playing={music?.isPlaying ?? false}
        onToggleAudio={music?.toggle}
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-40 pt-6 sm:px-8">
        {/* ================= HERO ALBUM ================= */}
        <section
          id="sp-hero"
          className="sp-fade-up relative mb-10 overflow-hidden rounded-2xl border p-6 sm:p-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(6,58,28,0.85) 0%, #181818 60%, #121212 100%)",
            borderColor: "rgba(40,40,40,0.5)",
            animationDelay: "0.1s",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full blur-3xl"
            style={{ background: "rgba(29,185,84,0.10)" }}
          />
          <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-end">
            {/* Artwork */}
            <div
              className="relative h-48 w-48 shrink-0 overflow-hidden rounded-xl shadow-2xl sm:h-60 sm:w-60"
              style={{ border: "2px solid rgba(40,40,40,0.6)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={albumCover ?? FALLBACK_COVERS[0]}
                alt={`Album ${albumTitle}`}
                className="h-full w-full object-cover"
              />
              <span
                className="absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                style={{ background: "rgba(0,0,0,0.7)", color: GREEN, border: `1px solid rgba(29,185,84,0.4)` }}
              >
                Official Album
              </span>
            </div>

            {/* Metadata */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: GREEN }}
              >
                Public Playlist • Wedding Original
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-black leading-none tracking-tight text-white sm:text-5xl md:text-6xl">
                {albumTitle}
              </h1>
              {data.customMessage ? (
                <p className="mx-auto max-w-2xl text-xs leading-relaxed sm:text-sm" style={{ color: TEXTGRAY }}>
                  {data.customMessage}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs font-medium md:justify-start" style={{ color: TEXTGRAY }}>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-400" />
                  <span className="font-bold text-white">Verified Couple</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-white">
                  {agenda.main.date ? formatDate(agenda.main.date).split(", ").pop() : new Date().getFullYear()}
                </span>
                <span>•</span>
                <span>{Math.max(1, data.events?.length ?? 0) + 1} Tracks</span>
                <span>•</span>
                <span style={{ color: GREEN }} className="font-semibold">
                  {guestName ? "1 Tamu Spesial" : "Tamu Undangan"}
                </span>
              </div>

              {/* Kontrol album */}
              <div className="flex items-center justify-center gap-5 pt-4 md:justify-start">
                <button
                  type="button"
                  onClick={music?.toggle}
                  aria-label={music?.isPlaying ? "Jeda musik" : "Putar musik"}
                  className="flex h-14 w-14 items-center justify-center rounded-full text-black transition-transform duration-200 hover:scale-105"
                  style={{
                    background: music?.isPlaying ? GREEN : GREEN,
                    boxShadow: "0 8px 20px rgba(29,185,84,0.4)",
                  }}
                  disabled={!data.musicUrl}
                >
                  {music?.isPlaying ? (
                    <Pause className="h-6 w-6 fill-black" />
                  ) : (
                    <Play className="h-6 w-6 fill-black" />
                  )}
                </button>
                <Heart className="h-7 w-7 cursor-pointer transition-colors hover:text-[#1DB954]" style={{ color: TEXTGRAY }} />
                <a
                  href={agenda.main.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Lihat lokasi"
                  className="rounded-full p-3 transition-colors hover:text-white"
                  style={{ border: `1px solid ${LIGHT}`, color: TEXTGRAY }}
                >
                  <MapPin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COUNTDOWN ================= */}
        <CountdownBanner target={agenda.main.date} />

        {/* ================= TRACKLIST / ACARA ================= */}
        <section id="sp-tracks" className="mb-14">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              <ListMusic className="h-5 w-5" style={{ color: GREEN }} />
              Tracklist — Jadwal Acara
            </h2>
            {agenda.main.date ? (
              <span className="text-xs font-semibold" style={{ color: TEXTGRAY }}>
                {formatDate(agenda.main.date)}
              </span>
            ) : null}
          </div>

          {/* Track 01 = Acara Utama (Akad) */}
          <TrackRow
            num="01"
            title="Akad Nikah — Janji Suci"
            venue={agenda.main.venue}
            date={agenda.main.date}
            time={agenda.main.time}
            mapUrl={agenda.main.mapUrl}
            cover={albumCover ?? FALLBACK_COVERS[0]}
          />
          {events.map((e, i) => (
            <TrackRow
              key={e.id}
              num={String(i + 2).padStart(2, "0")}
              title={e.title ?? "Acara"}
              venue={e.location}
              date={e.date}
              time={e.time}
              mapUrl={e.locationMap}
              cover={gallery[i % Math.max(gallery.length, 1)]?.url ?? FALLBACK_COVERS[i % FALLBACK_COVERS.length]}
            />
          ))}
        </section>

        {/* ================= STORY ================= */}
        {story.length > 0 ? (
          <section id="sp-story" className="mb-14">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              <Flame className="h-5 w-5" style={{ color: GREEN }} />
              Popular Tracks — Kisah Cinta
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {story.map((s, i) => (
                <div
                  key={s.id}
                  className="sp-reveal sp-card flex items-center gap-4 rounded-2xl border p-5"
                  style={{ borderColor: "rgba(40,40,40,0.4)" }}
                >
                  <span className="font-mono text-3xl font-black" style={{ color: GREEN }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    {s.date ? (
                      <span
                        className="block text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: GREEN }}
                      >
                        {formatDate(s.date).split(", ").pop() ?? ""}
                      </span>
                    ) : null}
                    <h4 className="mt-0.5 text-sm font-bold text-white">{s.title ?? ""}</h4>
                    {s.description ? (
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: TEXTGRAY }}>
                        {s.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ================= ARTISTS / MEMPELAI ================= */}
        <section id="sp-artists" className="mb-14">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            <ListMusic className="h-5 w-5" style={{ color: GREEN }} />
            Featured Artists — Sang Mempelai
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ArtistCard
              role="Lead Vocalist — Mempelai Pria"
              person={groom}
              photo={groom?.photoUrl}
            />
            <ArtistCard
              role="Main Harmony — Mempelai Wanita"
              person={bride}
              photo={bride?.photoUrl}
            />
          </div>
          {/* Nama orang tua disebut dari bio/parentName di ArtistCard */}
        </section>

        {/* ================= DISCOGRAPHY / GALERI ================= */}
        {gallery.length > 0 ? (
          <GallerySection gallery={gallery} />
        ) : null}

        {/* ================= LYRICS / PESAN ================= */}
        {data.customMessage ? (
          <section id="sp-lyrics" className="mb-14">
            <div
              className="relative overflow-hidden rounded-2xl border p-8"
              style={{
                background:
                  "linear-gradient(to right, rgba(6,58,28,0.9) 0%, #181818 55%, #121212 100%)",
                borderColor: "rgba(40,40,40,0.4)",
              }}
            >
              <div className="relative z-10 mx-auto max-w-3xl space-y-4 text-center">
                <span
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                  style={{ color: GREEN }}
                >
                  <Quote className="h-4 w-4" />
                  Synchronized Lyrics — Doa untuk Mempelai
                </span>
                <blockquote className="font-[family-name:var(--font-serif-elegant)] text-xl italic leading-relaxed text-white sm:text-2xl">
                  &ldquo;{data.customMessage}&rdquo;
                </blockquote>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GREEN }}>
                  — Keluarga Besar Mempelai
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= RSVP + REVIEWS ================= */}
        <section id="sp-rsvp" className="mb-14">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GREEN }}>
                Fan Reviews &amp; RSVP
              </span>
              <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                Konfirmasi Kehadiran &amp; Doa Restu
              </h2>
              <p className="mt-1 text-xs" style={{ color: TEXTGRAY }}>
                Berikan ulasan dan kirim ucapan untuk {albumTitle}
              </p>
            </div>
            <div
              className="sp-reveal mb-10 rounded-2xl border p-6 shadow-xl sm:p-8"
              style={{ background: CARD, borderColor: LIGHT }}
            >
              <RsvpForm
                invitationId={invitationId}
                initialName={guestName}
                accentClass="bg-[#1DB954]! hover:bg-[#1aa34a]! text-black!"
                borderClass="border-[#282828]! bg-black/60! text-white! placeholder:text-[#b3b3b3]! focus:border-[#1DB954]! focus:ring-[#1DB954]/20!"
              />
            </div>
            <div className="space-y-4">
              <h3 className="mb-4 flex items-center justify-between text-lg font-bold text-white">
                <span>Recent Listener Reviews</span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: GREEN }}>
                  <span style={{ color: GOLD }}>★★★★★</span> 5.0 Rating
                </span>
              </h3>
              <WishList
                wishes={wishes ?? []}
                cardClass="bg-[#181818] border-[#282828]"
                nameClass="text-white"
                avatarClass="bg-[#1DB954]/20 text-[#1DB954]"
                emptyClass="text-white/40"
 />
              <div
                className="sp-reveal rounded-2xl border p-6 md:p-8"
                style={{ background: CARD, borderColor: LIGHT }}
              >
                <WishForm
                  invitationId={invitationId}
                  accentClass="bg-[#1DB954]! hover:bg-[#1aa34a]! text-black!"
                  borderClass="border-[#282828]! bg-black/60! text-white! placeholder:text-[#b3b3b3]! focus:border-[#1DB954]! focus:ring-[#1DB954]/20!"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= KADO DIGITAL ================= */}
        {gifts.length > 0 ? (
          <section id="sp-gift" className="mb-14">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GREEN }}>
                Premium Subscription — Tanda Kasih
              </span>
              <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Digital Gift Plan</h2>
              <p className="mx-auto mt-1 max-w-lg text-xs" style={{ color: TEXTGRAY }}>
                Doa restu Anda adalah karunia terbesar. Tanda kasih dapat disalurkan melalui:
              </p>
            </div>
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className="sp-reveal sp-card rounded-2xl border p-6 text-center"
                  style={{ borderColor: "rgba(40,40,40,0.4)" }}
                >
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "rgba(29,185,84,0.2)", color: GREEN }}
                  >
                    <Gift className="h-6 w-6" />
                  </div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: GREEN }}>
                    {g.provider}
                  </span>
                  <h4 className="mt-1 text-lg font-bold text-white">{g.name}</h4>
                  <p className="my-2 font-mono text-base font-bold text-white">{g.accountNumber}</p>
                  {g.holderName ? (
                    <p className="mb-4 text-xs" style={{ color: TEXTGRAY }}>
                      a.n. {g.holderName}
                    </p>
                  ) : null}
                  <CopyButton text={g.accountNumber} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ================= FOOTER ================= */}
        <footer className="mt-16 border-t pt-10 text-center" style={{ borderColor: "rgba(40,40,40,0.4)" }}>
          <div className="flex items-center justify-center gap-2 font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: GREEN }}>
              <ListMusic className="h-4 w-4 text-black" />
            </span>
            <span>Medify Wedding Album</span>
          </div>
          <p className="mt-2 text-xs" style={{ color: TEXTGRAY }}>
            © {new Date().getFullYear()} {albumTitle}. All rights reserved.
          </p>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-white/30">
            Dibuat dengan MEDUTA
          </p>
        </footer>
      </main>

      {/* ================= PLAYER BAR ================= */}
      <PlayerBar
        albumCover={albumCover ?? FALLBACK_COVERS[0]}
        title={albumTitle}
        playing={music?.isPlaying ?? false}
        onToggle={music?.toggle}
      />

      {/* FAB musik + kembali ke atas (kanan bawah, di atas player bar) */}
      {data.musicUrl && music ? (
        <div className="fixed bottom-24 right-5 z-40 flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            buttonClassName="border border-[#1DB954]/60 bg-[#181818] text-white shadow-[0_0_18px_rgba(29,185,84,0.35)]"
            playingIconClassName="h-5 w-5 text-[#1DB954]"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110"
            style={{ background: CARD, border: "1px solid rgba(29,185,84,0.5)" }}
          >
            <ArrowUp className="h-5 w-5" style={{ color: GREEN }} />
          </button>
        </div>
      ) : (
        <div className="fixed bottom-24 right-5 z-40">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110"
            style={{ background: CARD, border: "1px solid rgba(29,185,84,0.5)" }}
          >
            <ArrowUp className="h-5 w-5" style={{ color: GREEN }} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-komponen                                                        */
/* ------------------------------------------------------------------ */

const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80",
];

function SpotifyHeader({
  playing,
  onToggleAudio,
}: {
  playing: boolean;
  onToggleAudio?: () => void;
}) {
  const nav = [
    { href: "#sp-hero", label: "Overview" },
    { href: "#sp-tracks", label: "Tracklist" },
    { href: "#sp-story", label: "Top Stories" },
    { href: "#sp-artists", label: "Artists" },
    { href: "#sp-gallery", label: "Discography" },
    { href: "#sp-rsvp", label: "Fan Reviews" },
  ];
  return (
    <header
      className="sticky top-0 z-40 border-b px-4 py-3 sm:px-8"
      style={{ background: "rgba(18,18,18,0.92)", borderColor: "rgba(40,40,40,0.4)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="#sp-hero" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: GREEN }}>
              <ListMusic className="h-4 w-4 text-black" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">Medify</span>
          </a>
          <nav className="hidden items-center gap-5 text-xs font-semibold md:flex" style={{ color: TEXTGRAY }}>
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-white">
                {n.label}
              </a>
            ))}
          </nav>
        </div>
        {onToggleAudio ? (
          <button
            type="button"
            onClick={onToggleAudio}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
            style={{ borderColor: "rgba(60,60,60,0.8)", background: "rgba(40,40,40,0.6)" }}
          >
            <Equalizer playing={playing} />
            {playing ? "PLAYING" : "PAUSED"}
          </button>
        ) : null}
      </div>
    </header>
  );
}

function CountdownBanner({ target }: { target?: string }) {
  const t = useCountdown(target);
  const items = [
    { label: "Hari", value: t.days, accent: true },
    { label: "Jam", value: t.hours },
    { label: "Menit", value: t.minutes },
    { label: "Detik", value: t.seconds, accent: true },
  ];
  return (
    <section
      className="sp-reveal mb-10 rounded-xl border p-6"
      style={{ background: CARD, borderColor: LIGHT }}
    >
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3 text-center md:text-left">
          <Clock className="h-6 w-6" style={{ color: GREEN }} />
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest" style={{ color: GREEN }}>
              Countdown Release Date
            </span>
            <h3 className="text-base font-bold text-white">Menuju Hari Bahagia</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 text-center font-mono text-xl text-white sm:gap-5 sm:text-2xl">
          {items.map((it) => (
            <div
              key={it.label}
              className="min-w-[65px] rounded-lg border px-3.5 py-2"
              style={{ background: "rgba(0,0,0,0.6)", borderColor: LIGHT }}
            >
              <span className={`font-bold ${it.accent ? "" : "text-white"}`} style={it.accent ? { color: GREEN } : undefined}>
                {String(it.value).padStart(2, "0")}
              </span>
              <span className="block font-sans text-[9px] uppercase tracking-widest" style={{ color: TEXTGRAY }}>
                {it.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackRow({
  num,
  title,
  venue,
  date,
  time,
  mapUrl,
  cover,
}: {
  num: string;
  title: string;
  venue?: string;
  date?: string;
  time?: string;
  mapUrl?: string;
  cover?: string;
}) {
  return (
    <div
      className="sp-track-row group mb-2 flex flex-col items-start gap-3 rounded-xl border p-3 sm:grid sm:grid-cols-12 sm:items-center sm:p-4"
      style={{ background: CARD, borderColor: "rgba(40,40,40,0.2)" }}
    >
      <div className="relative hidden sm:col-span-1 sm:block">
        <span className="sp-track-num font-bold" style={{ color: TEXTGRAY }}>
          {num}
        </span>
        <span className="sp-track-play hidden text-white">
          <Play className="h-3.5 w-3.5 fill-white" />
        </span>
      </div>
      <div className="flex w-full items-center gap-3 sm:col-span-5">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover ?? FALLBACK_COVERS[0]} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-[#1DB954]">
            {title}
          </h4>
          {venue ? (
            <p className="truncate text-xs" style={{ color: TEXTGRAY }}>
              {venue}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-0.5 text-xs sm:col-span-3" style={{ color: TEXTGRAY }}>
        {date ? <p className="font-medium text-white">{formatDate(date)}</p> : null}
        {time ? (
          <p className="font-mono text-[11px]" style={{ color: GREEN }}>
            {formatTime(time)}
          </p>
        ) : null}
      </div>
      <div className="w-full text-left sm:col-span-3 sm:text-right">
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:text-black"
            style={{ background: LIGHT }}
          >
            <MapPin className="h-3.5 w-3.5" />
            Google Maps
          </a>
        ) : null}
      </div>
    </div>
  );
}

function ArtistCard({
  role,
  person,
  photo,
}: {
  role: string;
  person?: TemplateProps["data"]["groom"];
  photo?: string;
}) {
  return (
    <div
      className="sp-reveal sp-card relative flex flex-col items-center gap-4 rounded-2xl border p-6 sm:flex-row sm:gap-6"
      style={{ borderColor: "rgba(40,40,40,0.4)" }}
    >
      <div
        className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full sm:h-36 sm:w-36"
        style={{ border: `2px solid ${GREEN}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo ?? FALLBACK_COVERS[1]}
          alt={person?.name ?? "Mempelai"}
          className="h-full w-full object-cover"
        />
        <span
          className="absolute bottom-1 right-1 rounded-full p-1 text-[10px] text-white"
          style={{ background: "#0ea5e9" }}
        >
          <CheckCircle2 className="h-3 w-3" />
        </span>
      </div>
      <div className="space-y-2 text-center sm:text-left">
        <span className="block text-[10px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>
          {role}
        </span>
        <h3 className="text-xl font-bold text-white">{person?.name ?? "Mempelai"}</h3>
        {person?.parentName ? (
          <p className="text-xs leading-relaxed" style={{ color: TEXTGRAY }}>
            Putra/Putri dari
            <br />
            <strong className="text-gray-200">{person.parentName}</strong>
          </p>
        ) : null}
        {person?.bio ? (
          <p className="text-xs italic leading-relaxed" style={{ color: TEXTGRAY }}>
            &ldquo;{person.bio}&rdquo;
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-3 pt-2 text-xs sm:justify-start" style={{ color: TEXTGRAY }}>
          {person?.instagram ? (
            <a
              href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-[#1DB954]"
            >
              <AtSign className="h-3.5 w-3.5" /> {person.instagram}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GallerySection({ gallery }: { gallery: NonNullable<TemplateProps["data"]["gallery"]> }) {
  const [selected, setSelected] = useState<{ url: string; caption?: string } | null>(null);
  return (
    <section id="sp-gallery" className="mb-14">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
        <ListMusic className="h-5 w-5" style={{ color: GREEN }} />
        Discography — Galeri Memori
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {gallery.map((g, i) => (
          <button
            type="button"
            key={g.id}
            onClick={() => setSelected({ url: g.url, caption: g.caption })}
            className="sp-reveal sp-card group cursor-pointer rounded-2xl border p-3 text-left"
            style={{ borderColor: "rgba(40,40,40,0.2)" }}
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.url}
                alt={g.caption ?? "Galeri"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span
                className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                style={{ background: GREEN }}
              >
                <Play className="h-4 w-4 fill-black text-black" />
              </span>
            </div>
            <h5 className="truncate text-xs font-bold text-white">{g.caption ?? `Single #${i + 1}`}</h5>
            <p className="mt-0.5 text-[10px]" style={{ color: TEXTGRAY }}>
              Single • {new Date().getFullYear()}
            </p>
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Lihat foto"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption ?? "Foto galeri"}
              className="max-h-[85vh] max-w-full rounded-xl border object-contain shadow-2xl"
              style={{ borderColor: "rgba(29,185,84,0.5)" }}
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup"
              className="absolute -top-12 right-0 rounded-full p-3 text-white transition-transform hover:scale-110"
              style={{ border: "1px solid rgba(29,185,84,0.6)" }}
            >
              <X className="h-6 w-6" style={{ color: GREEN }} />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PlayerBar({
  albumCover,
  title,
  playing,
  onToggle,
}: {
  albumCover?: string;
  title: string;
  playing: boolean;
  onToggle?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setElapsed((s) => (s + 1) % 210), 1000);
    return () => clearInterval(t);
  }, [playing]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-3 shadow-2xl"
      style={{ background: CARD, borderColor: LIGHT }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex w-1/3 min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={albumCover ?? FALLBACK_COVERS[0]} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-white sm:text-sm">
              {title} — Wedding Album
            </h4>
            <p className="truncate text-[10px]" style={{ color: TEXTGRAY }}>
              Medify Wedding Original Track
            </p>
          </div>
        </div>
        <div className="hidden flex-col items-center sm:flex">
          <div className="mb-1 flex items-center gap-4">
            <Shuffle className="h-3.5 w-3.5" style={{ color: TEXTGRAY }} />
            <SkipBack className="h-3.5 w-3.5" style={{ color: TEXTGRAY }} />
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? "Jeda musik" : "Putar musik"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
              disabled={!onToggle}
            >
              {playing ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="h-3.5 w-3.5 fill-black" />}
            </button>
            <SkipForward className="h-3.5 w-3.5" style={{ color: TEXTGRAY }} />
            <Repeat className="h-3.5 w-3.5" style={{ color: TEXTGRAY }} />
          </div>
          <div className="flex w-full items-center gap-2 font-mono text-[10px]" style={{ color: TEXTGRAY }}>
            <span>{fmt(elapsed)}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: LIGHT }}>
              <div className="h-full rounded-full" style={{ width: `${(elapsed / 210) * 100}%`, background: GREEN }} />
            </div>
            <span>3:30</span>
          </div>
        </div>
        <div className="flex w-1/3 items-center justify-end gap-3">
          <Equalizer playing={playing} />
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? "Jeda musik" : "Putar musik"}
              className="text-white sm:hidden"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white"
      style={{ background: BLACK }}
    >
      <Heart className="h-8 w-8" style={{ color: GREEN }} />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm" style={{ color: TEXTGRAY }}>
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}
