"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  Calendar,
  Clock,
  MapPin,
  Gift,
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  Bookmark,
  Feather,
  Heart,
} from "lucide-react";
import ScrapbookGate from "./ScrapbookGate";
import {
  useBackgroundMusic,
  MusicFab,
  type MusicController,
} from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { Countdown, SaveToCalendarButton } from "./SharedWidgets";
import {
  formatDate,
  splitAgenda,
  type EventItem,
  type TemplateProps,
} from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Scrapbook Album — "Wedding Photo Album"
 * Adopsi dari desain referensi scrapbook (krem hangat #FAF6F0, terakota
 * #B5533C, polaroid + washi tape, tulisan tangan Caveat, filter sepia
 * film 35mm), diubah total menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic) — bukan MP3 hardcoded referensi
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan DB
 * - Kado dari data.gifts + CopyButton (bukan bank hardcoded referensi)
 * - Dihapus dari referensi: Gemini AI wish polish (risiko API key)
 * - Background berlapis: pilihan user > admin (template) > bawaan
 */

/* Palet scrapbook (konsisten dengan desain referensi) */
const SB = {
  cream: "#FAF6F0",
  creamDark: "#F2ECE1",
  brown: "#3E2F28",
  brownLight: "#655348",
  terracotta: "#B5533C",
  terracottaLight: "#E39280",
  green: "#6B7A6A",
  pink: "#D89D91",
  paper: "#FFFDF9",
} as const;

/* Kelas CSS khusus template (prefix sb- agar tidak bentrok global) */
const SB_STYLES = `
  .sb-paper {
    background-image: radial-gradient(#655348 0.5px, transparent 0.5px);
    background-size: 24px 24px;
    opacity: 0.04;
  }
  .sb-polaroid {
    box-shadow: 0 10px 25px -5px rgba(62, 47, 40, 0.12), 0 8px 10px -6px rgba(62, 47, 40, 0.08);
  }
  .sb-tape-top {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 90px;
    height: 26px;
    background-color: rgba(227, 146, 128, 0.4);
    backdrop-filter: blur(2px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-left: 2px dashed rgba(255, 255, 255, 0.5);
    border-right: 2px dashed rgba(255, 255, 255, 0.5);
    z-index: 10;
  }
  .sb-tape-green {
    position: absolute;
    top: -10px;
    right: 15px;
    transform: rotate(4deg);
    width: 75px;
    height: 22px;
    background-color: rgba(107, 122, 106, 0.35);
    backdrop-filter: blur(2px);
    border-left: 2px dashed rgba(255, 255, 255, 0.4);
    border-right: 2px dashed rgba(255, 255, 255, 0.4);
    z-index: 10;
  }
  .sb-photo {
    filter: contrast(1.03) sepia(0.12);
  }
  .sb-hand {
    font-family: "Caveat", "Comic Sans MS", cursive;
  }
`;

/* Rotasi polaroid deterministik per index (tanpa hydration mismatch) */
const ROTATIONS = ["-rotate-2", "rotate-3", "-rotate-3", "rotate-2", "-rotate-1"];

