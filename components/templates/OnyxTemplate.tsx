"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Heart,
  ExternalLink,
  AtSign,
  Gift,
  ChevronDown,
  ArrowUp,
  PartyPopper,
  X,
} from "lucide-react";
import OnyxGate from "./OnyxGate";
import { OnyxCoupleCircle, OnyxPersonFrame, OnyxRibbons } from "./OnyxDecor";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown, googleCalendarUrl } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type Decoration, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Onyx Elegance — adopsi 1:1 dari referensi "black elegan.svg"
 * (undangan gelap elegan dengan aksen fuchsia), diubah menjadi
 * data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic), RSVP & ucapan tersimpan DB
 * - Background berlapis: pilihan user > admin (template) > bawaan onyx
 * Khas template ini: latar onyx #202020, ornamen sudut cermin (aset SVG),
 * aksen fuchsia #F50260, frame foto quarter-arch pink, shimmer pada
 * teks, fade-up entrance, partikel debu emas, reveal-on-scroll.
 * Semua animasi CSS murni (tanpa framer-motion) dan TANPA backdrop-blur
 * pada kartu berisi teks (pelajaran teks buram Chromium/Windows).
 */

/* ------------------------------------------------------------------ */
/* CSS khusus template (prefix ox- = onyx)                             */
/* ------------------------------------------------------------------ */
const OX_STYLES = `
  .ox-card {
    background: linear-gradient(165deg, #2a2a2a 0%, #212121 55%, #1c1c1c 100%);
    border: 1px solid rgba(245,2,96,0.32);
    box-shadow: 0 18px 44px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.045);
  }
  .ox-card-solid {
    background: linear-gradient(165deg, #262626 0%, #1e1e1e 100%);
    border: 1px solid rgba(245,2,96,0.25);
  }
  @keyframes oxShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .ox-shimmer {
    background-image: linear-gradient(110deg, #ffffff 30%, #ffd7e6 45%, #F50260 50%, #ffd7e6 55%, #ffffff 70%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: oxShimmer 6s linear infinite;
    text-shadow: none;
    filter: drop-shadow(0 0 12px rgba(245,2,96,0.3));
  }
  @keyframes oxFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ox-fade-up {
    opacity: 0;
    animation: oxFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  /* Reveal saat scroll (IntersectionObserver menambah .ox-visible) */
  .ox-reveal {
    opacity: 0;
    transform: translateY(26px);
    transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ox-reveal.ox-visible { opacity: 1; transform: translateY(0); }
  @keyframes oxGlowPulse {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(245,2,96,0.35)); opacity: 0.85; }
    50% { filter: drop-shadow(0 0 12px rgba(245,2,96,0.7)); opacity: 1; }
  }
  .ox-glow { animation: oxGlowPulse 4s ease-in-out infinite; }
  @keyframes oxDustRise {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    15% { opacity: 0.9; }
    85% { opacity: 0.4; }
    100% { transform: translateY(-120px) translateX(16px); opacity: 0; }
  }
  .ox-dust { animation: oxDustRise linear infinite; }
  @keyframes onyxRibbonIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .onyx-ribbon-in { animation: onyxRibbonIn 1.2s ease both; }
  @keyframes onyxDecorFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-7px); }
  }
  .onyx-decor-float { animation: onyxDecorFloat 5s ease-in-out infinite; }
  @keyframes onyxHeartBeat {
    0%, 100% { transform: scale(1); }
    12% { transform: scale(1.14); }
    24% { transform: scale(1); }
    36% { transform: scale(1.1); }
  }
  .onyx-heart-beat { animation: onyxHeartBeat 2.4s ease-in-out infinite; }
  @keyframes oxFloatY {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .ox-float { animation: oxFloatY 5.5s ease-in-out infinite; }
  @keyframes oxDividerDraw {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  .ox-divider {
    background: linear-gradient(to right, rgba(245,2,96,0) 0%, #F50260 50%, rgba(245,2,96,0) 100%);
    transform-origin: center;
    animation: oxDividerDraw 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes oxScrollBounce {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(8px); opacity: 0.55; }
  }
  .ox-scroll-hint { animation: oxScrollBounce 1.8s ease-in-out infinite; }
  @keyframes oxTwinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(0.8); }
  }
  .ox-twinkle { animation: oxTwinkle 2.4s ease-in-out infinite; }
`;

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll: tambah kelas .ox-visible saat elemen masuk layar  */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".ox-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("ox-visible");
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
/* Partikel debu emas-fuchsia (CSS murni)                              */
/* ------------------------------------------------------------------ */
function GoldDust({ count = 26 }: { count?: number }) {
  const specks = Array.from({ length: count }, (_, i) => {
    const seed = (i * 7919) % 100;
    return {
      left: `${(seed * 0.97 + 1.5) % 100}%`,
      top: `${(seed * 1.31 + 3) % 100}%`,
      size: 2 + ((i * 13) % 4),
      delay: `${(i % 10) * 1.3}s`,
      duration: `${10 + (i % 8)}s`,
      gold: i % 3 === 0,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {specks.map((s, i) => (
        <span
          key={i}
          className="ox-dust absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
            background: s.gold ? "#fbbf24" : "#F50260",
            boxShadow: s.gold ? "0 0 6px rgba(251,191,36,.8)" : "0 0 6px rgba(245,2,96,.8)",
          }}
        />
      ))}
    </div>
  );
}

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function OnyxTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <OnyxShell
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

