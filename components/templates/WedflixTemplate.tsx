"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Info,
  Plus,
  CalendarPlus,
  MapPin,
  Clock,
  AtSign,
  Share2,
  Volume2,
  VolumeX,
  Home,
  Clapperboard,
  Images,
  Star,
  X,
  ArrowUp,
  Heart,
  Building2,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useBackgroundMusic, type MusicController } from "./BackgroundMusic";
import { useCountdown, googleCalendarUrl } from "./SharedWidgets";
import {
  formatDate,
  formatTime,
  splitAgenda,
  type TemplateProps,
} from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Wedflix Original — template #16 bergaya Netflix (adopsi referensi HTML
 * "wedflix_wedding_invitation_netflix_style"), diubah 100% data-driven
 * sesuai arsitektur Meduta:
 * - Gerbang = layar "Who's Watching?" + tombol Play (efek "Tudum" WebAudio)
 * - Billboard hero, banner countdown "Release Date", Episodes (acara),
 *   Top 10 (kisah cinta), Cast (mempelai), Trailers (galeri + lightbox),
 *   Dress code, Reviews & RSVP, Amplop Digital, navbar ala Netflix
 * - Fitur Meduta yang diwiring: RSVP & ucapan (DB), kado digital + copy,
 *   musik latar user (BackgroundMusic), background kustom user/admin,
 *   foto gerbang (prioritas user > admin > mempelai > galeri[0]),
 *   Google Calendar, link tamu pribadi (guestName)
 * Font: Bebas Neue (brand) + Inter (body) — dimuat global via layout.
 * Warna: merah #E50914, hitam #141414, kartu #181818, abu #AAAAAA.
 */

/* ------------------------------------------------------------------ */
/* Palet & konstanta                                                    */
/* ------------------------------------------------------------------ */
const RED = "#E50914";
const RED_DARK = "#B81D24";
const BLACK = "#141414";
const CARD = "#181818";
const GRAY = "#AAAAAA";

/* Poster fallback untuk hero & episode (koleksi sinematik unsplash) */
const FALLBACK_BG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80";
const FALLBACK_EPISODES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80",
];

/* ------------------------------------------------------------------ */
/* CSS khusus template (prefix wf- = wedflix)                           */
/* Catatan: hindari kombinasi kelas Tailwind transform + keyframes      */
/* transform pada elemen yang sama (saling menimpa di Tailwind v4).     */
/* ------------------------------------------------------------------ */
const WF_STYLES = `
  html { scroll-behavior: smooth; }
  .wf-hover {
    transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease;
  }
  .wf-hover:hover {
    transform: scale(1.04);
    z-index: 20;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8);
  }
  @keyframes wfPulseGlow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
  .wf-pulse { animation: wfPulseGlow 1.5s ease-in-out infinite; }
  @keyframes wfFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .wf-fade-up { opacity: 0; animation: wfFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  @keyframes wfFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .wf-fade-in { animation: wfFadeIn 0.6s ease both; }
  .wf-reveal {
    opacity: 0;
    transform: translateY(26px);
    transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .wf-reveal.wf-visible { opacity: 1; transform: translateY(0); }
  .wf-hero-overlay {
    background: linear-gradient(180deg, rgba(20,20,20,0.25) 0%, rgba(20,20,20,0.55) 55%, rgba(20,20,20,1) 100%);
  }
  .wf-top10-number {
    font-family: var(--font-brand);
    -webkit-text-stroke: 3px #595959;
    color: ${BLACK};
    font-size: clamp(4rem, 9vw, 7rem);
    line-height: 0.8;
    letter-spacing: -3px;
  }
  .wf-logo-glow { text-shadow: 0 0 24px rgba(229,9,20,0.55); }
  @keyframes wfScrollBounce {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(8px); opacity: 0.5; }
  }
  .wf-scroll-hint { animation: wfScrollBounce 1.8s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .wf-fade-up, .wf-pulse, .wf-fade-in, .wf-scroll-hint { animation: none; opacity: 1; }
    .wf-reveal { opacity: 1; transform: none; transition: none; }
    .wf-hover { transition: none; }
  }
`;

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll (IntersectionObserver menambah .wf-visible)         */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".wf-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("wf-visible");
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