export default function ScrapbookTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);

  return (
    <ScrapbookShell
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

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function ScrapbookShell({
  data,
  guestName,
  slug,
  invitationId,
  wishes = [],
  decorations = [],
  gateOpen,
  onGateOpen,
  music,
}: TemplateProps & {
  gateOpen: boolean;
  onGateOpen?: () => void;
  music: MusicController;
}) {
  const groom = data.groom;
  const bride = data.bride;
  const gallery = data.gallery ?? [];
  const events = data.events ?? [];
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  // Prioritas foto gerbang: user > admin (dekorasi) > mempelai > galeri[0]
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: groom?.photoUrl,
    bridePhotoUrl: bride?.photoUrl,
    firstGalleryUrl: data.gallery?.[0]?.url,
  });

  const groomNick = groom?.nickname ?? groom?.name ?? "Pria";
  const brideNick = bride?.nickname ?? bride?.name ?? "Wanita";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden selection:text-white"
      style={{
        background: bgUrl ? undefined : SB.cream,
        backgroundColor: SB.cream,
        color: SB.brown,
      }}
    >
      <style>{SB_STYLES}</style>

      {/* Background kustom user/admin */}
      {bgUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgUrl}
            alt=""
            className="fixed inset-0 h-full w-full object-cover"
          />
          <div
            className="fixed inset-0"
            style={{ background: "rgba(250, 246, 240, 0.82)" }}
          />
        </>
      )}

      {/* Tekstur kertas di seluruh halaman */}
      <div className="sb-paper pointer-events-none fixed inset-0 z-0" />

      {/* Konten utama */}
      {gateOpen && (
        <main className="relative z-10 mx-auto max-w-2xl px-4 py-8">
          <HeroSection
            groomNick={groomNick}
            brideNick={brideNick}
            eventDate={data.eventDate}
            venueName={data.venueName}
            location={data.location}
            eventName={data.eventName}
            photo={gatePhoto}
            secondPhoto={gallery[1]?.url}
            quote={data.customMessage}
          />

          {data.eventDate ? (
            <CountdownSection eventDate={data.eventDate} />
          ) : null}

          {groom?.name || bride?.name ? (
            <CoupleSection groom={groom} bride={bride} />
          ) : null}

          <EventsSection
            data={data}
            events={events}
            slug={slug}
            groomNick={groomNick}
            brideNick={brideNick}
          />

          {gallery.length > 0 ? (
            <GallerySection gallery={gallery} />
          ) : null}

          <RsvpSection invitationId={invitationId} guestName={guestName} wishes={wishes} />

          {(data.gifts?.length ?? 0) > 0 ? (
            <GiftSection gifts={data.gifts ?? []} />
          ) : null}

          <ClosingSection
            groomNick={groomNick}
            brideNick={brideNick}
            photo={gallery[1]?.url ?? gallery[0]?.url}
            groomChildOf={groom?.childOf ?? groom?.parentName}
            brideChildOf={bride?.childOf ?? bride?.parentName}
          />
        </main>
      )}

      {/* Gerbang undangan khusus scrapbook (di atas konten) */}
      {!gateOpen && (
        <ScrapbookGate
          eventName={data.eventName ?? "Wedding Photo Album"}
          groomNick={groomNick}
          brideNick={brideNick}
          eventDate={data.eventDate}
          location={data.location}
          guestName={guestName}
          onOpen={onGateOpen}
          backgroundUrl={bgUrl}
          photoUrl={
            gatePhoto
          }
        />
      )}

      {/* FAB musik latar user */}
      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="bg-[#3E2F28] text-[#FAF6F0] border border-white/20"
          playingIconClassName="h-5 w-5 animate-pulse text-[#E39280]"
          pausedIconClassName="h-5 w-5 opacity-70"
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero: header tulisan tangan + tumpukan polaroid + kutipan           */
/* ------------------------------------------------------------------ */

