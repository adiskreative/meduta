"use client";

import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  Landmark,
  X,
  ArrowDown,
} from "lucide-react";
import ZenGate from "./ZenGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { Countdown, SaveToCalendarButton } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Zen Minimalist — "和 Wa (Harmoni)"
 * Adopsi dari desain referensi zen Jepang (off-white #FAF8F5, beige #EFE9DD,
 * charcoal #23211E, merah hanko #B54434, sage #788A75), diubah total menjadi
 * data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic) — bukan osilator Web Audio sintetis
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan di DB
 * - Background berlapis: pilihan user > admin (template) > bawaan
 * - Tanpa API eksternal (AI wish formatter referensi dihapus — risiko bocor kunci)
 * Khas template ini: stempel Hanko merah, lingkaran Enso, countdown,
 * tombol Google Calendar, galeri grayscale→warna dengan lightbox.
 */

/* Palet zen (konsisten dengan desain referensi) */
const ZEN = {
  bg: "#FAF8F5",
  beige: "#EFE9DD",
  ink: "#23211E",
  ink2: "#383431",
  red: "#B54434",
  sage: "#788A75",
} as const;

/* Tekstur kertas grid halus (SVG data-URI dari desain referensi) */
const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2323211E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

/* Lingkaran Enso — goresan tinta zen (SVG inline) */
function EnsoCircle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`inline-block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M100 20 C145 18, 182 55, 180 100 C178 145, 140 182, 95 180 C50 178, 18 140, 20 95 C22 55, 55 22, 92 20"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="4 2"
        className="opacity-80"
      />
      <path
        d="M95 15 C150 15, 185 52, 185 102 C185 152, 142 185, 92 185 C42 185, 15 145, 15 95 C15 52, 52 16, 90 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Stempel Hanko merah — aksen khas zen Jepang */
function HankoSeal({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <span className="inline-flex select-none flex-col items-center justify-center rounded-sm border-2 px-2 py-2"
      style={{ borderColor: ZEN.red, color: ZEN.red, backgroundColor: `${ZEN.red}0D` }}>
      <span className="font-[family-name:var(--font-serif-elegant)] text-xl font-semibold leading-none tracking-tighter">
        {text}
      </span>
      {subtext && (
        <span className="mt-0.5 text-[8px] uppercase tracking-widest">{subtext}</span>
      )}
    </span>
  );
}

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function ZenTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <ZenShell
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

function ZenShell({
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
  if (!isPublished) {
    return <DraftNotice />;
  }

  const groom = data.groom;
  const bride = data.bride;
  const events = data.events ?? [];
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  // Prioritas background: pilihan user > admin (template) > bawaan (sage garden)
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
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
      className="relative min-h-screen font-[family-name:var(--font-sans)]"
      style={{ backgroundColor: ZEN.bg, color: ZEN.ink }}
    >
      {/* Tekstur kertas grid di seluruh halaman */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{ backgroundImage: PAPER_TEXTURE }}
      />

      <div className="relative z-10">
        <Cover
          eventName={data.eventName ?? "Undangan Pernikahan"}
          groomNick={groom?.nickname ?? groom?.name}
          brideNick={bride?.nickname ?? bride?.name}
          eventDate={data.eventDate}
          guestName={guestName}
          locked={!gateOpen}
          onOpen={onGateOpen}
          bgUrl={bgUrl}
          groomPhoto={groom?.photoUrl}
          bridePhoto={bride?.photoUrl}
          gatePhoto={gatePhoto}
          tagline={data.customMessage}
        />

        {gateOpen && (
          <main className="w-full">
            {/* Hero asimetris: teks kiri, foto zen frame kanan */}
            <HeroSection
              groomNick={groom?.nickname ?? groom?.name}
              brideNick={bride?.nickname ?? bride?.name}
              groomName={groom?.name}
              brideName={bride?.name}
              eventName={data.eventName ?? "Pernikahan"}
              customMessage={data.customMessage}
              photo={gatePhoto}
            />

            {/* Kutipan & pesan pembuka — prioritas: user (quoteText) →
                customMessage → tidak ditampilkan bila keduanya kosong atau
                "Tampilkan kutipan" dimatikan */}
            {!data.quoteHidden && (data.quoteText?.trim() || data.customMessage?.trim()) ? (
              <QuoteSection
                text={data.quoteText?.trim() || data.customMessage?.trim() || ""}
                source={data.quoteSource}
              />
            ) : null}

            {groom?.name || bride?.name ? (
              <Couple groom={groom} bride={bride} />
            ) : null}

            {story.length > 0 ? <StorySection story={story} /> : null}

            {/* Rangkaian acara + countdown + gcal */}
            <EventsSection
              eventDate={data.eventDate}
              eventTime={data.eventTime}
              venueName={data.venueName}
              location={data.location}
              locationMap={data.locationMap}
              events={events}
            />

            {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

            <RsvpSection
              invitationId={invitationId}
              guestName={guestName}
            />

            {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

            <Wishes invitationId={invitationId} wishes={wishes} />

            <Footer
              groomName={groom?.name}
              brideName={bride?.name}
              groomNick={groom?.nickname ?? groom?.name}
              brideNick={bride?.nickname ?? bride?.name}
            />
          </main>
        )}
      </div>

      {/* FAB musik latar user */}
      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="border border-[#23211E]/15 bg-[#FAF8F5]/90 text-[#23211E] shadow-md backdrop-blur-md hover:border-[#788A75]"
          playingIconClassName="h-4 w-4 animate-pulse"
          pausedIconClassName="h-4 w-4 opacity-50"
        />
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: ZEN.bg, color: ZEN.ink }}>
      <EnsoCircle className="h-16 w-16" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm opacity-60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang + Cover                                                     */
/* ------------------------------------------------------------------ */

const GATE_FALLBACK_BG =
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80";

function Cover({
  eventName,
  groomNick,
  brideNick,
  eventDate,
  guestName,
  locked = false,
  onOpen,
  bgUrl,
  groomPhoto,
  bridePhoto,
  gatePhoto,
  tagline,
}: {
  eventName: string;
  gatePhoto?: string;
  tagline?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  locked?: boolean;
  onOpen?: () => void;
  bgUrl?: string;
  groomPhoto?: string;
  bridePhoto?: string;
}) {
  const cover = (
    <header
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
      style={{ backgroundColor: ZEN.bg, border: `8px solid ${ZEN.beige}` }}
    >
      {/* Latar: pilihan user > admin > bawaan */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{ backgroundImage: `url(${bgUrl || GATE_FALLBACK_BG})` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to bottom, ${ZEN.bg}CC, ${ZEN.bg}F2)` }}
      />

      {/* Ornamen enso di sudut */}
      <EnsoCircle className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 opacity-20" />
      <EnsoCircle className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 opacity-15" />

      <div className="relative z-10 flex flex-col items-center px-4">
        <span className="text-xs uppercase tracking-[0.3em]" style={{ color: ZEN.sage }}>
          The Wedding Invitation
        </span>
        <div className="mt-3 h-px w-8" style={{ backgroundColor: `${ZEN.ink}33` }} />

        {/* Nama dalam lingkaran Enso */}
        <div className="relative mt-10 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
          <EnsoCircle className="absolute inset-0 h-full w-full opacity-40" />
          <div className="flex flex-col items-center">
            <span className="font-[family-name:var(--font-serif-elegant)] text-3xl tracking-tight sm:text-4xl">
              {groomNick ?? "Pria"}
              <span className="mx-2 font-[family-name:var(--font-script)] text-2xl font-normal" style={{ color: ZEN.sage }}>
                &amp;
              </span>
              {brideNick ?? "Wanita"}
            </span>
            {eventDate && (
              <span className="mt-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: `${ZEN.ink}99` }}>
                {formatDate(eventDate)}
              </span>
            )}
          </div>
        </div>

        {/* Foto pasangan berdampingan (zen frame tipis) */}
        <div className="mt-10 flex items-center gap-3">
          {[groomPhoto, bridePhoto].map((photo, i) => (
            <div
              key={i}
              className="h-32 w-24 overflow-hidden border p-1 sm:h-40 sm:w-32"
              style={{ borderColor: `${ZEN.ink}26`, backgroundColor: ZEN.bg }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={i === 0 ? groomNick ?? "Mempelai" : brideNick ?? "Mempelai"} className="h-full w-full object-cover grayscale" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${ZEN.sage}26` }}>
                  <Heart className="h-8 w-8" style={{ color: ZEN.sage }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {guestName && (
          <div className="mt-10">
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: `${ZEN.ink}B3` }}>
              Kepada Yth.
            </p>
            <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl">{guestName}</p>
          </div>
        )}

        {!locked && <OpenHint />}
      </div>

      {/* Stempel hanko di bawah */}
      <div className="absolute bottom-6">
        <HankoSeal text="縁" subtext="Destiny" />
      </div>
    </header>
  );

  if (locked) {
    return (
      <ZenGate
        eventName={eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        eventDate={eventDate}
        guestName={guestName}
        tagline={tagline}
        onOpen={onOpen}
        backgroundUrl={bgUrl}
        photoUrl={gatePhoto}
      />
    );
  }

  return cover;
}

function OpenHint() {
  return (
    <div className="mt-10 flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: `${ZEN.ink}66` }}>
      <span>Scroll untuk membuka</span>
      <ArrowDown className="h-4 w-4 animate-bounce" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero asimetris (layout khas template zen)                           */
/* ------------------------------------------------------------------ */

function HeroSection({
  groomNick,
  brideNick,
  groomName,
  brideName,
  eventName,
  photo,
}: {
  groomNick?: string;
  brideNick?: string;
  groomName?: string;
  brideName?: string;
  eventName: string;
  customMessage?: string;
  photo?: string;
}) {
  return (
    <section className="relative flex min-h-[90svh] flex-col justify-between border-b px-6 py-12 md:px-16 md:py-20" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between">
        <div className="space-y-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: ZEN.sage }}>
            {eventName}
          </span>
        </div>
        <div
          className="hidden font-[family-name:var(--font-serif-elegant)] text-[11px] tracking-[0.4em] md:block"
          style={{ color: `${ZEN.ink}66`, writingMode: "vertical-rl" }}
        >
          和 敬 清 寂 — Harmoni &amp; Ketenangan
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 py-10 md:grid-cols-12">
        <div className="space-y-6 md:col-span-7">
          <div>
            <span className="mb-4 inline-block px-3 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: ZEN.beige, color: `${ZEN.ink}B3` }}>
              Undangan Pernikahan
            </span>
            <h1 className="font-[family-name:var(--font-serif-elegant)] text-5xl leading-[1.1] tracking-tight md:text-7xl">
              {groomNick ?? "Pria"}
              <br />
              <span className="font-[family-name:var(--font-script)] text-4xl font-light md:text-5xl" style={{ color: ZEN.sage }}>
                &amp;
              </span>{" "}
              {brideNick ?? "Wanita"}
            </h1>
          </div>
          {(groomName || brideName) && (
            <p className="max-w-md text-sm font-[family-name:var(--font-serif-elegant)] leading-relaxed opacity-70">
              {groomName ?? "-"} &amp; {brideName ?? "-"}
            </p>
          )}
          <div className="flex items-center gap-6 pt-2">
            <a
              href="#acara"
              className="border-b pb-1 text-xs uppercase tracking-[0.2em] transition-colors hover:opacity-70"
              style={{ borderColor: ZEN.ink }}
            >
              Lihat Detail Acara
            </a>
            <HankoSeal text="結" subtext="Union" />
          </div>
        </div>

        <div className="relative flex justify-center md:col-span-5 md:justify-end">
          <div className="relative w-full max-w-xs p-3 md:max-w-sm" style={{ border: `1px solid ${ZEN.ink}26`, backgroundColor: ZEN.bg }}>
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Mempelai" className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${ZEN.sage}26` }}>
                  <Heart className="h-12 w-12" style={{ color: ZEN.sage }} />
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute -bottom-8 -left-8 -z-10">
              <EnsoCircle className="h-40 w-40 opacity-30" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-end justify-between font-mono text-xs" style={{ color: `${ZEN.ink}66` }}>
        <span>01 / INTRO</span>
        <div className="flex items-center gap-2">
          <span>SCROLL DOWN</span>
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kutipan                                                             */
/* ------------------------------------------------------------------ */

function QuoteSection({
  text,
  source,
}: {
  text: string;
  source?: string;
}) {
  return (
    <section className="border-b px-6 py-20" style={{ borderColor: `${ZEN.ink}1A`, backgroundColor: `${ZEN.beige}80` }}>
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <HankoSeal text="愛" subtext="Love & Harmony" />
        <blockquote className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed opacity-80 md:text-xl">
          &ldquo;{text}&rdquo;
        </blockquote>
        <p className="text-xs uppercase tracking-[0.25em]" style={{ color: ZEN.sage }}>
          — {source?.trim() || new Date().getFullYear()}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Heading bersama                                                     */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-16 text-center">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.3em]" style={{ color: ZEN.sage }}>
        {eyebrow}
      </span>
      <h2 className="font-[family-name:var(--font-serif-elegant)] text-3xl md:text-4xl">{title}</h2>
      <div className="mx-auto mt-4 h-px w-12" style={{ backgroundColor: `${ZEN.sage}66` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai — kartu profil zen                                         */
/* ------------------------------------------------------------------ */

function Couple({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="Mempelai Pasangan" title="Mempelai" />
        <div className="grid grid-cols-1 items-stretch gap-12 md:grid-cols-2 md:gap-20">
          <PersonCard person={groom} role="The Groom" kanji="新郎" seal="凜" />
          <PersonCard person={bride} role="The Bride" kanji="新婦" seal="咲" />
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  kanji,
  seal,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  kanji: string;
  seal: string;
}) {
  return (
    <div className="relative flex flex-col justify-between space-y-6 p-8" style={{ border: `1px solid ${ZEN.ink}1A`, backgroundColor: ZEN.bg }}>
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: ZEN.red }}>
          {kanji} • {role}
        </div>
        <h3 className="font-[family-name:var(--font-serif-elegant)] text-2xl">{person?.name ?? "-"}</h3>
        {person?.parentName && (
          <p className="mb-4 mt-1 text-xs uppercase tracking-wider" style={{ color: ZEN.sage }}>
            Putra/Putri dari {person.parentName}
          </p>
        )}
        {person?.bio && (
          <p className="font-[family-name:var(--font-serif-elegant)] text-xs leading-relaxed opacity-70 md:text-sm">
            {person.bio}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between border-t pt-6 text-xs opacity-60" style={{ borderColor: `${ZEN.ink}1A` }}>
        <span>{person?.instagram ? `Instagram: ${person.instagram}` : ""}</span>
        <HankoSeal text={seal} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cerita — timeline zen                                               */
/* ------------------------------------------------------------------ */

function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Perjalanan Kisah" title="Kisah Kami" />
        <div className="relative ml-4 space-y-12 border-l pl-6 md:ml-12 md:pl-10" style={{ borderColor: `${ZEN.ink}26` }}>
          {story.map((item, i) => (
            <div key={item.id} className="relative">
              <span
                className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-4 md:-left-[47px]"
                style={{
                  backgroundColor: i === story.length - 1 ? ZEN.red : i % 2 === 0 ? ZEN.sage : ZEN.ink,
                  borderColor: ZEN.bg,
                }}
              />
              <span className="mb-1 block font-mono text-[11px]" style={{ color: i === story.length - 1 ? ZEN.red : ZEN.sage }}>
                {item.date ? formatDate(item.date) : "Momen"}
              </span>
              <h3 className="font-[family-name:var(--font-serif-elegant)] text-lg">{item.title ?? ""}</h3>
              {item.description && (
                <p className="mt-2 max-w-lg whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-xs leading-relaxed opacity-70 md:text-sm">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara utama + tambahan + countdown + gcal                           */
/* ------------------------------------------------------------------ */

function EventsSection({
  eventDate,
  eventTime,
  venueName,
  location,
  locationMap,
  events,
}: {
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  locationMap?: string;
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  // Entri "Akad" pada Rangkaian Acara digabung ke kartu Akad utama agar
  // tidak tampil dobel — detail dari entri akad yang menang (akadWins).
  const agenda = splitAgenda(
    events,
    {
      date: eventDate,
      time: eventTime,
      venue: [venueName, location].filter(Boolean).join(", ") || undefined,
      mapUrl: locationMap,
    },
    { akadWins: true },
  );
  return (
    <section id="acara" className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="Jadwal & Waktu" title="Rangkaian Acara" />

        {/* Countdown */}
        {eventDate && (
          <div className="mx-auto mb-16 max-w-xl border p-8 text-center" style={{ borderColor: `${ZEN.ink}1A`, backgroundColor: `${ZEN.beige}66` }}>
            <span className="mb-6 block text-[11px] uppercase tracking-[0.2em]" style={{ color: ZEN.sage }}>
              Hitung Mundur Hari Bahagia
            </span>
            <Countdown
              target={eventDate}
              valueClass="text-2xl md:text-3xl"
              labelClass="text-[9px]"
              boxClass=""
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <EventCard
            label="Sacred Ceremony"
            seal="儀"
            sealSub="Akad"
            title="Akad Nikah"
            date={agenda.main.date}
            time={agenda.main.time}
            venue={agenda.main.venue}
            mapUrl={agenda.main.mapUrl}
          />
          {agenda.additional.map((e, i) => (
            <EventCard
              key={e.id}
              label={i % 2 === 0 ? "Celebration" : "Gathering"}
              seal={i % 2 === 0 ? "宴" : "集"}
              sealSub={e.title ?? "Acara"}
              title={e.title ?? "Acara"}
              date={e.date}
              time={e.time}
              venue={e.location}
              mapUrl={e.locationMap}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({
  label,
  seal,
  sealSub,
  title,
  date,
  time,
  venue,
  mapUrl,
}: {
  label: string;
  seal: string;
  sealSub?: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
}) {
  return (
    <div className="flex flex-col justify-between space-y-6 p-8" style={{ border: `1px solid ${ZEN.ink}26`, backgroundColor: ZEN.bg }}>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: ZEN.red }}>
            {label}
          </span>
          <HankoSeal text={seal} subtext={sealSub} />
        </div>
        <h3 className="mb-2 font-[family-name:var(--font-serif-elegant)] text-2xl">{title}</h3>
        <div className="space-y-2 pt-2 font-[family-name:var(--font-serif-elegant)] text-xs opacity-80">
          {date && (
            <p className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: ZEN.sage }} /> {formatDate(date)}
            </p>
          )}
          {time && (
            <p className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: ZEN.sage }} /> {formatTime(time)}
            </p>
          )}
          {venue && (
            <p className="flex items-start gap-2 pt-1">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ZEN.sage }} /> {venue}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {date && (
          <SaveToCalendarButton
            title={title}
            date={date}
            time={time}
            location={venue}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest transition-colors"
          />
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest transition-colors"
            style={{ backgroundColor: ZEN.ink, color: ZEN.bg }}
          >
            <MapPin className="h-3.5 w-3.5" />
            Buka Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri grayscale → warna + lightbox                                 */
/* ------------------------------------------------------------------ */

function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Seni & Kenangan" title="Galeri Momen" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
          {gallery.slice(0, 5).map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.url)}
              className={`group relative cursor-pointer overflow-hidden ${i === 0 ? "md:col-span-8 aspect-[16/10]" : i === 1 ? "md:col-span-4 aspect-[3/4]" : "md:col-span-4 aspect-[4/5]"}`}
              style={{ border: `1px solid ${ZEN.ink}1A` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
                className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
              {item.caption && (
                <div className="absolute inset-0 flex items-end bg-black/20 p-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="font-[family-name:var(--font-serif-elegant)] text-xs tracking-widest text-white">
                    {item.caption}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-3xl p-2" style={{ backgroundColor: ZEN.bg }}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white transition-colors hover:opacity-70"
              aria-label="Tutup"
            >
              <X className="h-8 w-8" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected} alt="Foto diperbesar" className="max-h-[75vh] w-full object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP                                                                */
/* ------------------------------------------------------------------ */

function RsvpSection({
  invitationId,
  guestName,
}: {
  invitationId: string;
  guestName?: string;
}) {
  return (
    <section className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Konfirmasi Kehadiran" title="Formulir RSVP" />
        <p className="-mt-10 mb-12 text-center font-[family-name:var(--font-serif-elegant)] text-xs opacity-60">
          Kehadiran Anda adalah kebahagiaan dan kehormatan besar bagi kami.
        </p>
        <div className="p-8" style={{ border: `1px solid ${ZEN.ink}26`, backgroundColor: ZEN.bg }}>
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass="text-[#FAF8F5] bg-[#23211E] hover:bg-[#788A75]"
            borderClass="border-[#23211E]/20 bg-transparent focus:border-[#788A75]"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado digital                                                        */
/* ------------------------------------------------------------------ */

function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Tanda Kasih" title="Amplop Digital" />
        <p className="-mt-10 mx-auto mb-12 max-w-md text-center font-[family-name:var(--font-serif-elegant)] text-xs leading-relaxed opacity-60">
          Doa restu Anda merupakan hadiah terindah bagi kami. Namun jika ingin memberikan
          tanda kasih, Anda dapat menyalurkannya melalui:
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {gifts.map((g) => (
            <div key={g.id} className="space-y-4 p-6" style={{ border: `1px solid ${ZEN.ink}26`, backgroundColor: ZEN.bg }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest opacity-70">{g.provider}</span>
                <Landmark className="h-4 w-4" style={{ color: ZEN.sage }} />
              </div>
              <div>
                <span className="block text-xs opacity-60">Nomor Rekening</span>
                <span className="font-mono text-lg font-medium tracking-wider">{g.accountNumber}</span>
                {g.holderName && (
                  <span className="mt-0.5 block text-xs" style={{ color: ZEN.sage }}>
                    a.n. {g.holderName}
                  </span>
                )}
              </div>
              <CopyButton text={g.accountNumber} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ucapan & doa                                                        */
/* ------------------------------------------------------------------ */

function Wishes({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section className="border-b px-6 py-24 md:px-16" style={{ borderColor: `${ZEN.ink}1A` }}>
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Buku Tamu & Doa Restu" title="Kirim Doa Restu" />

        <div className="mb-12 space-y-6">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[#23211E]/10 bg-[#FAF8F5]"
            nameClass="text-[#23211E]"
            avatarClass="bg-[#788A75] text-[#FAF8F5]"
            emptyClass="opacity-50"
          />
        </div>

        <div className="space-y-6 border p-8" style={{ borderColor: `${ZEN.ink}26`, backgroundColor: `${ZEN.beige}4D` }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: ZEN.sage }}>
            <HankoSeal text="祝" subtext="Blessing" />
          </div>
          <WishForm
            invitationId={invitationId}
            accentClass="text-[#FAF8F5] bg-[#23211E] hover:bg-[#788A75]"
            borderClass="border-[#23211E]/15 bg-[#FAF8F5] focus:border-[#788A75]"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer charcoal                                                     */
/* ------------------------------------------------------------------ */

function Footer({
  groomName,
  brideName,
  groomNick,
  brideNick,
}: {
  groomName?: string;
  brideName?: string;
  groomNick?: string;
  brideNick?: string;
}) {
  return (
    <footer className="space-y-8 px-6 py-24 text-center" style={{ backgroundColor: ZEN.ink, color: ZEN.bg }}>
      <div className="mx-auto max-w-md space-y-4">
        <EnsoCircle className="mx-auto h-24 w-24 opacity-80" />
        <h2 className="font-[family-name:var(--font-serif-elegant)] text-3xl">
          {groomNick ?? "Pria"}
          <span className="mx-2 font-[family-name:var(--font-script)] text-2xl font-normal" style={{ color: ZEN.sage }}>
            &amp;
          </span>
          {brideNick ?? "Wanita"}
        </h2>
        <p className="font-[family-name:var(--font-serif-elegant)] text-xs italic leading-relaxed opacity-60">
          &ldquo;Terima kasih atas doa, harapan, dan kehadiran Anda yang melengkapi
          awal perjalanan keabadian kami.&rdquo;
        </p>
        {(groomName || brideName) && (
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">
            {groomName ?? ""} {brideName ? `& ${brideName}` : ""}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-xs border-t pt-8 font-mono text-[10px] uppercase tracking-[0.3em] opacity-40" style={{ borderColor: `${ZEN.bg}1A` }}>
        Japanese Zen Wedding • {new Date().getFullYear()}
      </div>
    </footer>
  );
}
