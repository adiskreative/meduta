"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Heart,
  ExternalLink,
  AtSign,
  ChevronDown,
  ArrowUp,
  X,
  Sparkles,
  Quote,
} from "lucide-react";
import RomanGate from "./RomanGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown, googleCalendarUrl } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Roman Romance (Villa Romana) — Tata Letak Bunga Klasik Romawi yang Presisi:
 * - Cover: Garland Peony horizontal membingkai mahkota atas; Aset Gerbang Romawi (gerbang) menjadi
 *   centerpiece, dengan potret mempelai tampil melalui lubang lengkungan gerbang.
 * - Mempelai: Diapit Pilar Romawi (column) berkepala vas bunga; foto dibingkai lengkungan Sage Arch (arch-green)
 *   dengan bunga mawar di sudut atas & bawah.
 * - Countdown: Dihiasi buket pampas & anggrek putih (pampas) yang anggun.
 * - Kutipan: Bermahkotakan plakat marmer Romawi berukir (cartouche).
 * - Acara: Lorong pelaminan karpet mawar (aisle) & Tenda resepsi pohon zaitun (reception).
 * - Kisah Cinta: Dipimpin kereta kencana kuda putih kerajaan (carriage).
 * - Kado: Amplop vintage mekar bunga dengan segel hati emas (envelope-heart).
 * - Penutup: Mobil pengantin vintage berbunga (getaway-car) & border bunga (floral-border) di dasar footer.
 */

const TRAVERTINE = "#FAF6F0";
/** Aset gerbang utama di halaman Cover (hasil konversi dari gerbang.png). */
const ROMAN_GATE_ART = "/design/roman/gerbang.webp";
const GOLD = "#C59B27";
const WINE = "#7A2021";