function OnyxShell({
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
  // Acara: entri "Akad" pada Rangkaian Acara digabung ke Acara Utama agar
  // tidak tampil dobel (lihat splitAgenda).
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

  // Prioritas background: pilihan user > admin (template) > bawaan onyx
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  // Foto couple eksplisit untuk lingkaran cover (Artboard 2): pilihan
  // user > admin. Tanpa itu → diptych foto mempelai dalam lingkaran.
  const couplePhoto = data?.gatePhotoUrl || getGatePhotoUrl(decorations);
  // Prioritas foto gerbang: user > admin (dekorasi) > mempelai > galeri[0]
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: data?.groom?.photoUrl,
    bridePhotoUrl: data?.bride?.photoUrl,
    firstGalleryUrl: data?.gallery?.[0]?.url,
  });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans text-white"
      style={bgUrl ? undefined : { background: "#202020" }}
    >
      <style>{OX_STYLES}</style>

      {/* Background kustom user/admin sebagai lapisan penuh + pengapit gelap */}
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
            style={{ background: "rgba(20,20,20,0.72)" }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(245,2,96,0.09) 0%, rgba(32,32,32,0) 55%), radial-gradient(ellipse 90% 50% at 50% 100%, rgba(245,2,96,0.07) 0%, rgba(32,32,32,0) 55%)",
          }}
        />
      )}

      <Cover
        eventName={data.eventName ?? "Undangan Pernikahan"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data.eventDate}
        venue={data.location}
        guestName={guestName}
        couplePhoto={couplePhoto}
        groomPhoto={groom?.photoUrl}
        bridePhoto={bride?.photoUrl}
        locked={!gateOpen}
        onOpen={onGateOpen}
        decorations={decorations}
      />

      {/* Urutan ala Artboard 4: mempelai dulu, lalu hitung mundur */}
      {groom?.name || bride?.name ? (
        <Couple
          groom={groom}
          bride={bride}
          quoteTitle={data.quoteTitle}
          quoteText={data.quoteText}
          quoteSource={data.quoteSource}
          quoteHidden={data.quoteHidden}
        />
      ) : null}

      <CountdownSection eventDate={agenda.main.date} eventName={data.eventName} />

      {story.length > 0 ? <StorySection story={story} /> : null}

      <EventsSection main={agenda.main} events={events} />

      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      <RsvpSection invitationId={invitationId} guestName={guestName} />

      <Wishes invitationId={invitationId} wishes={wishes} />

      {data.customMessage ? <MessageSection text={data.customMessage} /> : null}

      <Footer groomName={groom?.name} brideName={bride?.name} />

      {/* FAB musik + tombol kembali ke atas */}
      {data.musicUrl && music ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            positionClassName="relative z-50"
            buttonClassName="border border-[#F50260]/60 bg-[#2a2a2a] text-white shadow-[0_0_18px_rgba(245,2,96,0.35)]"
            playingIconClassName="h-5 w-5 text-[#F50260]"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            style={{ background: "#2a2a2a", border: "1px solid rgba(245,2,96,0.5)" }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-110"
          >
            <ArrowUp className="h-5 w-5 text-[#F50260]" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white"
      style={{ background: "#202020" }}
    >
      <Heart className="h-8 w-8 text-[#F50260]" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-white/60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heading section: script fuchsia ber-shimmer + judul serif putih     */
/* ------------------------------------------------------------------ */
function SectionHeading({
  script,
  title,
  desc,
}: {
  script: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="ox-reveal mb-14 text-center">
      <span className="ox-shimmer text-4xl" style={{ fontFamily: "var(--font-script)" }}>
        {script}
      </span>
      <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white sm:text-4xl">
        {title}
      </h2>
      <span className="ox-divider mx-auto mt-4 block h-px w-24" />
      {desc ? (
        <p className="mx-auto mt-3 max-w-md font-[family-name:var(--font-serif-elegant)] text-sm italic text-white/60">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. HERO: frame quarter-ellipse pink + label + nama script (aset SVG)*/
/* ------------------------------------------------------------------ */
function Cover({
  eventName,
  groomNick,
  brideNick,
  eventDate,
  venue,
  guestName,
  couplePhoto,
  groomPhoto,
  bridePhoto,
  locked = false,
  onOpen,
  decorations,
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  venue?: string;
  guestName?: string;
  couplePhoto?: string;
  groomPhoto?: string;
  bridePhoto?: string;
  locked?: boolean;
  onOpen?: () => void;
  decorations?: Decoration[];
}) {
  const cover = (
    <header className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-20 text-center">
      {/* Buket bunga di 4 sudut — penempatan ala SVG asli */}
      <OnyxRibbons />

      <GoldDust count={20} />

      <div className="relative z-10 flex w-full flex-col items-center px-2">
        <h1 className="sr-only">
          Undangan Pernikahan {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
        </h1>
        {/* Judul hanya di halaman buka undangan (Artboard 2 tanpa judul);
            teks ini sr-only untuk aksesibilitas & SEO */}
        <p className="sr-only">
          The Wedding Of — Undangan Pernikahan {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
        </p>

        {/* Lingkaran foto couple + ring emas bunga kuning (Artboard 2);
            Artboard 2 memang tanpa nama — nama hanya sr-only */}
        <div
          className="ox-fade-up mt-4 w-[72%] max-w-[360px]"
          style={{ animationDelay: "0.4s" }}
        >
          <OnyxCoupleCircle
            photo={couplePhoto}
            groomPhoto={groomPhoto}
            bridePhoto={bridePhoto}
          />
        </div>

      {/* Pill tanggal & lokasi — kartu SOLID agar teks tajam */}
      {(eventDate || venue) && (
        <div
          className="ox-fade-up mt-8 inline-flex flex-wrap items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg md:text-base"
          style={{ background: "#262626", border: "1px solid rgba(245,2,96,0.4)", animationDelay: "0.9s" }}
        >
          {eventDate ? (
            <>
              <CalendarDays className="h-5 w-5 text-[#F50260]" />
              <span>{formatDate(eventDate)}</span>
            </>
          ) : null}
          {eventDate && venue ? <span className="text-[#F50260]">|</span> : null}
          {venue ? (
            <>
              <MapPin className="h-5 w-5 text-[#F50260]" />
              <span>{venue}</span>
            </>
          ) : null}
        </div>
      )}

      {/* Indikator gulir */}
      <div className="ox-fade-up mt-10 flex flex-col items-center" style={{ animationDelay: "1.1s" }}>
        <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">
          Gulir Ke Bawah
        </span>
        <span className="ox-scroll-hint flex h-10 w-10 items-center justify-center rounded-full text-[#F50260]" style={{ border: "1px solid rgba(245,2,96,0.5)" }}>
          <ChevronDown className="h-6 w-6" />
        </span>
      </div>
      </div>
    </header>
  );

  // Saat gerbang tertutup: OnyxGate fullscreen
  if (locked) {
    return (
      <OnyxGate
        eventName={eventName === "Undangan Pernikahan" ? "The Wedding Of" : eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        guestName={guestName}
        onOpen={onOpen}
        decorations={decorations}
      />
    );
  }

  return cover;
}

/* ------------------------------------------------------------------ */
/* 2. COUNTDOWN: kartu onyx dengan strip fuchsia                       */
/* ------------------------------------------------------------------ */
function CountdownSection({
  eventDate,
  eventName,
}: {
  eventDate?: string;
  eventName?: string;
}) {
  const { days, hours, minutes, seconds } = useCountdown(eventDate);
  const items = [
    { label: "Hari", value: days },
    { label: "Jam", value: hours },
    { label: "Menit", value: minutes },
    { label: "Detik", value: seconds },
  ];
  const calUrl = googleCalendarUrl({
    title: eventName ?? "Pernikahan",
    date: eventDate,
  });
  return (
    <section className="relative px-4 py-16 text-center">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          script="Save The Date"
          title="Hitung Mundur Hari Bahagia"
          desc="Menghitung detik menuju pengikatan janji suci"
        />

        <div className="ox-reveal mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="ox-card group relative overflow-hidden rounded-3xl p-6 text-center transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: "linear-gradient(to right, rgba(245,2,96,0), #F50260, rgba(245,2,96,0))" }} />
              <span className="block font-[family-name:var(--font-serif-elegant)] text-4xl font-bold tabular-nums text-white transition-colors group-hover:text-[#F50260] md:text-5xl">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-xs font-semibold uppercase tracking-widest text-white/50">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {eventDate ? (
          <div className="ox-reveal mt-10">
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white shadow-lg transition-transform duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #3a0a1e 0%, #2b0616 100%)",
                border: "1.5px solid #F50260",
              }}
            >
              <CalendarDays className="h-5 w-5 text-[#F50260]" />
              <span>Simpan Tanggal ke Google Calendar</span>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. MEMPELAI: kartu onyx dengan frame quarter-ellipse                */
/* ------------------------------------------------------------------ */
function Couple({
  groom,
  bride,
  quoteTitle,
  quoteText,
  quoteSource,
  quoteHidden,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
  // Kutipan (judul/isi/sumber) dari user (Pengaturan Umum) atau admin
  // (Data Contoh). Desain Onyx tidak membawa ayat bawaan, jadi bagian ini
  // hanya tampil bila salah satu kolom diisi.
  quoteTitle?: string;
  quoteText?: string;
  quoteSource?: string;
  // Set true untuk menyembunyikan seluruh bagian kutipan.
  quoteHidden?: boolean;
}) {
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          script="Pasangan Mempelai"
          title="Mempelai Pria & Wanita"
          desc="Dengan memohon rahmat dan ridho Allah SWT, kami menyatukan dua insan"
        />

        {/* Dua foto bersebelahan dipisah garis pink (Artboard 4) */}
        <div className="ox-reveal relative mx-auto flex max-w-lg items-start justify-center">
          <PersonCard person={groom} role="Mempelai Pria" side="left" />
          {/* Pemisah vertikal pink di tengah */}
          <span
            aria-hidden
            className="mx-1 mt-2 hidden w-[3px] self-stretch sm:block"
            style={{ background: "linear-gradient(to bottom, rgba(245,2,96,0) 0%, #E5045B 15%, #E5045B 85%, rgba(245,2,96,0) 100%)" }}
          />
          <PersonCard person={bride} role="Mempelai Wanita" side="right" />
        </div>

        {/* Kutipan — hanya tampil bila diisi user/admin (sesuai kepercayaan),
            dan tidak disembunyikan */}
        {!quoteHidden && (quoteText?.trim() || quoteTitle?.trim() || quoteSource?.trim()) ? (
          <div className="ox-reveal mx-auto mt-12 max-w-xl rounded-3xl border border-fuchsia-300/25 bg-white/[0.06] p-6 text-center backdrop-blur-md">
            {quoteTitle?.trim() ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
                {quoteTitle}
              </p>
            ) : null}
            <p
              className={`font-[family-name:var(--font-serif-elegant)] text-sm italic leading-relaxed text-white/85 ${
                quoteTitle?.trim() ? "mt-3" : ""
              }`}
            >
              &ldquo;{quoteText}&rdquo;
            </p>
            {quoteSource?.trim() ? (
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
                {quoteSource}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  side = "left",
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  /** Posisi pasangan: backing pink menjorok ke arah pemisah tengah. */
  side?: "left" | "right";
}) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      {/* Bingkai persegi ala Artboard 4 */}
      <div className="w-full max-w-[220px]">
        <OnyxPersonFrame
          photo={person?.photoUrl}
          alt={person?.name ?? role}
          side={side}
        />
      </div>

      <h3
        className="mt-4 text-3xl text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {person?.name ?? "-"}
      </h3>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F50260]">
        {role}
      </p>

      {person?.parentName && (
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          {person.childOf ?? "Putra/Putri dari"} <br />
          <span className="font-bold text-white">{person.parentName}</span>
        </p>
      )}
      {person?.bio && (
        <p className="mt-3 text-xs italic leading-relaxed text-white/50">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}

      {person?.instagram && (
        <div className="mt-6">
          <a
            href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #3a0a1e 0%, #2b0616 100%)", border: "1px solid rgba(245,2,96,0.5)" }}
          >
            <AtSign className="h-4 w-4 text-[#F50260]" />
            <span>{person.instagram}</span>
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. KISAH CINTA                                                      */
/* ------------------------------------------------------------------ */
function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading script="Kisah Cinta Kami" title="Perjalanan Menuju Janji Suci" />

        <div className="relative space-y-8">
          {/* Garis vertikal aksen */}
          <span className="absolute bottom-4 left-[19px] top-2 hidden w-px sm:block" style={{ background: "linear-gradient(to bottom, rgba(245,2,96,0) 0%, rgba(245,2,96,0.5) 12%, rgba(245,2,96,0.5) 88%, rgba(245,2,96,0) 100%)" }} />
          {story.map((item, index) => (
            <div key={item.id} className="ox-reveal relative sm:pl-16">
              {/* Titik diamond di garis */}
              <span className="absolute left-3 top-7 hidden h-3.5 w-3.5 rotate-45 sm:block" style={{ background: "#202020", border: "1.5px solid #F50260" }} />
              <div className="ox-card rounded-3xl p-6 md:p-8">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#F50260]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.date ? (
                    <span className="rounded-full px-3 py-1 text-xs font-bold text-white/80" style={{ background: "rgba(245,2,96,0.12)", border: "1px solid rgba(245,2,96,0.3)" }}>
                      {formatDate(item.date)}
                    </span>
                  ) : null}
                  {item.title ? (
                    <h4 className="font-[family-name:var(--font-serif-elegant)] text-lg font-bold text-white">
                      {item.title}
                    </h4>
                  ) : null}
                </div>
                {item.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/70">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. ACARA: kartu Akad + Resepsi + acara tambahan                     */
/* ------------------------------------------------------------------ */
function EventsSection({
  main,
  events,
}: {
  main: { date?: string; time?: string; venue?: string; mapUrl?: string };
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading script="Waktu &amp; Tempat" title="Rangkaian Acara Pernikahan" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <EventCard
            icon={<Heart className="h-8 w-8" />}
            title="Akad Nikah"
            date={main.date}
            time={main.time}
            venue={main.venue}
            mapUrl={main.mapUrl}
          />
          {events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? (
            <EventCard
              icon={<PartyPopper className="h-8 w-8" />}
              title={events[0].title ?? "Resepsi"}
              date={events[0].date}
              time={events[0].time}
              venue={events[0].location}
              mapUrl={events[0].locationMap}
            />
          ) : null}
        </div>

        {events.length > (events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? 1 : 0) ? (
          <div className="mx-auto mt-8 max-w-2xl space-y-5">
            {events
              .slice(events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? 1 : 0)
              .map((e) => (
                <div key={e.id} className="ox-reveal ox-card rounded-3xl p-6 text-left transition-transform duration-300 hover:-translate-y-1">
                  <span className="inline-block rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg, #F50260 0%, #c90050 100%)" }}>
                    {formatDate(e.date)}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-white">
                    {e.title ?? "Acara"}
                  </h3>
                  {e.time && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                      <Clock className="h-4 w-4 text-[#F50260]" /> {formatTime(e.time)}
                    </p>
                  )}
                  {e.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/70">
                      <MapPin className="h-4 w-4 text-[#F50260]" /> {e.location}
                    </p>
                  )}
                  {e.locationMap && (
                    <a
                      href={e.locationMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#F50260] hover:underline"
                    >
                      Lihat Lokasi <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EventCard({
  icon,
  title,
  date,
  time,
  venue,
  mapUrl,
}: {
  icon: React.ReactNode;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
}) {
  return (
    <div className="ox-reveal ox-card relative overflow-hidden rounded-[32px] p-8">
      <div className="mb-4 inline-block rounded-2xl p-3 text-[#F50260]" style={{ background: "rgba(245,2,96,0.12)", border: "1px solid rgba(245,2,96,0.3)" }}>
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-white">
        {title}
      </h3>
      {date ? <p className="mt-1 text-sm font-semibold text-[#F50260]">{formatDate(date)}</p> : null}

      <div className="my-6 space-y-3 text-sm text-white/80">
        {time && (
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#F50260]" />
            <span>{formatTime(time)}</span>
          </div>
        )}
        {venue && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-[#F50260]" />
            <span>{venue}</span>
          </div>
        )}
      </div>

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #F50260 0%, #c90050 100%)" }}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Petunjuk Lokasi Google Maps</span>
        </a>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. GALERI: grid + lightbox                                          */
/* ------------------------------------------------------------------ */
function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<{ url: string; caption?: string } | null>(null);

  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading script="Galeri Foto" title="Momen Indah Berdua" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {gallery.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected({ url: item.url, caption: item.caption })}
              className="ox-reveal ox-card group relative h-72 overflow-hidden rounded-3xl p-0 transition-transform duration-500 hover:-translate-y-1.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-end transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(to top, rgba(32,32,32,0.85) 0%, rgba(32,32,32,0) 45%)", opacity: 0 }}>
                <span className="p-5 text-left font-[family-name:var(--font-serif-elegant)] text-lg font-bold text-white">
                  {item.caption ?? ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,10,10,0.92)" }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Lihat foto"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption ?? "Foto galeri"}
              className="max-h-[85vh] max-w-full rounded-3xl border object-contain shadow-2xl"
              style={{ borderColor: "rgba(245,2,96,0.5)" }}
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup"
              className="absolute -top-12 right-0 rounded-full p-3 text-white transition-transform hover:scale-110"
              style={{ border: "1px solid rgba(245,2,96,0.6)" }}
            >
              <X className="h-6 w-6 text-[#F50260]" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. KADO DIGITAL                                                     */
/* ------------------------------------------------------------------ */
function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="relative px-4 py-20 text-center">
      <div className="ox-reveal ox-card mx-auto max-w-4xl rounded-[36px] p-8 text-left md:p-12">
        <div className="mb-4 text-center">
          <div className="mb-4 inline-block rounded-3xl p-4 text-[#F50260] ox-glow" style={{ background: "rgba(245,2,96,0.12)", border: "1px solid rgba(245,2,96,0.3)" }}>
            <Gift className="h-10 w-10" />
          </div>
          <h2 className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white md:text-4xl">
            Hadiah Digital Pernikahan
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-[family-name:var(--font-serif-elegant)] text-sm italic text-white/60">
            Doa restu Anda merupakan hadiah terindah bagi kami. Namun jika Anda
            ingin memberi tanda kasih, dapat mengirimkan melalui:
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {gifts.map((g) => (
            <div key={g.id} className="ox-card-solid relative rounded-3xl p-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F50260]">
                {g.provider}
              </span>
              <h4 className="my-1 font-mono text-2xl font-bold text-white">
                {g.accountNumber}
              </h4>
              {g.holderName ? (
                <p className="text-sm font-semibold text-white/70">a.n. {g.holderName}</p>
              ) : null}
              <div className="mt-4">
                <CopyButton text={g.accountNumber} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. RSVP                                                             */
/* ------------------------------------------------------------------ */
function RsvpSection({
  invitationId,
  guestName,
}: {
  invitationId: string;
  guestName?: string;
}) {
  return (
    <section className="relative px-4 py-20">
      <div className="ox-card ox-reveal mx-auto max-w-2xl rounded-[36px] p-8 md:p-12">
        <div className="mb-8 text-center">
          <span className="ox-shimmer text-4xl" style={{ fontFamily: "var(--font-script)" }}>
            Konfirmasi Kehadiran
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white">
            RSVP Undangan
          </h2>
        </div>
        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="text-white shadow-[0_0_20px_rgba(245,2,96,0.35)]"
          borderClass="border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#F50260] focus:ring-[#F50260]/20"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. WISHES                                                           */
/* ------------------------------------------------------------------ */
function Wishes({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section className="relative px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="ox-reveal mb-12 text-center">
          <span className="ox-shimmer text-4xl" style={{ fontFamily: "var(--font-script)" }}>
            Papan Ucapan
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white md:text-4xl">
            Doa &amp; Harapan Para Tamu
          </h2>
        </div>

        <div className="ox-reveal mb-12 grid max-h-[520px] grid-cols-1 gap-5 overflow-y-auto pr-2 md:grid-cols-2">
          <WishList
            wishes={wishes ?? []}
            cardClass="ox-card rounded-3xl"
            nameClass="text-white"
            avatarClass="bg-[#F50260]/20 text-[#F50260]"
            emptyClass="text-white/40"
          />
        </div>

        <div className="ox-card ox-reveal rounded-3xl p-6 md:p-8">
          <WishForm
            invitationId={invitationId}
            accentClass="text-white shadow-[0_0_20px_rgba(245,2,96,0.35)]"
            borderClass="border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#F50260] focus:ring-[#F50260]/20"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. PESAN PENUTUP                                                   */
/* ------------------------------------------------------------------ */
function MessageSection({ text }: { text: string }) {
  return (
    <section className="relative px-4 py-20 text-center">
      <div className="ox-card ox-reveal mx-auto max-w-lg rounded-[36px] p-8">
        <span className="ox-twinkle mx-auto mb-4 block h-2 w-2 rotate-45" style={{ background: "#F50260" }} />
        <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-white/85">
          {text}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. FOOTER                                                          */
/* ------------------------------------------------------------------ */
function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="relative px-4 py-12 text-center" style={{ borderTop: "1px solid rgba(245,2,96,0.25)" }}>
      <h3 className="ox-shimmer text-3xl font-bold" style={{ fontFamily: "var(--font-script)" }}>
        {groomName ?? "Pria"} &amp; {brideName ?? "Wanita"}
      </h3>
      <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-xs italic text-white/50">
        &ldquo;Sampai jumpa di hari bahagia pernikahan kami!&rdquo;
      </p>
      <p className="mt-6 text-[10px] uppercase tracking-widest text-white/30">
        © {new Date().getFullYear()} MEDUTA
      </p>
    </footer>
  );
}
