"use client";

import { useEffect, useState } from "react";
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
import PurpleGate from "./PurpleGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown, googleCalendarUrl } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Purple Blossom — adopsi 1:1 dari referensi "purple flower.svg"
 * (undangan plum gelap dengan bunga watercolor), data-driven ala Meduta:
 * - Latar plum #240016; buket rose putih sudut atas; monstera & lavender bawah.
 * - Cover: frame squircle krem #DAC8C0 (A2) + pill "The Wedding" + nama script.
 * - Mempelai: dua frame kubah + merpati emas di tengah (A3).
 * - Fitur Meduta lengkap: musik+FAB, countdown+GCal, kisah, acara+maps,
 *   galeri lightbox, kado copy, RSVP, ucapan, background kustom.
 *
 * ANIMASI DAUN/BUNGA "TERTIUP ANGIN" (permintaan user):
 * - pp-sway-left  : elemen sisi KIRI  → bergerak kanan→kiri.
 * - pp-sway-right : elemen sisi KANAN → bergerak kiri→kanan.
 * - Origin transform di batang/bawah agar goyangan natural.
 * Semua animasi CSS murni; tanpa backdrop-blur pada kartu teks.
 */

const PLUM = "#240016";
const CREAM = "#DAC8C0";
const GOLD = "#E8B54D";