/* ------------------------------------------------------------------ */
/* CSS Khusus Template Roman                                          */
/* ------------------------------------------------------------------ */
const ROMAN_STYLES = `
  .rm-card {
    background: linear-gradient(165deg, #FFFFFF 0%, #FAF6F0 100%);
    border: 1px solid rgba(197, 155, 39, 0.28);
    box-shadow: 0 10px 32px rgba(74, 30, 20, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.85);
  }
  @keyframes rmFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .rm-fade-up {
    opacity: 0;
    animation: rmFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .rm-reveal {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .rm-reveal.rm-visible {
    opacity: 1;
    transform: translateY(0);
  }
  @keyframes rmSwayLeft {
    0%, 100% { transform: rotate(0deg) translate(0, 0); }
    35% { transform: rotate(-3deg) translate(-2px, -1px); }
    70% { transform: rotate(-1deg) translate(-1px, 0); }
  }
  .rm-sway-left {
    transform-origin: 50% 10%;
    animation: rmSwayLeft 5.8s ease-in-out infinite;
  }
  @keyframes rmBounceY {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(6px); opacity: 0.6; }
  }
  .rm-bounce-y {
    animation: rmBounceY 1.8s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .rm-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    .rm-fade-up, .rm-sway-left, .rm-bounce-y { animation: none !important; }
  }
`;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".rm-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("rm-visible");
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

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function RomanTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);

  return (
    <RomanShell
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

function RomanShell({
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

  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  const resolvedGatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: data?.groom?.photoUrl,
    bridePhotoUrl: data?.bride?.photoUrl,
    firstGalleryUrl: data?.gallery?.[0]?.url,
  });
  // `palace.webp` adalah aset latar bawaan lama, dan `gerbang.webp` adalah aset
  // gerbang itu sendiri — keduanya bukan foto mempelai. Hanya foto asli yang
  // ditampilkan melalui lubang gerbang.
  const gatePhoto =
    resolvedGatePhoto === "/design/roman/palace.webp" ||
    resolvedGatePhoto === ROMAN_GATE_ART
      ? undefined
      : resolvedGatePhoto;
  // Background halaman penuh: utamakan background kustom, lalu foto mempelai,
  // lalu aset istana agar gerbang tetap punya latar yang menyatu.
  const pageBg = bgUrl || gatePhoto || "/design/roman/palace.webp";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans text-[#2A1B18]"
      style={pageBg ? undefined : { background: TRAVERTINE }}
    >
      <style>{ROMAN_STYLES}</style>

      {/* Latar Kustom / Foto Gerbang sebagai background penuh satu halaman */}
      {pageBg ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pageBg}
            alt=""
            className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(250,246,240,0.70) 0%, rgba(250,246,240,0.50) 35%, rgba(250,246,240,0.68) 100%)",
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(197, 155, 39, 0.08) 0%, rgba(250, 246, 240, 1) 75%)",
          }}
        />
      )}

      {/* Gerbang Buka Undangan */}
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

      {/* Pasangan Mempelai dengan Pilar Romawi & Bingkai Arch Bunga */}
      {groom?.name || bride?.name ? <CoupleSection groom={groom} bride={bride} /> : null}

      {/* Hitung Mundur & Kalender */}
      <CountdownSection eventDate={agenda.main.date} eventName={data.eventName} />

      {/* Kutipan Suci / Peribahasa Cinta dengan Plakat Cartouche */}
      {!data.quoteHidden ? (
        <QuoteSection
          title={data.quoteTitle}
          text={data.quoteText}
          source={data.quoteSource}
        />
      ) : null}

      {/* Rangkaian Acara: Akad (Lorong Bunga) & Resepsi (Tenda Zaitun) */}
      <EventsSection main={agenda.main} events={events} />

      {/* Kisah Cinta dengan Kereta Kencana Kuda Putih */}
      {story.length > 0 ? <StorySection story={story} /> : null}

      {/* Galeri Foto Romawi */}
      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {/* Tanda Kasih / Amplop Digital Mekar Bunga */}
      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      {/* RSVP Konfirmasi Kehadiran */}
      <RsvpSection invitationId={invitationId} guestName={guestName} />

      {/* Papan Doa & Harapan Tamu */}
      <WishesSection invitationId={invitationId} wishes={wishes} />

      {/* Pesan Penutup & Sunset Getaway Car */}
      <ClosingSection text={data.customMessage} />

      {/* Footer dengan Border Bunga */}
      <Footer groomName={groom?.name} brideName={bride?.name} />

      {/* Tombol Musik Melayang & Scroll Up */}
      {data.musicUrl && music ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            positionClassName="relative z-50"
            buttonClassName="border-2 border-[#C59B27] bg-[#7A2021] text-white shadow-[0_0_18px_rgba(197,155,39,0.35)]"
            playingIconClassName="h-5 w-5 text-[#E5C365]"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#C59B27] bg-[#7A2021] text-white shadow-lg transition-transform duration-300 hover:scale-110"
          >
            <ArrowUp className="h-5 w-5 text-[#E5C365]" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-[#2A1B18]"
      style={{ background: TRAVERTINE }}
    >
      <Heart className="h-8 w-8 text-[#7A2021]" />
      <p className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold">
        Undangan Belum Dipublikasikan
      </p>
      <p className="text-sm text-[#6B554D]">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan hubungi kedua mempelai.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heading Section Romawi                                             */
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
    <div className="rm-reveal mb-12 text-center">
      <span className="font-[family-name:var(--font-script)] text-3xl text-[#7A2021] sm:text-4xl">
        {script}
      </span>
      <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-widest text-[#2A1B18] sm:text-3xl md:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C59B27]" />
        <span className="text-xs text-[#C59B27]">&#10022;</span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C59B27]" />
      </div>
      {desc ? (
        <p className="mx-auto mt-2 max-w-lg font-[family-name:var(--font-serif-elegant)] text-sm italic text-[#6B554D]">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. COVER / HERO: Garland Peony + Arch Bunga + Istana Romawi        */
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
  const names = `${groomNick ?? "Groom"} & ${brideNick ?? "Bride"}`;

  const cover = (
    <header className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-between overflow-hidden px-4 pb-16 pt-6 text-center">
      {/* Cahaya lembut di tengah agar teks tetap terbaca di atas foto background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 45%, rgba(250,246,240,0.55) 0%, rgba(250,246,240,0.25) 55%, rgba(250,246,240,0) 78%)",
        }}
      />

      {/* Mahkota Bunga Garland Peony di Puncak Atas */}
      <div
        aria-hidden
        className="pointer-events-none relative z-20 flex w-full justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/garland-peony.webp"
          alt=""
          className="rm-sway-left w-100 max-w-[75vw] object-contain drop-shadow-sm sm:w-70"
        />
      </div>

      {/* Bunga Sudut Kiri Atas */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-4 z-10 block w-70 opacity-95 sm:-left-4 sm:-top-2 sm:w-72"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-flower.webp"
          alt=""
          className="rm-sway-left block w-full drop-shadow-sm"
          style={{ transformOrigin: "0% 0%" }}
        />
      </span>

      {/* Bunga Sudut Kanan Atas (mirror) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-4 z-10 block w-70 opacity-95 sm:-right-4 sm:-top-2 sm:w-72"
        style={{ transform: "scaleX(-1)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/corner-flower.webp"
          alt=""
          className="rm-sway-left block w-full drop-shadow-sm"
          style={{ animationDelay: "0.8s", transformOrigin: "0% 0%" }}
        />
      </span>

      <div className="relative z-10 my-auto flex w-full max-w-2xl flex-col items-center px-2 py-4">
        {/* Badge Villa Romana */}
        <div
          className="rm-fade-up inline-flex items-center gap-2 rounded-full border border-[#C59B27]/40 bg-white/85 px-4 py-1 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "0.2s" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#C59B27]" />
          <span className="font-[family-name:var(--font-serif-elegant)] text-xs font-semibold uppercase tracking-[0.25em] text-[#7A2021]">
            The Wedding Celebration
          </span>
          <Sparkles className="h-3.5 w-3.5 text-[#C59B27]" />
        </div>

        {/* Nama Pasangan Mempelai */}
        <h1
          className="rm-fade-up mt-3 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold uppercase tracking-wider text-[#2A1B18] sm:text-5xl"
          style={{ animationDelay: "0.35s" }}
        >
          {groomNick ?? "Pria"} <span className="font-normal text-[#C59B27]">&amp;</span> {brideNick ?? "Wanita"}
        </h1>

        <p
          className="rm-fade-up mt-1 font-[family-name:var(--font-script)] text-2xl text-[#7A2021] sm:text-3xl"
          style={{ animationDelay: "0.45s" }}
        >
          A Lifetime of Love Begins Here
        </p>

        {/* Centerpiece: Bingkai Gerbang Romawi */}
        <div className="rm-fade-up relative my-6 w-full max-w-sm" style={{ animationDelay: "0.6s" }}>
          {gatePhoto ? (
            /* Bila ada foto mempelai: Tampilkan foto di dalam lubang gerbang */
            <div
              className="relative mx-auto w-72 sm:w-80"
              style={{ aspectRatio: "1 / 1" }}
            >
              {/* Foto dipotong mengikuti bentuk lubang gerbang (lengkung di atas) */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: "28.2%",
                  right: "26.85%",
                  top: "32.5%",
                  bottom: "0%",
                  borderTopLeftRadius: "50% 33.33%",
                  borderTopRightRadius: "50% 33.33%",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gatePhoto}
                  alt={names}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              {/* Bingkai Gerbang di depan foto */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ROMAN_GATE_ART}
                alt=""
                aria-hidden
                className="relative h-full w-full object-contain drop-shadow-lg"
              />
            </div>
          ) : (
            /* Bila belum ada foto: Tampilkan aset gerbang Romawi */
            <div className="relative mx-auto flex items-center justify-center w-72 sm:w-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ROMAN_GATE_ART}
                alt="Gerbang Romawi"
                className="w-full object-contain drop-shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Tanggal & Tempat Acara */}
        <div
          className="rm-fade-up flex flex-wrap items-center justify-center gap-2.5"
          style={{ animationDelay: "0.75s" }}
        >
          {eventDate ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C59B27]/40 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#2A1B18] shadow-sm">
              <CalendarDays className="h-4 w-4 text-[#7A2021]" />
              <span>{formatDate(eventDate)}</span>
            </div>
          ) : null}

          {venue ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C59B27]/40 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#2A1B18] shadow-sm">
              <MapPin className="h-4 w-4 text-[#7A2021]" />
              <span className="max-w-[200px] truncate sm:max-w-none">{venue}</span>
            </div>
          ) : null}
        </div>

        {/* Indikator Gulir */}
        <div className="rm-fade-up mt-8 flex flex-col items-center" style={{ animationDelay: "0.9s" }}>
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#6B554D]">
            Gulir Ke Bawah
          </span>
          <span className="rm-bounce-y mt-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#C59B27] bg-white text-[#7A2021] shadow-sm">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>
    </header>
  );

  if (locked) {
    return (
      <RomanGate
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
/* 2. PASANGAN MEMPELAI: Bingkai Arch Bunga (arch-green) + Pilar     */
/* ------------------------------------------------------------------ */
function CoupleSection({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          script="Dua Jiwa Bersatu"
          title="Pasangan Mempelai"
          desc="Dengan memohon rahmat dan ridho Tuhan Yang Maha Esa, kami mempersembahkan kedua mempelai yang mengikat janji suci"
        />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 md:flex-row md:items-start md:gap-10">
          {/* Pilar Romawi Kiri (Desktop) */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-10 hidden w-24 lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design/roman/column.webp" alt="" className="w-full drop-shadow-md" />
          </div>

          {/* Kartu Mempelai Wanita */}
          <PersonCard person={bride} role="Mempelai Wanita" />

          {/* Monogram Tengah */}
          <div className="rm-reveal flex flex-col items-center gap-1">
            <span className="mt-1 font-[family-name:var(--font-script)] text-2xl text-[#C59B27]">
              &amp;
            </span>
          </div>

          {/* Kartu Mempelai Pria */}
          <PersonCard person={groom} role="Mempelai Pria" />

          {/* Pilar Romawi Kanan (Desktop) */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-10 hidden w-24 lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design/roman/column.webp" alt="" className="w-full drop-shadow-md" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
}) {
  return (
    <div className="rm-reveal rm-card relative flex flex-1 flex-col items-center rounded-3xl p-6 text-center transition-transform duration-300 hover:-translate-y-1 sm:p-8">
      {/* Bingkai Foto Arch Bunga (arch-green) dengan mawar di sudut */}
      <div className="relative mx-auto mb-5 w-44 sm:w-48" style={{ aspectRatio: "702 / 1000" }}>
        <div className="absolute inset-x-2 bottom-2 top-2 overflow-hidden rounded-t-[5rem] bg-[#EFE9DF]">
          {person?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={person.name ?? role}
              className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#7A2021]">
              <Heart className="h-10 w-10" />
            </div>
          )}
        </div>
        {/* Frame Bunga Arch di depan foto (tengahnya transparan agar foto jernih) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/arch-green-clear.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-md"
        />
      </div>

      <span className="rounded-full bg-[#7A2021]/10 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A2021]">
        {role}
      </span>

      <h3 className="mt-2.5 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wider text-[#2A1B18] sm:text-3xl">
        {person?.name ?? "-"}
      </h3>

      {person?.nickname && (
        <p className="font-[family-name:var(--font-script)] text-2xl text-[#C59B27]">
          &ldquo;{person.nickname}&rdquo;
        </p>
      )}

      {person?.parentName && (
        <p className="mt-3 text-xs leading-relaxed text-[#6B554D]">
          {person.childOf ?? "Putra / Putri dari"} <br />
          <span className="font-bold text-[#2A1B18]">{person.parentName}</span>
        </p>
      )}

      {person?.bio && (
        <p className="mt-2.5 max-w-xs text-xs italic leading-relaxed text-[#6B554D]">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}

      {person?.instagram && (
        <div className="mt-5">
          <a
            href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C59B27]/40 bg-white px-3.5 py-1 text-xs font-semibold text-[#7A2021] shadow-sm transition hover:scale-105 hover:bg-[#7A2021] hover:text-white"
          >
            <AtSign className="h-3.5 w-3.5" />
            <span>{person.instagram}</span>
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. HITUNG MUNDUR (Save The Date) Diberkahi Buket Pampas            */
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
    <section className="relative px-4 py-20 text-center">
      <div className="mx-auto max-w-4xl">
        {/* Buket Pampas & Anggrek di Atas Countdown */}
        <div className="rm-reveal mx-auto mb-4 w-28 sm:w-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/roman/pampas.webp"
            alt=""
            aria-hidden
            className="w-full object-contain drop-shadow-sm"
          />
        </div>

        <SectionHeading
          script="Save The Date"
          title="Menghitung Hari Bahagia"
          desc="Setiap detik mendekatkan kami menuju ikatan suci yang abadi"
        />

        <div className="rm-reveal mx-auto grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="rm-card group relative overflow-hidden rounded-3xl p-6 text-center transition-transform duration-300 hover:-translate-y-1.5"
            >
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent" />
              <span className="block font-[family-name:var(--font-serif-elegant)] text-4xl font-bold tabular-nums text-[#7A2021] transition-colors group-hover:text-[#C59B27] sm:text-5xl">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-[11px] font-bold uppercase tracking-widest text-[#6B554D]">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {eventDate ? (
          <div className="rm-reveal mt-10">
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#C59B27] bg-[#7A2021] px-7 py-3 font-[family-name:var(--font-serif-elegant)] text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <CalendarDays className="h-4 w-4 text-[#E5C365]" />
              <span>Simpan Tanggal ke Google Calendar</span>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. KUTIPAN SUCI DENGAN PLAKAT CARTOUCHE ROMAWI                     */
/* ------------------------------------------------------------------ */
function QuoteSection({
  title,
  text,
  source,
}: {
  title?: string;
  text?: string;
  source?: string;
}) {
  const quoteText =
    text ??
    "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.";
  const quoteSource = source ?? "QS. Ar-Rum: 21";

  return (
    <section className="relative px-4 py-16 text-center">
      <div className="rm-reveal rm-card relative mx-auto max-w-2xl overflow-hidden rounded-[36px] p-8 md:p-12">
        {/* Plakat Cartouche Romawi sebagai Lambang Indah */}
        <div className="mx-auto mb-4 w-16 sm:w-20">
        </div>

        {title && (
          <h3 className="mb-2 font-[family-name:var(--font-serif-elegant)] text-base font-bold uppercase tracking-widest text-[#7A2021]">
            {title}
          </h3>
        )}

        <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-[#2A1B18] sm:text-xl">
          &ldquo;{quoteText}&rdquo;
        </p>

        <p className="mt-4 font-[family-name:var(--font-serif-elegant)] text-xs font-bold uppercase tracking-widest text-[#C59B27]">
          {quoteSource}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. RANGKAIAN ACARA: Akad (Lorong Bunga) & Resepsi (Tenda Zaitun)  */
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
        <SectionHeading
          script="Rangkaian Acara"
          title="Waktu & Tempat Pelaksanaan"
          desc="Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir"
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Card 1: Akad Nikah (Lorong Pelaminan Karpet Mawar) */}
          <EventCard
            artworkUrl="/design/roman/aisle.webp"
            title="Akad Nikah"
            date={main.date}
            time={main.time}
            venue={main.venue}
            mapUrl={main.mapUrl}
            badgeColor="#7A2021"
          />

          {/* Card 2: Resepsi Pernikahan (Tenda Zaitun) */}
          <EventCard
            artworkUrl="/design/roman/reception.webp"
            title={events[0]?.title ?? "Resepsi Pernikahan"}
            date={events[0]?.date ?? main.date}
            time={events[0]?.time ?? "11.00 - Selesai WITA"}
            venue={events[0]?.location ?? main.venue}
            mapUrl={events[0]?.locationMap ?? main.mapUrl}
            badgeColor="#3D5A45"
          />
        </div>

        {/* Acara Tambahan */}
        {events.length > 1 ? (
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {events.slice(1).map((e) => (
              <div
                key={e.id}
                className="rm-reveal rm-card rounded-3xl p-6 text-left transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="inline-block rounded-full bg-[#7A2021] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {formatDate(e.date)}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-[#2A1B18]">
                  {e.title ?? "Acara"}
                </h3>
                {e.time && (
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-[#6B554D]">
                    <Clock className="h-4 w-4 text-[#C59B27]" /> {formatTime(e.time)}
                  </p>
                )}
                {e.location && (
                  <p className="mt-1 flex items-center gap-2 text-xs text-[#6B554D]">
                    <MapPin className="h-4 w-4 text-[#C59B27]" /> {e.location}
                  </p>
                )}
                {e.locationMap && (
                  <a
                    href={e.locationMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#7A2021] hover:underline"
                  >
                    Petunjuk Lokasi Google Maps <ExternalLink className="h-3 w-3" />
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
  artworkUrl,
  title,
  date,
  time,
  venue,
  mapUrl,
  badgeColor,
}: {
  artworkUrl: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
  badgeColor: string;
}) {
  return (
    <div className="rm-reveal rm-card relative flex flex-col justify-between overflow-hidden rounded-[36px] p-6 text-center sm:p-8">
      <div>
        {/* Ilustrasi Tempat Acara Presisi */}
        <div className="relative mx-auto mb-4 flex h-48 w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkUrl}
            alt={title}
            className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-700 hover:scale-105"
          />
        </div>

        <span
          className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm"
          style={{ background: badgeColor }}
        >
          {title}
        </span>

        {date && (
          <h3 className="mt-3 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-[#2A1B18]">
            {formatDate(date)}
          </h3>
        )}

        <div className="my-5 space-y-2 text-xs text-[#6B554D]">
          {time && (
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-[#C59B27]" />
              <span className="font-semibold text-[#2A1B18]">{formatTime(time)}</span>
            </div>
          )}
          {venue && (
            <div className="flex items-start justify-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#C59B27]" />
              <span className="max-w-xs leading-relaxed">{venue}</span>
            </div>
          )}
        </div>
      </div>

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#C59B27] bg-[#7A2021] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#591617]"
        >
          <ExternalLink className="h-4 w-4 text-[#E5C365]" />
          <span>Petunjuk Lokasi Google Maps</span>
        </a>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. KISAH CINTA: Kereta Kencana Kuda Putih                          */
/* ------------------------------------------------------------------ */
function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          script="Perjalanan Cinta"
          title="Kisah Kasih Menuju Janji Abadi"
          desc="Setiap langkah pertemuan kami adalah takdir indah yang telah dirajut oleh sang Pencipta"
        />

        {/* Ilustrasi Kereta Kencana Kuda Putih */}
        <div className="rm-reveal mx-auto mb-10 w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/roman/carriage.webp"
            alt="Royal Carriage"
            className="w-full object-contain drop-shadow-md"
          />
        </div>

        {/* Timeline Kartu Kisah */}
        <div className="relative space-y-6">
          <span
            className="absolute bottom-4 left-[23px] top-4 hidden w-0.5 bg-gradient-to-b from-[#C59B27]/0 via-[#C59B27] to-[#C59B27]/0 sm:block"
          />

          {story.map((item, index) => (
            <div key={item.id} className="rm-reveal relative sm:pl-16">
              {/* Badge Nomor Romawi I, II, III... */}
              <span
                className="absolute left-3 top-6 hidden h-7 w-7 items-center justify-center rounded-full border border-[#C59B27] bg-[#7A2021] text-xs font-bold text-white shadow-md sm:flex"
              >
                {toRoman(index + 1)}
              </span>

              <div className="rm-card rounded-3xl p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C59B27]/20 pb-3">
                  <h4 className="font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-[#2A1B18]">
                    {item.title ?? `Momen ${index + 1}`}
                  </h4>
                  {item.date ? (
                    <span className="rounded-full bg-[#7A2021]/10 px-3 py-1 text-xs font-bold text-[#7A2021]">
                      {formatDate(item.date)}
                    </span>
                  ) : null}
                </div>
                {item.description && (
                  <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-[#6B554D]">
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

function toRoman(num: number): string {
  const map: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
  };
  return map[num] ?? String(num);
}

/* ------------------------------------------------------------------ */
/* 7. GALERI FOTO ROMAWI                                              */
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
        <SectionHeading
          script="Galeri Indah"
          title="Potret Kenangan Romantis"
          desc="Sekilas perjalanan kasih yang terabadikan dalam lembaran bahagia"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {gallery.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected({ url: item.url, caption: item.caption })}
              className="rm-reveal rm-card group relative h-72 overflow-hidden rounded-3xl border-2 border-[#C59B27]/30 p-1.5 transition-transform duration-500 hover:-translate-y-1.5"
            >
              <div className="relative h-full w-full overflow-hidden rounded-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? "Foto galeri"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="p-4 text-left font-[family-name:var(--font-serif-elegant)] text-sm font-bold text-white">
                    {item.caption ?? ""}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Lihat foto galeri"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption ?? "Foto galeri"}
              className="max-h-[85vh] max-w-full rounded-2xl border-2 border-[#C59B27] object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup foto"
              className="absolute -top-12 right-0 rounded-full border border-[#C59B27] bg-[#7A2021] p-2 text-white transition hover:scale-110"
            >
              <X className="h-5 w-5 text-[#E5C365]" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. KADO DIGITAL: Amplop Bunga Segel Hati Emas                      */
/* ------------------------------------------------------------------ */
function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="relative px-4 py-20 text-center">
      <div className="rm-reveal rm-card mx-auto max-w-3xl rounded-[36px] p-8 md:p-12">
        {/* Amplop Mekar Bunga dengan Segel Hati Emas */}
        <div className="mx-auto mb-4 w-36 sm:w-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/roman/envelope-heart.webp"
            alt="Tanda Kasih"
            className="w-full object-contain drop-shadow-sm"
          />
        </div>

        <h2 className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wider text-[#2A1B18] sm:text-3xl">
          Tanda Kasih Digital
        </h2>
        <p className="mx-auto mt-2 max-w-md font-[family-name:var(--font-serif-elegant)] text-xs italic text-[#6B554D]">
          Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda berkenan memberikan tanda kasih, dapat melalui:
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gifts.map((g) => (
            <div
              key={g.id}
              className="relative rounded-2xl border border-[#C59B27]/40 bg-white p-5 text-left shadow-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A2021]">
                {g.provider}
              </span>
              <h4 className="my-1 font-mono text-xl font-bold tracking-wider text-[#2A1B18]">
                {g.accountNumber}
              </h4>
              {g.holderName && (
                <p className="text-xs text-[#6B554D]">
                  a.n. <span className="font-semibold text-[#2A1B18]">{g.holderName}</span>
                </p>
              )}
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
/* 9. RSVP KONFIRMASI KEHADIRAN                                       */
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
      <div className="rm-reveal rm-card mx-auto max-w-xl rounded-[36px] p-8 md:p-12">
        <div className="mb-6 text-center">
          <span className="font-[family-name:var(--font-script)] text-3xl text-[#7A2021]">
            Konfirmasi Kehadiran
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wider text-[#2A1B18]">
            RSVP Tamu Undangan
          </h2>
          <p className="mt-1 text-xs italic text-[#6B554D]">
            Mohon konfirmasikan kehadiran Bapak/Ibu/Saudara/i untuk kenyamanan acara
          </p>
        </div>

        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="bg-[#7A2021] hover:bg-[#591617] text-white shadow-md border border-[#C59B27]"
          borderClass="border-[#C59B27]/40 bg-white text-[#2A1B18] focus:border-[#7A2021] focus:ring-[#7A2021]/20"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. PAPAN DOA & UCAPAN TAMU                                        */
/* ------------------------------------------------------------------ */
function WishesSection({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section className="relative px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rm-reveal mb-10 text-center">
          <span className="font-[family-name:var(--font-script)] text-3xl text-[#7A2021]">
            Papan Doa
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wider text-[#2A1B18]">
            Doa &amp; Harapan Tamu Undangan
          </h2>
        </div>

        <div className="rm-reveal mb-8 grid max-h-[500px] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[#C59B27]/30 bg-white/95 rounded-2xl"
            nameClass="text-[#7A2021]"
            avatarClass="bg-[#7A2021] text-[#E5C365]"
            emptyClass="text-[#6B554D]"
          />
        </div>

        <div className="rm-card rm-reveal rounded-3xl p-6 sm:p-8">
          <WishForm
            invitationId={invitationId}
            accentClass="bg-[#7A2021] hover:bg-[#591617] text-white shadow-md border border-[#C59B27]"
            borderClass="border-[#C59B27]/40 bg-white text-[#2A1B18] focus:border-[#7A2021] focus:ring-[#7A2021]/20"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. PESAN PENUTUP & SUNSET GETAWAY CAR                             */
/* ------------------------------------------------------------------ */
function ClosingSection({ text }: { text?: string }) {
  const closingMsg =
    text ??
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi lembaran baru kehidupan kami.";

  return (
    <section className="relative px-4 py-20 text-center">
      <div className="rm-reveal rm-card mx-auto max-w-xl rounded-[36px] p-8 md:p-12">
        {/* Mobil Pengantin Vintage Romantis */}
        <div className="mx-auto mb-6 w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/roman/getaway-car.webp"
            alt="Just Married"
            className="w-full object-contain drop-shadow-sm"
          />
        </div>

        <h3 className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wider text-[#2A1B18]">
          Terima Kasih
        </h3>

        <p className="mt-3 whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-sm italic leading-relaxed text-[#6B554D]">
          {closingMsg}
        </p>

        <p className="mt-5 font-[family-name:var(--font-script)] text-3xl text-[#7A2021]">
          With Love, Newlyweds
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 12. FOOTER DENGAN FLORAL BORDER                                    */
/* ------------------------------------------------------------------ */
function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="relative overflow-hidden border-t border-[#C59B27]/30 bg-[#F4EDE2]/85 px-4 pb-20 pt-10 text-center backdrop-blur-[2px]">
      <h3 className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-widest text-[#7A2021]">
        {groomName ?? "Groom"} &amp; {brideName ?? "Bride"}
      </h3>
      <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-xs italic text-[#6B554D]">
        Sampai jumpa di hari bahagia pernikahan kami!
      </p>
      <p className="mt-5 text-[10px] uppercase tracking-widest text-[#8A756C]">
        &copy; {new Date().getFullYear()} MEDUTA &bull; ROMAN ROMANCE
      </p>

      {/* Untaian Bunga di Dasar Halaman Footer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design/roman/floral-border.webp"
          alt=""
          className="h-10 w-full object-cover"
        />
      </div>
    </footer>
  );
}