function HeroSection({
  groomNick,
  brideNick,
  eventDate,
  venueName,
  location,
  eventName,
  photo,
  secondPhoto,
  quote,
}: {
  groomNick: string;
  brideNick: string;
  eventDate?: string;
  venueName?: string;
  location?: string;
  eventName?: string;
  photo?: string;
  secondPhoto?: string;
  quote?: string;
}) {
  const place = [venueName, location].filter(Boolean).join(" • ");
  const gallerySecond = secondPhoto;
  return (
    <section className="relative z-10 pb-12 pt-6 text-center">
      <div className="relative inline-block">
        <span
          className="sb-hand -rotate-3 block text-3xl font-bold"
          style={{ color: SB.terracotta }}
        >
          {eventName ?? "The Wedding of"}
        </span>
        <h1
          className="mt-1 font-[family-name:var(--font-serif-elegant)] text-5xl font-bold tracking-tight"
          style={{ color: SB.brown }}
        >
          {groomNick} &amp; {brideNick}
        </h1>
        <div
          className="mx-auto my-3 h-0.5 w-24 rounded-full"
          style={{ background: "rgba(181, 83, 60, 0.4)" }}
        />
        <p
          className="text-sm font-medium uppercase tracking-widest"
          style={{ color: SB.brownLight }}
        >
          {[formatDate(eventDate), place.split(" • ")[1]].filter(Boolean).join(" • ")}
        </p>
      </div>

      {/* Tumpukan foto polaroid berlapis */}
      <div className="relative mx-auto mt-10 max-w-md" style={{ height: 400 }}>
        {gallerySecond ? (
          <div
            className="sb-polaroid absolute left-0 top-4 z-0 w-56 -rotate-6 rounded-sm border p-3 pb-8 transition-transform duration-500 hover:-rotate-3 sm:w-64"
            style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallerySecond}
              alt="Momen pasangan"
              className="sb-photo h-56 w-full object-cover"
            />
            <p className="sb-hand mt-2 text-center text-lg" style={{ color: SB.brownLight }}>
              Moment Of Serenity
            </p>
          </div>
        ) : null}

        <div
          className="sb-polaroid absolute right-0 top-0 z-10 w-56 rotate-3 rounded-sm border p-3 pb-10 transition-transform duration-500 hover:rotate-1 sm:w-64"
          style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
        >
          <span className="sb-tape-top" aria-hidden />
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Foto utama pasangan"
              className="sb-photo h-64 w-full object-cover"
            />
          ) : (
            <div
              className="flex h-64 items-center justify-center"
              style={{ background: SB.creamDark }}
            >
              <Camera className="h-10 w-10" style={{ color: SB.pink }} />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between px-2">
            <span className="sb-hand text-xl font-bold" style={{ color: SB.brown }}>
              {groomNick} &amp; {brideNick}
            </span>
            <span
              className="rounded px-2 py-0.5 font-mono text-[10px]"
              style={{ background: "rgba(107,122,106,0.1)", color: SB.green }}
            >
              35MM FILM
            </span>
          </div>
        </div>
      </div>

      {/* Kutipan */}
      <div
        className="sb-polaroid relative mx-auto mt-10 max-w-lg rounded-lg border p-6 shadow-sm"
        style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.1)" }}
      >
        <span className="sb-tape-green" aria-hidden />
        <p
          className="font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed"
          style={{ color: SB.brown }}
        >
          &ldquo;{quote ?? "Di antara miliaran cerita di dunia, kami menemukan kehangatan rumah dalam pelukan satu sama lain."}&rdquo;
        </p>
        <p
          className="mt-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: SB.terracotta }}
        >
          — #{groomNick}
          {brideNick}Forever
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Countdown                                                           */
/* ------------------------------------------------------------------ */

function CountdownSection({ eventDate }: { eventDate: string }) {
  return (
    <section
      className="relative z-10 my-6 rounded-2xl border p-6 text-center"
      style={{
        background: "rgba(242, 236, 225, 0.6)",
        borderColor: "rgba(62,47,40,0.1)",
      }}
    >
      <h2
        className="flex items-center justify-center gap-2 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
        style={{ color: SB.brown }}
      >
        <Clock className="h-5 w-5" style={{ color: SB.terracotta }} />
        <span>Menghitung Hari Bahagia</span>
      </h2>
      <p className="mb-6 text-xs" style={{ color: SB.brownLight }}>
        Menuju pengikatan janji suci pernikahan kami
      </p>
      <Countdown
        target={eventDate}
        boxClass="rounded-lg border bg-white"
        valueClass="text-2xl sm:text-3xl"
        labelClass="text-[10px]"
      />
      <div className="mt-6">
        <SaveToCalendarButton
          title="Pernikahan"
          date={eventDate}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-medium uppercase tracking-wider shadow-md transition-transform hover:scale-105"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai                                                            */
/* ------------------------------------------------------------------ */

function Polaroid({
  src,
  caption,
  rotate,
  tall,
}: {
  src?: string;
  caption: string;
  rotate: string;
  tall?: boolean;
}) {
  return (
    <div
      className={`sb-polaroid relative mx-auto w-full max-w-xs rounded-sm border p-3 pb-6 transition-transform duration-300 hover:scale-105 ${rotate}`}
      style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={caption}
          className={`sb-photo w-full object-cover ${tall ? "h-64" : "h-44"}`}
        />
      ) : (
        <div
          className={`flex w-full items-center justify-center ${tall ? "h-64" : "h-44"}`}
          style={{ background: SB.creamDark }}
        >
          <Camera className="h-8 w-8" style={{ color: SB.pink }} />
        </div>
      )}
      <p className="sb-hand mt-3 text-center text-xl font-bold" style={{ color: SB.brown }}>
        {caption}
      </p>
    </div>
  );
}