/* ------------------------------------------------------------------ */
/* Efek "Tudum" ala intro Netflix — disintesis WebAudio (tanpa aset)    */
/* Dipanggil di dalam klik pengguna agar lolos autoplay policy.         */
/* ------------------------------------------------------------------ */
function playTudum() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;

    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = "triangle";
    bass.frequency.setValueAtTime(120, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    bassGain.gain.setValueAtTime(0.5, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now);
    bass.stop(now + 1.1);

    [196, 246.94, 293.66, 392].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + 0.1);
      gain.gain.setValueAtTime(0.06, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.1);
      osc.stop(now + 1.6);
    });
  } catch {
    // Audio tidak tersedia (mis. webview tanpa izin) — abaikan
  }
}

/* ------------------------------------------------------------------ */
/* URL YouTube → embed                                                  */
/* ------------------------------------------------------------------ */
function toEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/,
  );
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url;
}

type EpisodeCard = {
  badge: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
  note?: string;
};

/* ------------------------------------------------------------------ */
/* Komponen utama                                                       */
/* ------------------------------------------------------------------ */
type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function WedflixTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl, props.data.musicStart, props.data.musicEnd);
  return (
    <WedflixShell
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

function WedflixShell({
  invitationId,
  slug,
  guestName,
  data,
  isPublished,
  wishes,
  decorations,
  embedded = false,
  gateOpen = true,
  onGateOpen,
  music,
}: TemplateProps & GateProps & { music?: MusicController }) {
  useReveal();
  const [toast, setToast] = useState<string | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : slug;
    navigator.clipboard
      ?.writeText(url)
      .then(() => showToast("Link undangan Wedflix berhasil disalin!"))
      .catch(() => showToast(url));
  }

  function handlePlayTrailer() {
    const embed = toEmbedUrl(data.videos?.[0]?.url);
    if (embed) setTrailerUrl(embed);
  }

  if (!isPublished) {
    return <DraftNotice />;
  }

  const groom = data.groom;
  const bride = data.bride;
  const groomNick = groom?.nickname ?? groom?.name ?? "Pria";
  const brideNick = bride?.nickname ?? bride?.name ?? "Wanita";

  // Acara: entri "Akad" pada Rangkaian Acara digabung ke Acara Utama
  const agenda = splitAgenda(
    data.events,
    {
      date: data.eventDate,
      time: data.eventTime,
      venue: [data.venueName, data.location].filter(Boolean).join(", "),
      mapUrl: data.locationMap,
    },
    { akadWins: true },
  );
  const additional = agenda.additional;

  // Kartu episode: kartu 1 = Akad (Acara Utama), sisanya dari Rangkaian
  const episodes: EpisodeCard[] = [];
  if (agenda.main.date || agenda.main.venue || agenda.main.time) {
    episodes.push({
      badge: `EPISODE ${episodes.length + 1}`,
      title: "Akad Nikah",
      date: agenda.main.date,
      time: agenda.main.time,
      venue: agenda.main.venue,
      mapUrl: agenda.main.mapUrl,
      note: "Prosesi Sakral",
    });
  }
  for (const e of additional) {
    episodes.push({
      badge: `EPISODE ${episodes.length + 1}`,
      title: e.title ?? "Acara",
      date: e.date,
      time: e.time,
      venue: e.location,
      mapUrl: e.locationMap,
      note: /^resepsi/i.test(e.title ?? "") ? "Pesta Resepsi" : undefined,
    });
  }

  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];
  const eventDate = agenda.main.date ?? data.eventDate;
  const year = eventDate ? new Date(eventDate).getFullYear() : undefined;

  // Prioritas background: pilihan user > admin (template) > bawaan
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  // Poster hero: background kustom > foto gerbang > galeri[0] > fallback
  const adminGatePhoto = getGatePhotoUrl(decorations);
  const heroPoster =
    bgUrl ||
    resolveGatePhoto({
      gatePhotoUrl: data.gatePhotoUrl,
      adminGatePhotoUrl: adminGatePhoto,
      groomPhotoUrl: groom?.photoUrl,
      bridePhotoUrl: bride?.photoUrl,
      firstGalleryUrl: gallery[0]?.url,
    }) ||
    FALLBACK_BG;
  // Foto gerbang layar "Who's Watching"
  const gatePhoto = heroPoster;
  // Kolam thumbnail episode: poster + galeri
  const episodePool = [heroPoster, ...gallery.map((g) => g.url), ...FALLBACK_EPISODES];

  const coupleNames = `${groom?.name ?? "Pria"} & ${bride?.name ?? "Wanita"}`;
  const calUrl = googleCalendarUrl({
    title: data.eventName || `Pernikahan ${coupleNames}`,
    date: eventDate,
    time: data.eventTime,
    location: agenda.main.venue,
    details: data.customMessage,
  });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-white"
      style={{ background: BLACK, fontFamily: "var(--font-inter)" }}
    >
      <style>{WF_STYLES}</style>

      {/* Navbar ala Netflix — hanya saat gerbang terbuka & bukan embed */}
      {gateOpen && !embedded ? (
        <>
          <header
            className="fixed left-0 right-0 top-0 z-40 wf-fade-in"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
              <div className="flex items-center gap-8">
                <a href="#wf-hero" className="flex items-center gap-2">
                  <span
                    className="text-3xl tracking-wider sm:text-4xl wf-logo-glow"
                    style={{ fontFamily: "var(--font-brand)", color: RED }}
                  >
                    WEDFLIX
                  </span>
                </a>
                <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-300 md:flex">
                  <a href="#wf-hero" className="transition hover:text-white">Home</a>
                  <a href="#wf-episodes" className="transition hover:text-white">Episodes</a>
                  <a href="#wf-top10" className="transition hover:text-white">Story</a>
                  <a href="#wf-cast" className="transition hover:text-white">Cast</a>
                  <a href="#wf-gallery" className="transition hover:text-white">Trailers</a>
                  <a href="#wf-rsvp" className="transition hover:text-white">Reviews</a>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                {data.musicUrl && music ? (
                  <button
                    type="button"
                    onClick={music.toggle}
                    aria-label={music.isPlaying ? "Matikan musik" : "Putar musik"}
                    className="text-zinc-300 transition hover:text-white"
                  >
                    {music.isPlaying ? (
                      <Volume2 className="h-5 w-5" style={{ color: RED }} />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Bagikan undangan"
                  title="Bagikan Undangan"
                  className="text-zinc-300 transition hover:text-white"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                {gatePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gatePhoto}
                    alt="Poster"
                    className="h-8 w-8 rounded border border-zinc-600 object-cover"
                  />
                ) : null}
              </div>
            </div>
          </header>

          {/* Bottom nav mobile */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t py-2.5 md:hidden wf-fade-in"
            style={{ background: "rgba(20,20,20,0.95)", borderColor: "#262626" }}
          >
            {[
              { href: "#wf-hero", icon: Home, label: "Home" },
              { href: "#wf-episodes", icon: Clapperboard, label: "Episodes" },
              { href: "#wf-gallery", icon: Images, label: "Trailers" },
              { href: "#wf-rsvp", icon: Star, label: "Reviews" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-0.5 text-zinc-400 transition hover:text-white"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </a>
            ))}
          </nav>
        </>
      ) : null}

      {/* GERBANG: layar "Who's Watching?" ala intro Netflix */}
      {!gateOpen ? (
        <WedflixGate
          groomNick={groomNick}
          brideNick={brideNick}
          guestName={guestName}
          eventDate={eventDate}
          gatePhoto={gatePhoto}
          onOpen={onGateOpen}
        />
      ) : null}

      {gateOpen ? (
        <main className="relative pb-20 md:pb-0">
          {/* HERO BILLBOARD */}
          <section
            id="wf-hero"
            className="relative flex min-h-[100svh] items-end overflow-hidden px-4 pb-14 pt-28 sm:px-12"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPoster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "brightness(0.55)" }}
            />
            <div className="wf-hero-overlay absolute inset-0" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="flex items-center gap-2 wf-fade-up">
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
                  style={{ background: RED }}
                >
                  N Original
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-300">
                  A Wedflix Wedding Series
                </span>
              </div>

              <h1
                className="wf-fade-up text-5xl leading-none tracking-wide text-white drop-shadow-2xl sm:text-7xl md:text-8xl"
                style={{
                  fontFamily: "var(--font-brand)",
                  animationDelay: "0.15s",
                }}
              >
                {groomNick.toUpperCase()} &amp; {brideNick.toUpperCase()}
              </h1>

              <div
                className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-200 sm:text-sm wf-fade-up"
                style={{ animationDelay: "0.3s" }}
              >
                <span className="font-bold text-green-400">99% Match</span>
                {year ? <span>{year}</span> : null}
                <span className="rounded border border-zinc-500 px-1.5 py-0.5 text-[11px] text-zinc-300">
                  SU / All Ages
                </span>
                <span className="rounded border border-zinc-500 px-1.5 py-0.5 text-[11px] text-zinc-300">
                  HD
                </span>
                <span style={{ color: RED }}>Romance &bull; Cultural &bull; Sakral</span>
              </div>

              <p
                className="max-w-xl text-xs leading-relaxed text-zinc-300 drop-shadow-md sm:text-base wf-fade-up"
                style={{ animationDelay: "0.45s" }}
              >
                {data.customMessage ||
                  `Sebuah perjalanan cinta sejati antara ${groom?.name ?? "Pria"} & ${
                    bride?.name ?? "Wanita"
                  }. Kami mengundang Anda menyaksikan episode bahagia kami — simpan tanggalnya dan saksikan langsung.`}
              </p>

              <div
                className="flex flex-wrap items-center gap-3 pt-1 wf-fade-up"
                style={{ animationDelay: "0.6s" }}
              >
                {toEmbedUrl(data.videos?.[0]?.url) ? (
                  <button
                    type="button"
                    onClick={handlePlayTrailer}
                    className="flex items-center gap-2 rounded bg-white px-6 py-2.5 text-sm font-bold text-black shadow-lg transition hover:bg-zinc-200 sm:text-base"
                  >
                    <Play className="h-5 w-5 fill-black" />
                    <span>Play Trailer</span>
                  </button>
                ) : null}
                <a
                  href="#wf-episodes"
                  className="flex items-center gap-2 rounded bg-zinc-600/80 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-zinc-700/80 sm:text-base"
                >
                  <Info className="h-5 w-5" />
                  <span>Episode Info</span>
                </a>
                {eventDate ? (
                  <a
                    href={calUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Tambah ke Kalender"
                    className="rounded-full border border-zinc-600 bg-zinc-800/80 p-2.5 text-white transition hover:bg-zinc-700"
                  >
                    <Plus className="h-5 w-5" />
                  </a>
                ) : null}
              </div>

              <div
                className="flex items-center gap-2 pt-2 text-zinc-400 wf-fade-up wf-scroll-hint"
                style={{ animationDelay: "0.9s" }}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="text-[11px] uppercase tracking-[0.3em]">Gulir ke bawah</span>
              </div>
            </div>
          </section>

          {/* BANNER COUNTDOWN "RELEASE DATE" */}
          <section
            className="my-6 border-y px-4 py-6 sm:px-12 wf-reveal"
            style={{ background: "rgba(24,24,24,0.9)", borderColor: "#262626" }}
          >
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
              <div className="flex items-center gap-3 text-center md:text-left">
                <span
                  className="wf-pulse h-3 w-3 shrink-0 rounded-full"
                  style={{ background: RED }}
                />
                <div>
                  <span
                    className="block text-xs font-bold uppercase tracking-widest"
                    style={{ color: RED }}
                  >
                    Release Date Countdown
                  </span>
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    Saksikan Hari Bahagia Kami Secara Langsung
                  </h3>
                </div>
              </div>
              <CountdownBoxes target={eventDate} />
            </div>
          </section>

          {/* EPISODES (ACARA) */}
          <section id="wf-episodes" className="mx-auto max-w-7xl px-4 py-10 sm:px-12">
            <div className="mb-6">
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                <span>Episodes &amp; Acara</span>
                <span
                  className="rounded px-2 py-0.5 text-xs font-normal uppercase tracking-widest text-zinc-400"
                  style={{ background: "#282828" }}
                >
                  Season {year ?? "1"}
                </span>
              </h2>
              {eventDate ? (
                <p className="mt-1 text-xs" style={{ color: GRAY }}>
                  {formatDate(eventDate)}
                  {agenda.main.venue ? ` — ${agenda.main.venue}` : ""}
                </p>
              ) : null}
            </div>

            {episodes.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {episodes.map((ep, i) => (
                  <EpisodeCardView
                    key={`${ep.badge}-${i}`}
                    ep={ep}
                    image={episodePool[i % episodePool.length]}
                  />
                ))}
              </div>
            ) : null}
          </section>

          {/* TOP 10 STORY */}
          {story.length > 0 ? (
            <section id="wf-top10" className="mx-auto max-w-7xl px-4 py-12 sm:px-12">
              <h2 className="mb-6 flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
                <span
                  className="rounded px-2 py-0.5 text-xs font-black text-white"
                  style={{ background: RED }}
                >
                  TOP 10
                </span>
                <span>Momen Teratas: Perjalanan Kisah Kami</span>
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {story.map((item, i) => (
                  <div
                    key={item.id}
                    className="wf-reveal wf-hover relative flex items-center gap-4 overflow-hidden rounded border p-5"
                    style={{ background: CARD, borderColor: "#262626" }}
                  >
                    <span className="wf-top10-number shrink-0 select-none">
                      {i + 1}
                    </span>
                    <div className="relative z-10">
                      <span
                        className="block text-xs font-bold uppercase tracking-wider"
                        style={{ color: RED }}
                      >
                        {item.date ? formatDate(item.date) : ""}
                      </span>
                      <h4 className="mt-0.5 text-sm font-bold text-white">
                        {item.title ?? ""}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {item.description ?? ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* CAST (MEMPELAI) */}
          {groom?.name || bride?.name ? (
            <section id="wf-cast" className="mx-auto max-w-7xl px-4 py-10 sm:px-12">
              <h2 className="mb-6 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Cast &amp; Main Characters (Sang Pengantin)
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <CastCard
                  person={groom}
                  role="The Groom"
                  alt={groom?.name ?? "Mempelai pria"}
                />
                <CastCard
                  person={bride}
                  role="The Bride"
                  alt={bride?.name ?? "Mempelai wanita"}
                />
              </div>
            </section>
          ) : null}

          {/* TRAILERS / GALERI */}
          {gallery.length > 0 ? (
            <GallerySection gallery={gallery} />
          ) : null}

          {/* DRESS CODE */}
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-12">
            <div
              className="wf-reveal rounded-lg border p-8"
              style={{ background: CARD, borderColor: "#262626" }}
            >
              <div className="mx-auto max-w-3xl space-y-4 text-center">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: RED }}
                >
                  Audience Dress Code Recommendation
                </span>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Panduan Busana Tamu Undangan
                </h2>
                <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                  Untuk menyelaraskan suasana hari bahagia kami, kami mengimbau
                  Bapak/Ibu/Saudara/i mengenakan pakaian formal atau batik
                  dengan nuansa warna berikut:
                </p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  {[
                    { color: "#6B4A32", label: "Sogan" },
                    { color: "#38261C", label: "Dark Brown" },
                    { color: "#263A2B", label: "Deep Green" },
                    { color: "#E9DDC5", label: "Cream" },
                  ].map((sw) => (
                    <div key={sw.label} className="text-center">
                      <span
                        className="mx-auto block h-10 w-10 rounded-full border-2 border-zinc-600"
                        style={{ background: sw.color }}
                      />
                      <span className="mt-1 block text-[10px] text-zinc-400">
                        {sw.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* REVIEWS & RSVP */}
          <section id="wf-rsvp" className="mx-auto max-w-5xl px-4 py-12">
            <div className="mb-10 text-center wf-reveal">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: RED }}
              >
                Audience Reviews &amp; RSVP
              </span>
              <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                Ulasan Audience &amp; RSVP Kehadiran
              </h2>
              <p className="mt-2 text-xs" style={{ color: GRAY }}>
                Konfirmasi kehadiran dan sampaikan doa restu untuk kedua mempelai
              </p>
            </div>

            <div
              className="wf-reveal mb-10 rounded-lg border p-6 sm:p-8"
              style={{ background: CARD, borderColor: "#262626" }}
            >
              <RsvpForm
                invitationId={invitationId}
                initialName={guestName}
                accentClass="bg-[#E50914] hover:bg-[#B81D24] text-white shadow-lg"
                borderClass="border-zinc-700 bg-black/60 text-white placeholder-zinc-500 focus:border-[#E50914] focus:ring-[#E50914]/30"
              />
              <div className="mt-4 flex justify-center">
                <span
                  className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-[11px] font-semibold"
                  style={{ color: RED, background: "rgba(229,9,20,0.1)" }}
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Simpan tanggal:{" "}
                  <a href={calUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Google Calendar
                  </a>
                </span>
              </div>
            </div>

            <div className="wf-reveal">
              <h3 className="mb-4 flex flex-wrap items-center justify-between gap-2 text-lg font-bold text-white">
                <span>Recent Audience Reviews</span>
                <span className="text-xs font-semibold" style={{ color: RED }}>
                  &#11088;&#11088;&#11088;&#11088;&#11088; Wedding Wall
                </span>
              </h3>
              <div
                className="mb-8 max-h-[420px] space-y-4 overflow-y-auto rounded-lg border p-4"
                style={{ background: "rgba(0,0,0,0.3)", borderColor: "#262626" }}
              >
                <WishList
                  wishes={wishes ?? []}
                  cardClass="border-[#262626] bg-[#181818]"
                  nameClass="text-white"
                  avatarClass="text-white"
                  emptyClass="text-zinc-500"
                />
              </div>
              <div
                className="rounded-lg border p-6 sm:p-8"
                style={{ background: CARD, borderColor: "#262626" }}
              >
                <WishForm
                  invitationId={invitationId}
                  accentClass="bg-[#E50914] hover:bg-[#B81D24] text-white shadow-lg"
                  borderClass="border-zinc-700 bg-black/60 text-white placeholder-zinc-500 focus:border-[#E50914] focus:ring-[#E50914]/30"
                />
              </div>
            </div>
          </section>

          {/* AMPLOP DIGITAL */}
          {gifts.length > 0 ? (
            <section className="mx-auto max-w-4xl px-4 py-12 text-center">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: RED }}
              >
                Wedflix Subscription &amp; Tanda Kasih
              </span>
              <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl wf-reveal">
                Amplop Digital (Send A Gift)
              </h2>
              <p className="mx-auto mt-2 mb-8 max-w-lg text-xs wf-reveal" style={{ color: GRAY }}>
                Doa dan restu Anda adalah karunia terbesar bagi kami. Apabila Anda
                hendak memberikan hadiah tanda kasih, Anda dapat menyalurkannya
                melalui rekening berikut:
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {gifts.map((g, i) => (
                  <div
                    key={g.id}
                    className="wf-reveal wf-hover rounded-lg border p-6"
                    style={{ background: CARD, borderColor: "#262626" }}
                  >
                    {i % 2 === 0 ? (
                      <Building2 className="mx-auto mb-3 h-8 w-8" style={{ color: RED }} />
                    ) : (
                      <CreditCard className="mx-auto mb-3 h-8 w-8" style={{ color: RED }} />
                    )}
                    <h4 className="text-lg font-bold text-white">
                      {g.provider || g.name}
                    </h4>
                    <p className="my-2 font-mono text-sm font-bold text-zinc-300">
                      {g.accountNumber}
                    </p>
                    {g.holderName ? (
                      <p className="mb-4 text-xs text-zinc-400">a.n. {g.holderName}</p>
                    ) : (
                      <div className="mb-4" />
                    )}
                    <CopyButton text={g.accountNumber} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* FOOTER */}
          <footer
            className="mt-16 border-t px-6 py-12 text-center"
            style={{ borderColor: "#262626" }}
          >
            <p
              className="mb-2 text-2xl tracking-wider wf-logo-glow"
              style={{ fontFamily: "var(--font-brand)", color: RED }}
            >
              WEDFLIX ORIGINALS
            </p>
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} {coupleNames}. Created with love
              and cinematic passion.
            </p>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-600">
              Powered by Meduta
            </p>
          </footer>
        </main>
      ) : null}

      {/* FAB musik + kembali ke atas (posisi di atas bottom-nav mobile) */}
      {gateOpen && !embedded && data.musicUrl && music ? (
        <div className="fixed bottom-24 right-5 z-40 flex flex-col gap-3 md:bottom-6">
          <button
            type="button"
            onClick={music.toggle}
            aria-label={music.isPlaying ? "Matikan musik latar" : "Putar musik latar"}
            className="flex h-11 w-11 items-center justify-center rounded-full shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
            style={{ background: CARD, border: `1px solid ${RED}66` }}
          >
            {music.isPlaying ? (
              <Volume2 className="h-5 w-5" style={{ color: RED }} />
            ) : (
              <VolumeX className="h-5 w-5 opacity-70" />
            )}
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            className="flex h-11 w-11 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-110"
            style={{ background: CARD, border: `1px solid ${RED}44` }}
          >
            <ArrowUp className="h-5 w-5 text-zinc-300" />
          </button>
        </div>
      ) : null}

      {/* MODAL TRAILER */}
      {trailerUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-label="Trailer"
          onClick={() => setTrailerUrl(null)}
        >
          <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-lg border bg-black shadow-2xl" style={{ borderColor: "#262626" }}>
            <button
              type="button"
              onClick={() => setTrailerUrl(null)}
              aria-label="Tutup trailer"
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:text-white"
              style={{ color: RED }}
            >
              <X className="h-6 w-6" />
            </button>
            <iframe
              src={trailerUrl}
              title="Wedflix Trailer"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {/* TOAST */}
      <div
        className={`pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded px-6 py-3 text-xs font-semibold text-white shadow-2xl transition-all duration-300 ${
          toast ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: RED }}
        role="status"
      >
        {toast ?? ""}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang: layar "Who's Watching?" + tombol Play                       */
/* ------------------------------------------------------------------ */
function WedflixGate({
  groomNick,
  brideNick,
  guestName,
  eventDate,
  gatePhoto,
  onOpen,
}: {
  groomNick: string;
  brideNick: string;
  guestName?: string;
  eventDate?: string;
  gatePhoto?: string;
  onOpen?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center"
      style={{ background: BLACK }}
    >
      {/* Poster latar + gradasi sinematik */}
      {gatePhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gatePhoto}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(0.32)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,20,20,0.55) 0%, rgba(20,20,20,0.35) 45%, rgba(20,20,20,1) 100%)",
            }}
          />
        </>
      ) : null}

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center">
        <div className="mb-6 wf-fade-up">
          <h1
            className="text-6xl tracking-wider wf-logo-glow md:text-8xl"
            style={{ fontFamily: "var(--font-brand)", color: RED }}
          >
            WEDFLIX
          </h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-zinc-400">
            A Special Wedding Original
          </p>
        </div>

        <h2 className="mb-6 text-2xl font-bold tracking-tight text-white md:text-4xl wf-fade-up" style={{ animationDelay: "0.15s" }}>
          Who&apos;s Watching?
        </h2>
        <p className="-mt-4 mb-8 text-xs text-zinc-400 wf-fade-up" style={{ animationDelay: "0.2s" }}>
          Siapa yang Menyaksikan?
        </p>

        {/* Kartu profil tamu (alih-alih grid 3 profil statis) */}
        <button
          type="button"
          onClick={() => {
            playTudum();
            onOpen?.();
          }}
          className="group mb-8 flex w-36 flex-col items-center gap-3 wf-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="relative block h-24 w-24 overflow-hidden rounded-md border-2 border-transparent shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-white">
            {gatePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gatePhoto}
                alt={guestName ?? "Tamu"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-3xl"
                style={{ background: "#282828", color: RED }}
              >
                &#9825;
              </span>
            )}
            <span className="absolute inset-0 bg-black/25 transition group-hover:bg-transparent" />
          </span>
          <span className="text-xs font-medium text-zinc-400 transition group-hover:text-white">
            {guestName ?? "Tamu Undangan"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTudum();
            onOpen?.();
          }}
          className="flex items-center gap-2 rounded px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:opacity-90 wf-fade-up"
          style={{ background: RED, animationDelay: "0.4s" }}
        >
          <Play className="h-4 w-4 fill-white" />
          Tonton Undangan (Play)
        </button>

        <p className="mt-4 text-[11px] text-zinc-500 wf-fade-up" style={{ animationDelay: "0.5s" }}>
          *Klik untuk mengaktifkan musik latar
        </p>

        <p className="mt-10 text-sm text-zinc-300 wf-fade-up" style={{ animationDelay: "0.6s" }}>
          <span style={{ fontFamily: "var(--font-brand)", letterSpacing: "0.06em" }}>
            {groomNick.toUpperCase()} &amp; {brideNick.toUpperCase()}
          </span>
          {eventDate ? (
            <span className="block text-[11px] text-zinc-500">{formatDate(eventDate)}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu episode (Acara)                                                */
/* ------------------------------------------------------------------ */
function EpisodeCardView({ ep, image }: { ep: EpisodeCard; image: string }) {
  return (
    <div
      className="wf-reveal wf-hover group flex flex-col overflow-hidden rounded-md border sm:flex-row"
      style={{ background: CARD, borderColor: "#262626" }}
    >
      <div className="relative aspect-video overflow-hidden sm:aspect-auto sm:w-5/12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={ep.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className="absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-bold text-white"
          style={{ background: RED }}
        >
          {ep.badge}
        </span>
      </div>
      <div className="flex flex-col justify-between gap-4 p-6 sm:w-7/12">
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {ep.time ? formatTime(ep.time) : ""}
            </span>
            {ep.note ? (
              <span className="font-semibold text-green-400">{ep.note}</span>
            ) : null}
          </div>
          <h3 className="text-lg font-bold text-white transition group-hover:text-[#E50914]">
            {ep.title}
          </h3>
          {ep.date ? (
            <p className="mt-1 text-xs font-semibold text-zinc-300">
              {formatDate(ep.date)}
            </p>
          ) : null}
          {ep.venue ? (
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-zinc-300">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: RED }} />
              {ep.venue}
            </p>
          ) : null}
        </div>
        {ep.mapUrl ? (
          <a
            href={ep.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: "#282828" }}
          >
            <MapPin className="h-4 w-4" />
            <span>Buka Google Maps</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu cast (mempelai)                                                */
/* ------------------------------------------------------------------ */
function CastCard({
  person,
  role,
  alt,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  alt: string;
}) {
  if (!person) return null;
  return (
    <div
      className="wf-reveal wf-hover flex flex-col items-center gap-4 rounded-lg border p-6 sm:flex-row sm:items-start sm:gap-6"
      style={{ background: CARD, borderColor: "#262626" }}
    >
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={alt}
          className="h-40 w-32 rounded-md border-2 object-cover shadow-lg"
          style={{ borderColor: `${RED}99` }}
        />
      ) : null}
      <div className="space-y-2 text-center sm:text-left">
        <span
          className="block text-xs font-bold uppercase tracking-widest"
          style={{ color: RED }}
        >
          {role}
        </span>
        <h3 className="text-xl font-bold text-white">{person.name}</h3>
        {person.parentName ? (
          <p className="text-xs leading-relaxed text-zinc-400">
            {person.childOf ?? "Putra/Putri dari"}
            <br />
            <strong className="text-zinc-200">{person.parentName}</strong>
          </p>
        ) : null}
        {person.bio ? (
          <p className="text-xs italic leading-relaxed text-zinc-500">
            &ldquo;{person.bio}&rdquo;
          </p>
        ) : null}
        {person.instagram ? (
          <a
            href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 pt-2 text-xs hover:underline"
            style={{ color: RED }}
          >
            <AtSign className="h-4 w-4" />
            <span>{person.instagram}</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri poster 2:3 + lightbox                                         */
/* ------------------------------------------------------------------ */
function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<{ url: string; caption?: string } | null>(
    null,
  );
  return (
    <section id="wf-gallery" className="mx-auto max-w-7xl px-4 py-10 sm:px-12">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-white sm:text-2xl">
        Trailers &amp; Prewedding Gallery (Memori)
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {gallery.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected({ url: item.url, caption: item.caption })}
            className="wf-reveal wf-hover group relative aspect-[2/3] cursor-pointer overflow-hidden rounded border"
            style={{ background: "#282828", borderColor: "#262626" }}
            aria-label={item.caption ?? "Lihat foto"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.caption ?? "Foto galeri"}
              className="h-full w-full object-cover"
            />
            <span
              className="absolute inset-0 flex items-end p-2 opacity-0 transition group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 55%)",
              }}
            >
              <span className="text-left text-[10px] font-bold tracking-tight text-white">
                {item.caption ?? ""}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-label="Lihat foto"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Tutup"
            className="absolute right-6 top-6 text-white transition hover:opacity-70"
            style={{ color: RED }}
          >
            <X className="h-8 w-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.url}
            alt={selected.caption ?? "Foto galeri"}
            className="max-h-[85vh] max-w-full rounded border object-contain shadow-2xl"
            style={{ borderColor: "#262626" }}
          />
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kotak countdown ala banner release date                              */
/* ------------------------------------------------------------------ */
function CountdownBoxes({ target }: { target?: string }) {
  const { days, hours, minutes, seconds } = useCountdown(target);
  const items = [
    { label: "Hari", value: days },
    { label: "Jam", value: hours },
    { label: "Menit", value: minutes },
    { label: "Detik", value: seconds },
  ];
  return (
    <div className="flex items-center gap-3 text-center sm:gap-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[64px] rounded border px-3 py-2 sm:min-w-[74px]"
          style={{ background: "rgba(0,0,0,0.8)", borderColor: "#262626" }}
        >
          <span
            className="block text-2xl tabular-nums text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-brand)", color: RED }}
          >
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-zinc-400">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Draft notice                                                         */
/* ------------------------------------------------------------------ */
function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white"
      style={{ background: BLACK }}
    >
      <Heart className="h-8 w-8" style={{ color: RED }} />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-white/60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
      <p
        className="mt-4 text-xl tracking-widest"
        style={{ fontFamily: "var(--font-brand)", color: RED }}
      >
        WEDFLIX
      </p>
    </div>
  );
}