/* ------------------------------------------------------------------ */
/* CSS khusus template (prefix pp- = purple blossom)                   */
/* ------------------------------------------------------------------ */
const PP_STYLES = `
  .pp-card {
    background: linear-gradient(165deg, #2e0a1e 0%, #26041a 55%, #200216 100%);
    border: 1px solid rgba(218,200,192,0.22);
    box-shadow: 0 18px 44px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04);
  }
  .pp-card-solid {
    background: linear-gradient(165deg, #2b081b 0%, #230417 100%);
    border: 1px solid rgba(218,200,192,0.18);
  }
  @keyframes ppShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .pp-shimmer {
    background-image: linear-gradient(110deg, #DAC8C0 25%, #ffffff 45%, #E8B54D 55%, #DAC8C0 75%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: ppShimmer 6s linear infinite;
  }
  @keyframes ppFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .pp-fade-up {
    opacity: 0;
    animation: ppFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .pp-reveal {
    opacity: 0;
    transform: translateY(26px);
    transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pp-reveal.pp-visible { opacity: 1; transform: translateY(0); }
  /* ANIMASI DAUN/BUNGA — arah sesuai sisi (lihat PurpleGate).
     Dengan "napas" translateY agar terasa melayang ditiup angin. */
  @keyframes ppSwayLeft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    30% { transform: rotate(-4.5deg) translate(-3px, -2px); }
    65% { transform: rotate(-1.5deg) translate(-1px, 0); }
  }
  @keyframes ppSwayRight {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    30% { transform: rotate(4.5deg) translate(3px, -2px); }
    65% { transform: rotate(1.5deg) translate(1px, 0); }
  }
  .pp-sway-left { transform-origin: 50% 92%; animation: ppSwayLeft 5.4s ease-in-out infinite; }
  .pp-sway-right { transform-origin: 50% 92%; animation: ppSwayRight 6.1s ease-in-out infinite; }
  /* Versi lembut untuk dekor kecil di section */
  @keyframes ppSwayLeftSoft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    50% { transform: rotate(-2.4deg) translate(-2px, -1px); }
  }
  @keyframes ppSwayRightSoft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    50% { transform: rotate(2.4deg) translate(2px, -1px); }
  }
  .pp-sway-left-soft { transform-origin: 50% 92%; animation: ppSwayLeftSoft 6.6s ease-in-out infinite; }
  .pp-sway-right-soft { transform-origin: 50% 92%; animation: ppSwayRightSoft 7.3s ease-in-out infinite; }
  /* Arch utuh (bila dipakai di section) — goyangan dari puncak */
  @keyframes ppArchSway {
    0%, 100% { transform: rotate(0deg); }
    30% { transform: rotate(-0.9deg); }
    65% { transform: rotate(0.5deg); }
  }
  .pp-arch-sway { transform-origin: 50% 6%; animation: ppArchSway 7.2s ease-in-out infinite; }
  @keyframes ppGlow {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(232,181,77,0.35)); }
    50% { filter: drop-shadow(0 0 12px rgba(232,181,77,0.65)); }
  }
  .pp-glow { animation: ppGlow 4s ease-in-out infinite; }
  @keyframes ppFloatY {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .pp-float { animation: ppFloatY 5.5s ease-in-out infinite; }
  .pp-pill-in {
    opacity: 0;
    animation:
      ppFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.7s forwards,
      ppFloatY 5.5s ease-in-out 2s infinite;
  }
  @keyframes ppDividerDraw {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  .pp-divider {
    background: linear-gradient(to right, rgba(232,181,77,0) 0%, ${GOLD} 50%, rgba(232,181,77,0) 100%);
    transform-origin: center;
    animation: ppDividerDraw 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes ppScrollBounce {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(8px); opacity: 0.55; }
  }
  .pp-scroll-hint { animation: ppScrollBounce 1.8s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .pp-pill-in { opacity: 1 !important; animation: none !important; }
  }
  @keyframes ppDoveFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-6px) rotate(-2deg); }
  }
  .pp-dove { animation: ppDoveFloat 4.6s ease-in-out infinite; }
  @keyframes ppTwinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(0.8); }
  }
  .pp-twinkle { animation: ppTwinkle 2.4s ease-in-out infinite; }
`;

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll                                                    */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".pp-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("pp-visible");
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
/* Dekor bawah: monstera + lavender mengapit (sway arah sesuai sisi)  */
/* ------------------------------------------------------------------ */
function BottomFlora({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden ${compact ? "h-48" : "h-60"}`}
    >
      {/* KIRI — bergerak kanan→kiri (diperbesar) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/purple-lavender.webp"
        alt=""
        className="pp-sway-left absolute bottom-0 left-[5%] w-[70px] sm:w-20"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/purple-monstera.webp"
        alt=""
        className="pp-sway-left absolute bottom-0 left-[14%] w-32 sm:w-40"
        style={{ animationDelay: "0.6s" }}
      />
      {/* KANAN — cermin SEMPURNA kiri: mirror via wrapper scaleX(-1)
          (bukan file flop & bukan scaleX di img — transform cermin
          harus terpisah dari elemen ber-animasi agar tidak saling
          menimpa). Img memakai pp-sway-left; dalam cermin geraknya
          otomatis jadi kebalikan kiri → komposisi seimbang. */}
      <span
        aria-hidden
        className="absolute bottom-0 right-[14%] block w-32 sm:w-40"
        style={{ transform: "scaleX(-1)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/purple-monstera.webp"
          alt=""
          className="pp-sway-left w-full"
          style={{ animationDelay: "0.6s" }}
        />
      </span>
      <span
        aria-hidden
        className="absolute bottom-0 right-[5%] block w-[70px] sm:w-20"
        style={{ transform: "scaleX(-1)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/purple-lavender.webp" alt="" className="pp-sway-left w-full" />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buket rose sudut atas (sway arah sesuai sisi)                       */
/* ------------------------------------------------------------------ */
function TopBouquets() {
  return (
    <>
      {/* KIRI: file asli — KANAN: file flop (bukan CSS mirror, bebas
          konflik dengan animasi sway). Disetaraikan dengan monstera
          BottomFlora (w-32/w-40) agar massa flora atas-bawah seimbang. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/purple-bouquet.webp"
        alt=""
        aria-hidden
        className="pp-sway-left-soft pointer-events-none absolute left-0 top-0 z-20 w-32 sm:w-40"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/purple-bouquet-right.webp"
        alt=""
        aria-hidden
        className="pp-sway-right-soft pointer-events-none absolute right-0 top-0 z-20 w-32 sm:w-40"
        style={{ animationDelay: "0.9s" }}
      />
    </>
  );
}

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function PurpleTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl, props.data.musicStart, props.data.musicEnd);
  return (
    <PurpleShell
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

function PurpleShell({
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

  // Prioritas background: pilihan user > admin (template) > bawaan plum
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    groomPhotoUrl: data?.groom?.photoUrl,
    bridePhotoUrl: data?.bride?.photoUrl,
    firstGalleryUrl: data?.gallery?.[0]?.url,
  });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans text-white"
      style={bgUrl ? undefined : { background: PLUM }}
    >
      <style>{PP_STYLES}</style>

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
            style={{ background: "rgba(24,0,14,0.72)" }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(232,181,77,0.07) 0%, rgba(36,0,22,0) 55%)",
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
        gatePhoto={gatePhoto}
        locked={!gateOpen}
        onOpen={onGateOpen}
      />

      {groom?.name || bride?.name ? <Couple groom={groom} bride={bride} /> : null}

      <CountdownSection eventDate={agenda.main.date} eventName={data.eventName} />

      {story.length > 0 ? <StorySection story={story} /> : null}

      <EventsSection main={agenda.main} events={events} />

      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      <RsvpSection invitationId={invitationId} guestName={guestName} />

      <Wishes invitationId={invitationId} wishes={wishes} />

      {data.customMessage ? <MessageSection text={data.customMessage} /> : null}

      <Footer groomName={groom?.name} brideName={bride?.name} />

      {data.musicUrl && music ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            positionClassName="relative z-50"
            buttonClassName="border border-[#DAC8C0]/50 bg-[#2b081b] text-white shadow-[0_0_18px_rgba(232,181,77,0.35)]"
            playingIconClassName="h-5 w-5 text-[#E8B54D]"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            style={{ background: "#2b081b", border: "1px solid rgba(218,200,192,0.4)" }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-110"
          >
            <ArrowUp className="h-5 w-5 text-[#E8B54D]" />
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
      style={{ background: PLUM }}
    >
      <Heart className="h-8 w-8 text-[#E8B54D]" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-white/60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heading section: script krem ber-shimmer + garis emas               */
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
    <div className="pp-reveal mb-14 text-center">
      <span className="pp-shimmer text-4xl" style={{ fontFamily: "var(--font-script)" }}>
        {script}
      </span>
      <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white sm:text-4xl">
        {title}
      </h2>
      <span className="pp-divider mx-auto mt-4 block h-px w-24" />
      {desc ? (
        <p className="mx-auto mt-3 max-w-md font-[family-name:var(--font-serif-elegant)] text-sm italic text-white/60">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. COVER: frame squircle krem (A2) + pill The Wedding + nama script */
/* ------------------------------------------------------------------ */
function Cover({
  eventName,
  groomNick,
  brideNick,
  eventDate,
  venue,
  guestName,
  gatePhoto,
  locked = false,
  onOpen,
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  venue?: string;
  guestName?: string;
  gatePhoto?: string;
  locked?: boolean;
  onOpen?: () => void;
}) {
  const names = `${groomNick ?? "Pria"} dan ${brideNick ?? "Wanita"}`;

  const cover = (
    <header className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-16 text-center">
      <TopBouquets />
      <BottomFlora />

      <div className="relative z-10 flex w-full flex-col items-center px-2">
        <h1 className="sr-only">
          Undangan Pernikahan {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
        </h1>

        {/* Frame squircle krem dengan foto (A2) */}
        <div className="pp-fade-up mt-2 w-[68%] max-w-[330px]" style={{ animationDelay: "0.3s" }}>
          <div
            className="overflow-hidden shadow-2xl"
            style={{
              borderRadius: "38% 38% 38% 38% / 30% 30% 30% 30%",
              border: "3px solid rgba(232,181,77,0.4)",
            }}
          >
            {gatePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gatePhoto}
                alt={names}
                className="aspect-[4/5] w-full object-cover object-top"
              />
            ) : (
              <div
                className="flex aspect-[4/5] w-full items-center justify-center"
                style={{ background: CREAM }}
              >
                <Heart className="h-14 w-14 text-[#8a5568]" />
              </div>
            )}
          </div>
        </div>

        {/* Pill "The Wedding" — SATU deklarasi animation (fade-up + float) */}
        <div
          className="pp-pill-in mt-7 inline-block rounded-full px-6 py-1.5"
          style={{ background: "#12000b", border: "1px solid rgba(232,181,77,0.45)" }}
        >
          <span className="text-sm italic text-[#E8B54D]" style={{ fontFamily: "var(--font-script)" }}>
            The Wedding
          </span>
        </div>

        {/* Nama pasangan script */}
        <p
          className="pp-fade-up mt-3 text-4xl text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-script)", animationDelay: "0.85s" }}
        >
          {names}
        </p>

        {/* Pill tanggal */}
        {eventDate ? (
          <div
            className="pp-fade-up mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white/90"
            style={{ background: "rgba(218,200,192,0.1)", border: "1px solid rgba(218,200,192,0.3)", animationDelay: "1s" }}
          >
            <CalendarDays className="h-4 w-4 text-[#E8B54D]" />
            <span>{formatDate(eventDate)}</span>
          </div>
        ) : null}

        {/* Indikator gulir */}
        <div className="pp-fade-up mt-9 flex flex-col items-center" style={{ animationDelay: "1.15s" }}>
          <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">
            Gulir Ke Bawah
          </span>
          <span
            className="pp-scroll-hint flex h-10 w-10 items-center justify-center rounded-full text-[#E8B54D]"
            style={{ border: "1px solid rgba(232,181,77,0.5)" }}
          >
            <ChevronDown className="h-6 w-6" />
          </span>
        </div>
      </div>
    </header>
  );

  if (locked) {
    return (
      <PurpleGate
        groomNick={groomNick}
        brideNick={brideNick}
        guestName={guestName}
        onOpen={onOpen}
      />
    );
  }

  return cover;
}

/* ------------------------------------------------------------------ */
/* 2. COUNTDOWN                                                        */
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
  const calUrl = googleCalendarUrl({ title: eventName ?? "Pernikahan", date: eventDate });
  return (
    <section className="relative px-4 py-16 text-center">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          script="Save The Date"
          title="Hitung Mundur Hari Bahagia"
          desc="Menghitung detik menuju pengikatan janji suci"
        />

        <div className="pp-reveal mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="pp-card group relative overflow-hidden rounded-3xl p-6 text-center transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: `linear-gradient(to right, rgba(232,181,77,0), ${GOLD}, rgba(232,181,77,0))` }} />
              <span className="block font-[family-name:var(--font-serif-elegant)] text-4xl font-bold tabular-nums text-white transition-colors group-hover:text-[#E8B54D] md:text-5xl">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-xs font-semibold uppercase tracking-widest text-white/50">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {eventDate ? (
          <div className="pp-reveal mt-10">
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-[#3a2224] shadow-lg transition-transform duration-300 hover:scale-105"
              style={{ background: CREAM }}
            >
              <CalendarDays className="h-5 w-5" />
              <span>Simpan Tanggal ke Google Calendar</span>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. MEMPELAI: dua frame kubah + merpati emas (A3)                    */
/* ------------------------------------------------------------------ */
function Couple({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section className="relative px-4 py-20">
      <TopBouquets />
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          script="Pasangan Mempelai"
          title="Mempelai Pria & Wanita"
          desc="Dengan memohon rahmat dan ridho Allah SWT, kami menyatukan dua insan"
        />

        <div className="pp-reveal relative mx-auto flex max-w-lg items-start justify-center">
          {/* A3: kiri = wanita (Reni), kanan = pria (Andi) */}
          <PersonCard person={bride} role="Mempelai Wanita" side="left" />

          {/* Merpati emas di tengah antara dua frame (A3) */}
          <div className="pp-dove absolute left-1/2 top-[38%] z-20 -translate-x-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design/purple-doves.webp" alt="" aria-hidden className="w-16 sm:w-20" />
          </div>

          <PersonCard person={groom} role="Mempelai Pria" side="right" />
        </div>
      </div>
    </section>
  );
}

function DomeFrame({
  photo,
  alt,
  side,
}: {
  photo?: string;
  alt: string;
  side: "left" | "right";
}) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
      {/* Backing krem offset — arah offset menjauh dari merpati tengah */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: CREAM,
          borderRadius: "999px 999px 12px 12px",
          transform: side === "left" ? "translate(-6%, 4%)" : "translate(6%, 4%)",
        }}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: "999px 999px 12px 12px", background: "#3a2230" }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={alt}
            className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Heart className="h-10 w-10 text-[#8a5568]" />
          </div>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  role,
  side,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  side: "left" | "right";
}) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="w-full max-w-[190px]">
        <DomeFrame photo={person?.photoUrl} alt={person?.name ?? role} side={side} />
      </div>

      <h3
        className="mt-4 text-3xl text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {person?.name ?? "-"}
      </h3>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#E8B54D]">
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
            style={{ background: "rgba(218,200,192,0.12)", border: "1px solid rgba(218,200,192,0.4)" }}
          >
            <AtSign className="h-4 w-4 text-[#E8B54D]" />
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
          <span
            className="absolute bottom-4 left-[19px] top-2 hidden w-px sm:block"
            style={{ background: `linear-gradient(to bottom, rgba(232,181,77,0) 0%, rgba(232,181,77,0.5) 12%, rgba(232,181,77,0.5) 88%, rgba(232,181,77,0) 100%)` }}
          />
          {story.map((item, index) => (
            <div key={item.id} className="pp-reveal relative sm:pl-16">
              <span
                className="absolute left-3 top-7 hidden h-3.5 w-3.5 rotate-45 sm:block"
                style={{ background: PLUM, border: `1.5px solid ${GOLD}` }}
              />
              <div className="pp-card rounded-3xl p-6 md:p-8">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#E8B54D]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.date ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-white/80"
                      style={{ background: "rgba(232,181,77,0.12)", border: "1px solid rgba(232,181,77,0.3)" }}
                    >
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
/* 5. ACARA                                                            */
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
                <div key={e.id} className="pp-reveal pp-card rounded-3xl p-6 text-left transition-transform duration-300 hover:-translate-y-1">
                  <span
                    className="inline-block rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#3a2224]"
                    style={{ background: CREAM }}
                  >
                    {formatDate(e.date)}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-white">
                    {e.title ?? "Acara"}
                  </h3>
                  {e.time && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                      <Clock className="h-4 w-4 text-[#E8B54D]" /> {formatTime(e.time)}
                    </p>
                  )}
                  {e.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/70">
                      <MapPin className="h-4 w-4 text-[#E8B54D]" /> {e.location}
                    </p>
                  )}
                  {e.locationMap && (
                    <a
                      href={e.locationMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#E8B54D] hover:underline"
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
    <div className="pp-reveal pp-card relative overflow-hidden rounded-[32px] p-8">
      <div
        className="pp-glow mb-4 inline-block rounded-2xl p-3 text-[#E8B54D]"
        style={{ background: "rgba(232,181,77,0.12)", border: "1px solid rgba(232,181,77,0.3)" }}
      >
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-white">
        {title}
      </h3>
      {date ? <p className="mt-1 text-sm font-semibold text-[#E8B54D]">{formatDate(date)}</p> : null}

      <div className="my-6 space-y-3 text-sm text-white/80">
        {time && (
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#E8B54D]" />
            <span>{formatTime(time)}</span>
          </div>
        )}
        {venue && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-[#E8B54D]" />
            <span>{venue}</span>
          </div>
        )}
      </div>

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#3a2224] shadow-md transition-transform hover:scale-[1.02]"
          style={{ background: CREAM }}
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
              className="pp-reveal pp-card group relative h-72 overflow-hidden rounded-3xl p-0 transition-transform duration-500 hover:-translate-y-1.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className="absolute inset-0 flex items-end transition-opacity group-hover:opacity-100"
                style={{ background: "linear-gradient(to top, rgba(24,0,14,0.85) 0%, rgba(24,0,14,0) 45%)", opacity: 0 }}
              >
                <span className="p-5 text-left font-[family-name:var(--font-serif-elegant)] text-lg font-bold text-white">
                  {item.caption ?? ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(12,0,7,0.92)" }}
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
              style={{ borderColor: "rgba(232,181,77,0.5)" }}
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup"
              className="absolute -top-12 right-0 rounded-full p-3 text-white transition-transform hover:scale-110"
              style={{ border: "1px solid rgba(232,181,77,0.6)" }}
            >
              <X className="h-6 w-6 text-[#E8B54D]" />
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
      <div className="pp-reveal pp-card mx-auto max-w-4xl rounded-[36px] p-8 text-left md:p-12">
        <div className="mb-4 text-center">
          <div
            className="pp-glow mb-4 inline-block rounded-3xl p-4 text-[#E8B54D]"
            style={{ background: "rgba(232,181,77,0.12)", border: "1px solid rgba(232,181,77,0.3)" }}
          >
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
            <div key={g.id} className="pp-card-solid relative rounded-3xl p-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8B54D]">
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
      <div className="pp-card pp-reveal mx-auto max-w-2xl rounded-[36px] p-8 md:p-12">
        <div className="mb-8 text-center">
          <span className="pp-shimmer text-4xl" style={{ fontFamily: "var(--font-script)" }}>
            Konfirmasi Kehadiran
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white">
            RSVP Undangan
          </h2>
        </div>
        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="text-white shadow-[0_0_20px_rgba(232,181,77,0.35)]"
          borderClass="border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#E8B54D] focus:ring-[#E8B54D]/20"
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
        <div className="pp-reveal mb-12 text-center">
          <span className="pp-shimmer text-4xl" style={{ fontFamily: "var(--font-script)" }}>
            Papan Ucapan
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-white md:text-4xl">
            Doa &amp; Harapan Para Tamu
          </h2>
        </div>

        <div className="pp-reveal mb-12 grid max-h-[520px] grid-cols-1 gap-5 overflow-y-auto pr-2 md:grid-cols-2">
          <WishList
            wishes={wishes ?? []}
            cardClass="pp-card rounded-3xl"
            nameClass="text-white"
            avatarClass="bg-[#E8B54D]/20 text-[#E8B54D]"
            emptyClass="text-white/40"
          />
        </div>

        <div className="pp-card pp-reveal rounded-3xl p-6 md:p-8">
          <WishForm
            invitationId={invitationId}
            accentClass="text-white shadow-[0_0_20px_rgba(232,181,77,0.35)]"
            borderClass="border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#E8B54D] focus:ring-[#E8B54D]/20"
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
      <div className="pp-card pp-reveal mx-auto max-w-lg rounded-[36px] p-8">
        <span className="pp-twinkle mx-auto mb-4 block h-2 w-2 rotate-45" style={{ background: GOLD }} />
        <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-white/85">
          {text}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. FOOTER — dengan flora sway mengapit                             */
/* ------------------------------------------------------------------ */
function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer
      className="relative overflow-hidden px-4 pb-28 pt-12 text-center"
      style={{ borderTop: "1px solid rgba(218,200,192,0.2)" }}
    >
      <BottomFlora compact />
      <h3 className="pp-shimmer relative z-10 text-3xl font-bold" style={{ fontFamily: "var(--font-script)" }}>
        {groomName ?? "Pria"} &amp; {brideName ?? "Wanita"}
      </h3>
      <p className="relative z-10 mt-1 font-[family-name:var(--font-serif-elegant)] text-xs italic text-white/50">
        &ldquo;Sampai jumpa di hari bahagia pernikahan kami!&rdquo;
      </p>
      <p className="relative z-10 mt-6 text-[10px] uppercase tracking-widest text-white/30">
        © {new Date().getFullYear()} MEDUTA
      </p>
    </footer>
  );
}