function CoupleSection({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section className="relative z-10 py-12 text-center">
      <div className="mb-10 text-center">
        <span className="sb-hand text-3xl" style={{ color: SB.terracotta }}>
          Mempelai
        </span>
        <h2
          className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold"
          style={{ color: SB.brown }}
        >
          Dua Hati Satu Cerita
        </h2>
        <div
          className="mx-auto mt-2 h-0.5 w-16 rounded-full"
          style={{ background: "rgba(181,83,60,0.3)" }}
        />
      </div>

      <div className="space-y-10">
        {groom?.name ? (
          <div>
            <Polaroid
              src={groom.photoUrl}
              caption={groom.nickname ?? groom.name}
              rotate="-rotate-2"
              tall
            />
            <div
              className="relative mx-auto mt-6 max-w-sm rounded-xl border p-5 shadow-sm"
              style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.1)" }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: SB.terracotta }}
              >
                Mempelai Pria
              </p>
              <p
                className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
                style={{ color: SB.brown }}
              >
                {groom.name}
              </p>
              {(groom.childOf ?? groom.parentName) && (
                <p className="mt-1 text-xs" style={{ color: SB.brownLight }}>
                  Putra dari {groom.childOf ?? groom.parentName}
                </p>
              )}
              {groom.instagram && (
                <a
                  href={`https://instagram.com/${groom.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium underline"
                  style={{ color: SB.terracotta }}
                >
                  @{groom.instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-center">
          <Heart className="h-6 w-6 fill-current" style={{ color: SB.terracotta }} />
        </div>

        {bride?.name ? (
          <div>
            <Polaroid
              src={bride.photoUrl}
              caption={bride.nickname ?? bride.name}
              rotate="rotate-2"
              tall
            />
            <div
              className="relative mx-auto mt-6 max-w-sm rounded-xl border p-5 shadow-sm"
              style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.1)" }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: SB.terracotta }}
              >
                Mempelai Wanita
              </p>
              <p
                className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
                style={{ color: SB.brown }}
              >
                {bride.name}
              </p>
              {(bride.childOf ?? bride.parentName) && (
                <p className="mt-1 text-xs" style={{ color: SB.brownLight }}>
                  Putri dari {bride.childOf ?? bride.parentName}
                </p>
              )}
              {bride.instagram && (
                <a
                  href={`https://instagram.com/${bride.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium underline"
                  style={{ color: SB.terracotta }}
                >
                  @{bride.instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara (kartu polaroid ala referensi; tanpa akad dobel via splitAgenda) */
/* ------------------------------------------------------------------ */

function EventsSection({
  data,
  events,
  slug,
  groomNick,
  brideNick,
}: {
  data: TemplateProps["data"];
  events: TemplateProps["data"]["events"];
  slug: string;
  groomNick: string;
  brideNick: string;
}) {
  const agenda = splitAgenda(events, {
    date: data.eventDate,
    time: data.eventTime,
    venue: data.venueName,
    mapUrl: data.locationMap,
  });
  const additional = agenda.additional;

  return (
    <section className="relative z-10 my-6 py-12">
      <div className="mb-10 text-center">
        <span className="sb-hand text-3xl" style={{ color: SB.terracotta }}>
          Save The Date
        </span>
        <h2
          className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold"
          style={{ color: SB.brown }}
        >
          Rangkaian Acara
        </h2>
        <p className="mt-1 text-xs" style={{ color: SB.brownLight }}>
          Kehadiran Anda adalah keberkahan bagi kami
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kartu Acara Utama */}
        <div
          className="sb-polaroid relative overflow-hidden rounded-xl border p-6 transition-colors hover:border-[rgba(181,83,60,0.4)]"
          style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.15)" }}
        >
          <span className="sb-tape-top" aria-hidden />
          <div className="mb-4 flex items-center gap-3" style={{ color: SB.terracotta }}>
            <Bookmark className="h-5 w-5 fill-current" />
            <h3
              className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
              style={{ color: SB.brown }}
            >
              Akad Nikah
            </h3>
          </div>
          <div
            className="space-y-3 border-t pt-4 text-sm"
            style={{ borderColor: "rgba(62,47,40,0.1)", color: SB.brown }}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4" style={{ color: SB.green }} />
              <span>{formatDate(agenda.main.date) || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" style={{ color: SB.green }} />
              <span>{agenda.main.time || "—"}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 shrink-0" style={{ color: SB.green }} />
              <div>
                <p className="font-semibold">{agenda.main.venue || "—"}</p>
                <p className="mt-0.5 text-xs" style={{ color: SB.brownLight }}>
                  {data.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kartu Resepsi = acara tambahan pertama, atau kartu statis bila kosong */}
        <div
          className="sb-polaroid relative overflow-hidden rounded-xl border p-6 transition-colors hover:border-[rgba(181,83,60,0.4)]"
          style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.15)" }}
        >
          <span className="sb-tape-green" aria-hidden />
          <div className="mb-4 flex items-center gap-3" style={{ color: SB.green }}>
            <Feather className="h-5 w-5" />
            <h3
              className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
              style={{ color: SB.brown }}
            >
              {additional[0]?.title ?? "Resepsi Pernikahan"}
            </h3>
          </div>
          <div
            className="space-y-3 border-t pt-4 text-sm"
            style={{ borderColor: "rgba(62,47,40,0.1)", color: SB.brown }}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4" style={{ color: SB.terracotta }} />
              <span>{formatDate(additional[0]?.date ?? agenda.main.date) || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" style={{ color: SB.terracotta }} />
              <span>{additional[0]?.time ?? agenda.main.time ?? "—"}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-1 h-4 w-4 shrink-0"
                style={{ color: SB.terracotta }}
              />
              <div>
                <p className="font-semibold">
                  {additional[0]?.location ?? agenda.main.venue ?? "—"}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: SB.brownLight }}>
                  {data.location}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acara tambahan lainnya */}
      {additional.length > 1 ? (
        <div className="mt-6 space-y-4">
          {additional.slice(1).map((ev: EventItem) => (
            <div
              key={ev.id}
              className="sb-polaroid relative rounded-xl border p-5"
              style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.15)" }}
            >
              <h3
                className="font-[family-name:var(--font-serif-elegant)] text-xl font-bold"
                style={{ color: SB.brown }}
              >
                {ev.title}
              </h3>
              <p className="mt-1 text-sm" style={{ color: SB.brown }}>
                {[formatDate(ev.date), ev.time].filter(Boolean).join(" • ")}
              </p>
              {ev.location && (
                <p className="mt-0.5 text-xs" style={{ color: SB.brownLight }}>
                  {ev.location}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Tombol peta */}
      <div className="mt-8 text-center">
        <a
          href={
            agenda.main.mapUrl ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [agenda.main.venue, data.location].filter(Boolean).join(" "),
            )}`
          }
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-medium uppercase tracking-wider shadow-md transition-transform duration-300 hover:scale-105"
          style={{ background: SB.brown, color: SB.cream }}
        >
          <Compass className="h-4 w-4" style={{ color: SB.terracottaLight }} />
          <span>Petunjuk Lokasi Google Maps</span>
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri scrapbook + lightbox                                         */
/* ------------------------------------------------------------------ */

function GallerySection({ gallery }: { gallery: NonNullable<TemplateProps["data"]["gallery"]> }) {
  const [active, setActive] = useState<number | null>(null);

  const prev = () =>
    setActive((p) => (p === null ? null : p > 0 ? p - 1 : gallery.length - 1));
  const next = () =>
    setActive((p) => (p === null ? null : p < gallery.length - 1 ? p + 1 : 0));

  return (
    <section className="relative z-10 py-12">
      <div className="mb-8 text-center">
        <span className="sb-hand text-3xl" style={{ color: SB.terracotta }}>
          Captured Moments
        </span>
        <h2
          className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold"
          style={{ color: SB.brown }}
        >
          Galeri Foto Scrapbook
        </h2>
        <p className="mt-1 text-xs" style={{ color: SB.brownLight }}>
          Klik pada foto untuk melihat ukuran penuh
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {gallery.slice(0, 9).map((g, i) => (
          <div
            key={g.id}
            onClick={() => setActive(i)}
            className={`sb-polaroid relative cursor-pointer rounded-sm border p-2.5 pb-6 transition-all duration-300 hover:z-20 hover:scale-105 ${
              ROTATIONS[i % ROTATIONS.length]
            }`}
            style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
          >
            <div
              className="aspect-square overflow-hidden rounded-sm"
              style={{ background: SB.creamDark }}
            >
              {g.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.url}
                  alt={g.caption ?? "Foto galeri"}
                  className="sb-photo h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              ) : null}
            </div>
            <p
              className="sb-hand mt-2 text-center text-sm font-medium line-clamp-1"
              style={{ color: SB.brown }}
            >
              {g.caption ?? "Moment"}
            </p>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && gallery[active] ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(62,47,40,0.9)" }}
        >
          <button
            onClick={() => setActive(null)}
            className="absolute right-6 top-6 p-2 text-white/80 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-8 w-8" />
          </button>

          <div
            className="sb-polaroid relative w-full max-w-md rounded-sm border p-4 pb-10"
            style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[active].url}
              alt={gallery[active].caption ?? "Foto"}
              className="max-h-[65vh] w-full rounded-sm object-contain"
            />
            <p
              className="sb-hand mt-4 text-center text-2xl font-bold"
              style={{ color: SB.brown }}
            >
              {gallery[active].caption ?? "Moment"}
            </p>
            <div
              className="mt-6 flex items-center justify-between border-t pt-3"
              style={{ borderColor: "rgba(62,47,40,0.1)" }}
            >
              <button
                onClick={prev}
                className="flex items-center gap-1 text-xs font-medium uppercase hover:underline"
                style={{ color: SB.terracotta }}
              >
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 text-xs font-medium uppercase hover:underline"
                style={{ color: SB.terracotta }}
              >
                Berikutnya <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP & Ucapan                                                       */
/* ------------------------------------------------------------------ */

function RsvpSection({
  invitationId,
  guestName,
  wishes,
}: {
  invitationId: string;
  guestName?: string;
  wishes: TemplateProps["wishes"];
}) {
  return (
    <section className="relative z-10 my-6 py-12">
      <div
        className="sb-polaroid relative rounded-2xl border p-6"
        style={{ background: SB.paper, borderColor: "rgba(62,47,40,0.15)" }}
      >
        <span className="sb-tape-top" aria-hidden />
        <div className="mb-8 text-center">
          <span className="sb-hand text-3xl" style={{ color: SB.terracotta }}>
            Guestbook &amp; RSVP
          </span>
          <h2
            className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
            style={{ color: SB.brown }}
          >
            Konfirmasi Kehadiran &amp; Doa
          </h2>
          <p className="mt-1 text-xs" style={{ color: SB.brownLight }}>
            Tuliskan ucapan dan konfirmasi kehadiranmu di buku tamu kami
          </p>
        </div>

        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="hover:brightness-110"
          borderClass="border-[rgba(62,47,40,0.2)] focus:border-[#B5533C] focus:ring-[#E39280]/30"
        />

        <div className="mt-10 border-t pt-6" style={{ borderColor: "rgba(62,47,40,0.15)" }}>
          <h3
            className="mb-4 flex items-center gap-2 font-[family-name:var(--font-serif-elegant)] text-xl font-bold"
            style={{ color: SB.brown }}
          >
            <Feather className="h-4 w-4" style={{ color: SB.terracotta }} />
            <span>Ucapan &amp; Doa Tamu</span>
          </h3>

          <WishForm
            invitationId={invitationId}
            accentClass="bg-[#B5533C] hover:bg-[#9e4732]"
            borderClass="border-[rgba(62,47,40,0.2)] focus:border-[#B5533C] focus:ring-[#E39280]/30"
          />

          <div className="mt-8 max-h-80 overflow-y-auto pr-2">
            <WishList
              wishes={wishes ?? []}
              cardClass="border-[rgba(62,47,40,0.1)] bg-[#FAF6F0]"
              nameClass="text-[#3E2F28]"
              avatarClass="bg-[#E39280]/20 text-[#B5533C]"
              emptyClass="text-[#655348]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado digital                                                        */
/* ------------------------------------------------------------------ */

function GiftSection({ gifts }: { gifts: NonNullable<TemplateProps["data"]["gifts"]> }) {
  return (
    <section className="relative z-10 my-6 py-10">
      <div
        className="relative rounded-2xl border p-6 text-center"
        style={{
          background: "rgba(242, 236, 225, 0.8)",
          borderColor: "rgba(62,47,40,0.15)",
        }}
      >
        <span className="sb-tape-green" aria-hidden />
        <Gift className="mx-auto mb-2 h-8 w-8" style={{ color: SB.terracotta }} />
        <span className="sb-hand text-3xl" style={{ color: SB.terracotta }}>
          Wedding Gift
        </span>
        <h2
          className="mb-2 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold"
          style={{ color: SB.brown }}
        >
          Hadiah Digital
        </h2>
        <p className="mx-auto mb-6 max-w-md text-xs" style={{ color: SB.brownLight }}>
          Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda ingin
          memberi tanda kasih dalam bentuk digital, Anda dapat melalui rekening berikut:
        </p>

        <div className="mx-auto grid max-w-md gap-4 md:grid-cols-2">
          {gifts.map((g) => (
            <div
              key={g.id}
              className="sb-polaroid relative rounded-xl border p-4 text-left"
              style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
            >
              <span className="block text-lg font-bold" style={{ color: SB.brown }}>
                {g.provider}
              </span>
              <span
                className="my-1 block font-mono text-sm font-semibold"
                style={{ color: SB.terracotta }}
              >
                {g.accountNumber}
              </span>
              <span className="block text-xs" style={{ color: SB.brownLight }}>
                a.n {g.holderName}
              </span>
              <div className="mt-3">
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
/* Penutup                                                             */
/* ------------------------------------------------------------------ */

function ClosingSection({
  groomNick,
  brideNick,
  photo,
  groomChildOf,
  brideChildOf,
}: {
  groomNick: string;
  brideNick: string;
  photo?: string;
  groomChildOf?: string;
  brideChildOf?: string;
}) {
  const families = useMemo(
    () => [groomChildOf, brideChildOf].filter(Boolean).join(" & "),
    [groomChildOf, brideChildOf],
  );
  return (
    <section className="relative z-10 py-12 text-center">
      <div
        className="sb-polaroid relative mx-auto max-w-md rotate-1 rounded-sm border p-6 pb-10"
        style={{ background: "#fff", borderColor: "rgba(62,47,40,0.1)" }}
      >
        <span className="sb-tape-top" aria-hidden />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt="Foto penutup"
            className="sb-photo h-56 w-full rounded-sm object-cover"
          />
        ) : null}
        <p
          className="mt-6 font-[family-name:var(--font-serif-elegant)] text-lg italic"
          style={{ color: SB.brown }}
        >
          &ldquo;Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i sekalian, kami
          mengucapkan terima kasih yang mendalam.&rdquo;
        </p>
        <div className="mt-6">
          <span className="sb-hand block text-3xl font-bold" style={{ color: SB.terracotta }}>
            {groomNick} &amp; {brideNick}
          </span>
          {families ? (
            <span
              className="mt-1 block text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: SB.brownLight }}
            >
              Keluarga Besar {families}
            </span>
          ) : null}
        </div>
      </div>

      <footer className="mt-12 font-mono text-xs opacity-60" style={{ color: SB.brownLight }}>
        © {new Date().getFullYear()} Meduta • Digital Wedding Album
      </footer>
    </section>
  );
}
