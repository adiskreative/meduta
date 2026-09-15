"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  Landmark,
  Leaf,
  Flower2,
  X,
  Copy,
  Check,
  ExternalLink,
  CalendarPlus,
} from "lucide-react";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import {
  formatDate,
  formatTime,
  type TemplateProps,
} from "./types";
import { getBackgroundUrl } from "@/lib/decoration";

/**
 * Botanical Garden — "Botanical Romantic"
 * Adopsi dari desain referensi (sage green + ivory, frame foto blob organik,
 * tekstur kertas), diubah total menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic, bukan osilator Web Audio)
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), bukan state lokal
 * - Background berlapis: pilihan user > admin (template) > bawaan
 * - Tanpa API eksternal apa pun (aman, tanpa kunci bocor)
 * Khas template ini: section COUNTDOWN hari-jam-menit-detik & tombol
 * "Simpan di Google Calendar" (dibangun dari data acara user).
 */

/* Palet botanical (konsisten dengan desain referensi) */
const C = {
  ink: "text-[#4A473F]",
  moss: "text-[#556B2F]",
  sage: "text-[#8A9A86]",
  muted: "text-[#8C7A6B]",
  soft: "text-[#705E52]",
  paper: "bg-[#FAF7F2]",
  linen: "bg-[#F4EFEA]",
  line: "border-[#E2DAD0]",
  ring: "focus:ring-[#8A9A86]",
} as const;

const ACCENT =
  "bg-[#556B2F] hover:bg-[#435523] text-[#FAF7F2] shadow-lg shadow-[#556B2F]/20";
const BORDER =
  "border-[#D0C6B8] bg-[#FAF7F2] focus:border-[#8A9A86] focus:ring-[#8A9A86]/30";

/* Frame blob organik (bahasa visual khas template ini) */
const BLOB_1 = "rounded-[58%_42%_65%_35%/52%_60%_40%_48%]";
const BLOB_2 = "rounded-[42%_58%_35%_65%/58%_36%_64%_42%]";

/* Tekstur kertas titik halus */
const PAPER_TEXTURE =
  "radial-gradient(rgba(138,154,134,0.16) 0.5px, transparent 0.5px)";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function BotanicalTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <BotanicalShell
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
/* Countdown                                                           */
/* ------------------------------------------------------------------ */

function useCountdown(target?: string) {
  const date = useMemo(() => {
    if (!target) return null;
    const d = new Date(target);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [target]);
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!date) return;
    const calc = () => {
      const diff = date.getTime() - Date.now();
      if (diff <= 0) return;
      setLeft({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor(diff / 3_600_000) % 24,
        minutes: Math.floor(diff / 60_000) % 60,
        seconds: Math.floor(diff / 1_000) % 60,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [date]);

  return left;
}

function Countdown({ target }: { target?: string }) {
  const t = useCountdown(target);
  const items = [
    { label: "Hari", value: t.days },
    { label: "Jam", value: t.hours },
    { label: "Menit", value: t.minutes },
    { label: "Detik", value: t.seconds },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-2xl border border-[#E2DAD0] bg-white/70 px-2 py-4 shadow-sm backdrop-blur-sm"
        >
          <span className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#556B2F] tabular-nums sm:text-4xl">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-[#8C7A6B] sm:text-xs">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Google Calendar link (dibangun dari data acara user)                */
/* ------------------------------------------------------------------ */

function googleCalendarUrl(opts: {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  details?: string;
}): string {
  // Tanggal user bisa "2026-12-12T08:00:00Z" atau format lain; fallback: all-day
  let start = "";
  try {
    const d = opts.date ? new Date(opts.date) : null;
    if (d && !Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      // Format UTC "YYYYMMDDTHHMMSSZ" (Google Calendar menerima UTC)
      start = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    }
  } catch {
    start = "";
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    ...(start
      ? { dates: `${start}/${start}` }
      : {}),
    ...(opts.location ? { location: opts.location } : {}),
    ...(opts.details ? { details: opts.details } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function SaveToCalendarButton({
  title,
  date,
  time,
  location,
}: {
  title: string;
  date?: string;
  time?: string;
  location?: string;
}) {
  const url = googleCalendarUrl({ title, date, time, location });
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-[#D0C6B8] bg-[#F4EFEA] px-5 py-2.5 text-xs font-medium text-[#556B2F] transition-colors hover:bg-[#E2DAD0]"
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      Simpan di Google Calendar
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function BotanicalShell({
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

  // Prioritas background: pilihan user > admin (template) > bawaan (botani)
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FAF7F2] font-[family-name:var(--font-sans)] text-[#4A473F]">
      {/* Tekstur kertas botanical di seluruh halaman */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: PAPER_TEXTURE }}
      />

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
      />

      {data.eventDate ? (
        <CountdownSection target={data.eventDate} />
      ) : null}

      {groom?.name || bride?.name ? (
        <Couple groom={groom} bride={bride} eventName={data.eventName ?? "Pernikahan"} />
      ) : null}

      <MainEvent
        eventDate={data.eventDate}
        eventTime={data.eventTime}
        venueName={data.venueName}
        location={data.location}
        locationMap={data.locationMap}
      />

      {events.length > 0 ? <AdditionalEvents events={events} /> : null}

      {story.length > 0 ? <StorySection story={story} /> : null}

      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      <RsvpSection
        invitationId={invitationId}
        guestName={guestName}
        accentClass={ACCENT}
        borderClass={BORDER}
      />

      {data.customMessage ? <MessageSection text={data.customMessage} /> : null}

      {data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="bg-[#8A9A86] text-white border border-white/40"
          playingIconClassName="h-5 w-5 animate-pulse"
          pausedIconClassName="h-5 w-5 opacity-70"
        />
      ) : null}

      <Wishes
        invitationId={invitationId}
        accentClass={ACCENT}
        borderClass={BORDER}
        wishes={wishes}
      />

      <Footer groomName={groom?.name} brideName={bride?.name} />
    </div>
  );
}

function DraftNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAF7F2] px-6 text-center text-[#4A473F]">
      <Leaf className="h-8 w-8 text-[#556B2F]" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-[#8C7A6B]">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang + Cover                                                     */
/* ------------------------------------------------------------------ */

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
}: {
  eventName: string;
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
    <header className="animate-fade-up relative flex min-h-[100svh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      {/* Latar: pilihan user > admin > bawaan (foto dedaunan) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgUrl || GATE_FALLBACK_BG})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,247,242,0.88),rgba(250,247,242,0.72)_45%,rgba(250,247,242,0.9))]" />

      {/* Daun melayang khas botanical */}
      <Leaf className="pointer-events-none absolute left-6 top-16 h-16 w-16 rotate-12 text-[#8A9A86]/25" />
      <Leaf className="pointer-events-none absolute bottom-24 right-8 h-20 w-20 -rotate-45 text-[#556B2F]/15" />
      <Flower2 className="pointer-events-none absolute right-10 top-24 h-12 w-12 rotate-12 text-[#8A9A86]/25" />

      <div className="relative z-10 flex flex-col items-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#556B2F]">
          <Leaf className="h-3.5 w-3.5" />
          Botanical Wedding
        </span>

        <p className="mt-8 font-[family-name:var(--font-serif-elegant)] italic text-2xl text-[#8C7A6B]">
          The Wedding of
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-5xl font-bold tracking-tight text-[#556B2F] sm:text-6xl">
          {groomNick ?? "Pria"}
          <span className="mx-3 font-[family-name:var(--font-script)] text-4xl font-normal text-[#8C7A6B] sm:text-5xl">
            &amp;
          </span>
          {brideNick ?? "Wanita"}
        </h1>
        {eventDate && (
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.3em] text-[#8C7A6B]">
            {formatDate(eventDate)}
          </p>
        )}

        {/* Pasangan foto blob ganda (foto user bila ada) */}
        <div className="relative mt-10 flex items-end justify-center">
          <div className={`relative z-0 h-40 w-32 -rotate-6 overflow-hidden border-2 border-white shadow-lg sm:h-48 sm:w-36 ${BLOB_2}`}>
            {bridePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bridePhoto} alt={brideNick ?? "Mempelai"} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-[#8A9A86]/20 ${BLOB_2}`}>
                <Heart className="h-10 w-10 text-[#8A9A86]" />
              </div>
            )}
          </div>
          <div className={`relative z-10 -ml-8 h-48 w-36 overflow-hidden border-2 border-white shadow-xl sm:h-56 sm:w-44 ${BLOB_1}`}>
            {groomPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={groomPhoto} alt={groomNick ?? "Mempelai"} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-[#556B2F]/15 ${BLOB_1}`}>
                <Heart className="h-12 w-12 text-[#556B2F]/60" />
              </div>
            )}
          </div>
        </div>

        {guestName && (
          <div className="mt-10 max-w-sm rounded-3xl border border-[#E2DAD0] bg-white/80 p-5 shadow-lg backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#8C7A6B]">
              Kepada Yth.
            </p>
            <p className="mt-1 font-[family-name:var(--font-script)] text-3xl text-[#556B2F]">
              {guestName}
            </p>
          </div>
        )}
      </div>
    </header>
  );

  if (locked) {
    return (
      <InvitationGate
        theme="botanical"
        eventName={eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        eventDate={eventDate}
        guestName={guestName}
        onOpen={onOpen}
        backgroundUrl={bgUrl}
      />
    );
  }

  return cover;
}

/* ------------------------------------------------------------------ */
/* Countdown section                                                   */
/* ------------------------------------------------------------------ */

function CountdownSection({ target }: { target: string }) {
  return (
    <section className="w-full border-y border-[#E2DAD0] bg-[#F4EFEA] px-6 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-[family-name:var(--font-serif-elegant)] italic text-lg text-[#8C7A6B]">
          Menghitung Hari Menuju Bahagia
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#556B2F]">
          Save The Date
        </h2>
        <div className="mt-8">
          <Countdown target={target} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Heading bersama                                                     */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8A9A86]">
        {eyebrow}
      </span>
      <h2 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#556B2F] sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden="true">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#8A9A86]/60" />
        <Leaf className="h-4 w-4 text-[#8A9A86]" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#8A9A86]/60" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai — foto blob                                                */
/* ------------------------------------------------------------------ */

function Couple({
  groom,
  bride,
  eventName,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
  eventName: string;
}) {
  return (
    <section className="w-full px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow={eventName} title="Pasangan Bahagia" />

        <div className="mt-12 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8">
          <PersonCard person={groom} role="Mempelai Pria" blob={BLOB_1} />
          <PersonCard person={bride} role="Mempelai Wanita" blob={BLOB_2} />
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  blob,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  blob: string;
}) {
  return (
    <div className="group flex flex-col items-center rounded-3xl border border-[#E2DAD0] bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      <div className={`h-44 w-36 overflow-hidden border-2 border-[#8A9A86] shadow-md transition-transform duration-300 group-hover:scale-[1.02] sm:h-48 sm:w-40 ${blob}`}>
        {person?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photoUrl} alt={person.name ?? role} className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-[#8A9A86]/15 ${blob}`}>
            <Heart className="h-12 w-12 text-[#8A9A86]" />
          </div>
        )}
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8C7A6B]">
        {role}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-[#556B2F]">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="mt-3 text-xs leading-relaxed text-[#705E52]">
          Putra/Putri dari
          <br />
          <span className="font-semibold text-[#4A473F]">{person.parentName}</span>
        </p>
      )}
      {person?.bio && (
        <p className="mt-3 border-t border-[#E2DAD0] pt-3 text-xs italic text-[#705E52]">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Acara utama + Google Calendar                                       */
/* ------------------------------------------------------------------ */

function MainEvent({
  eventDate,
  eventTime,
  venueName,
  location,
  locationMap,
}: {
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  locationMap?: string;
}) {
  return (
    <section className="w-full px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeading eyebrow="Akad & Resepsi" title="Rangkaian Momen" />

        <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-3">
          {eventDate && (
            <InfoCard icon={<CalendarDays className="h-5 w-5" />} label={formatDate(eventDate)} />
          )}
          {eventTime && (
            <InfoCard icon={<Clock className="h-5 w-5" />} label={formatTime(eventTime)} />
          )}
          {(venueName || location) && (
            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              label={[venueName, location].filter(Boolean).join(", ")}
            />
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {eventDate && (
            <SaveToCalendarButton
              title="Pernikahan Kami"
              date={eventDate}
              time={eventTime}
              location={[venueName, location].filter(Boolean).join(", ")}
            />
          )}
          {locationMap && (
            <a
              href={locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ACCENT} inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold transition`}
            >
              <MapPin className="h-4 w-4" />
              Lihat Lokasi di Peta
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E2DAD0] bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#8A9A86] hover:shadow-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8A9A86]/15 text-[#556B2F]">
        {icon}
      </span>
      <span className="text-sm font-medium leading-snug text-[#4A473F]">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Acara tambahan + tombol kalender per acara                          */
/* ------------------------------------------------------------------ */

function AdditionalEvents({
  events,
}: {
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  return (
    <section className="w-full px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Agenda" title="Rangkaian Acara" />

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {events.map((e, i) => (
            <div
              key={e.id}
              className="group flex flex-col items-center rounded-3xl border border-[#E2DAD0] bg-white/70 p-7 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8A9A86] hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8A9A86]/15 text-[#556B2F]">
                {i % 2 === 0 ? <Flower2 className="h-6 w-6" /> : <Leaf className="h-6 w-6" />}
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-[#556B2F]">
                {e.title ?? "Acara"}
              </h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-[#8C7A6B]">
                {formatDate(e.date)}
              </p>
              <div className="mt-4 space-y-2 text-sm text-[#705E52]">
                {e.time && (
                  <p className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-[#8A9A86]" /> {formatTime(e.time)}
                  </p>
                )}
                {e.location && (
                  <p className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4 text-[#8A9A86]" /> {e.location}
                  </p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <SaveToCalendarButton
                  title={e.title ?? "Acara Pernikahan"}
                  date={e.date}
                  time={e.time}
                  location={e.location}
                />
                {e.locationMap && (
                  <a
                    href={e.locationMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-[#D0C6B8] px-4 py-2.5 text-xs font-medium text-[#556B2F] transition hover:bg-[#F4EFEA]"
                  >
                    Lihat Lokasi <ExternalLink className="h-3 w-3" />
                  </a>
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
/* Cerita — timeline dengan tahun di gutter (dari desain referensi)    */
/* ------------------------------------------------------------------ */

function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section className="w-full border-y border-[#E2DAD0] bg-[#F4EFEA] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Kisah Kami" title="Perjalanan Cinta" />

        <div className="relative ml-4 mt-12 space-y-10 border-l-2 border-[#8A9A86]/40 sm:ml-24">
          {story.map((item, index) => (
            <div key={item.id} className="relative pl-8">
              {/* Marker daun di garis timeline */}
              <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#556B2F] bg-white text-[#556B2F] shadow-sm">
                <Leaf className="h-4 w-4" />
              </span>
              {/* Tahun di gutter kiri (desktop) */}
              <span className="mb-1 block font-[family-name:var(--font-serif-elegant)] text-base font-bold text-[#556B2F] sm:absolute sm:-left-24 sm:mb-0 sm:w-20 sm:text-right">
                {item.date ? formatDate(item.date).split(" ").slice(-1)[0] : "Momen"}
              </span>
              <div className="rounded-2xl border border-[#E2DAD0] bg-[#FAF7F2] p-6 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-[#4A473F]">
                    {item.title ?? ""}
                  </h3>
                  <span className="rounded-full bg-[#8A9A86]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#556B2F]">
                    {item.date ? formatDate(item.date) : "Momen"}
                  </span>
                </div>
                {item.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#705E52]">
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
/* Galeri + lightbox                                                   */
/* ------------------------------------------------------------------ */

function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="w-full px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Galeri Foto" title="Momen Berharga" />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.url)}
              className="group cursor-pointer rounded-2xl border border-[#E2DAD0] bg-white/70 p-3 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? "Foto galeri"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {item.caption && (
                <p className="mt-3 text-center font-[family-name:var(--font-serif-elegant)] italic text-[#8C7A6B]">
                  {item.caption}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white transition-colors hover:text-[#8A9A86]"
              aria-label="Tutup"
            >
              <X className="h-8 w-8" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected}
              alt="Foto diperbesar"
              className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado                                                                */
/* ------------------------------------------------------------------ */

function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="w-full border-y border-[#E2DAD0] bg-[#F4EFEA] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Tanda Kasih" title="Kado Digital" />
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-[#705E52]">
          Doa restu Anda adalah hadiah terbaik. Jika ingin memberi tanda kasih,
          Anda dapat mengirimkannya melalui rekening berikut.
        </p>

        <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
          {gifts.map((g) => (
            <div
              key={g.id}
              className="flex flex-col items-center rounded-2xl border border-[#E2DAD0] bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#8A9A86] hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8A9A86]/15 text-[#556B2F]">
                <Landmark className="h-5 w-5" />
              </span>
              <p className="mt-3 font-[family-name:var(--font-serif-elegant)] text-lg font-bold text-[#556B2F]">
                {g.provider}
              </p>
              {g.name && <p className="text-xs text-[#8C7A6B]">{g.name}</p>}
              <div className="mt-3 rounded-xl border border-[#E2DAD0] bg-[#F4EFEA] px-4 py-2 font-mono text-sm font-bold tracking-wider text-[#4A473F]">
                {g.accountNumber}
              </div>
              {g.holderName && <p className="mt-2 text-xs text-[#705E52]">a.n. {g.holderName}</p>}
              <div className="mt-4 w-full">
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
/* RSVP / Pesan / Ucapan                                               */
/* ------------------------------------------------------------------ */

function RsvpSection({
  invitationId,
  guestName,
  accentClass,
  borderClass,
}: {
  invitationId: string;
  guestName?: string;
  accentClass: string;
  borderClass: string;
}) {
  return (
    <section id="rsvp" className="w-full px-6 py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading eyebrow="Kehadiran" title="Konfirmasi Kehadiran" />
        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-[#705E52]">
          Mohon konfirmasi kehadiran Anda agar kami dapat menyiapkan segala sesuatunya.
        </p>
        <div className="mt-8 rounded-3xl border border-[#E2DAD0] bg-white/70 p-7 text-left shadow-sm backdrop-blur-sm">
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass={accentClass}
            borderClass={borderClass}
          />
        </div>
      </div>
    </section>
  );
}

function MessageSection({ text }: { text: string }) {
  return (
    <section className="w-full px-6 py-20 text-center">
      <SectionHeading eyebrow="Ucapan & Doa" title="Pesana Kami" />
      <div className="mx-auto mt-6 max-w-lg rounded-3xl border border-[#E2DAD0] bg-white/70 p-8 shadow-sm backdrop-blur-sm">
        <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg leading-relaxed text-[#4A473F]">
          {text}
        </p>
      </div>
    </section>
  );
}

function Wishes({
  invitationId,
  accentClass,
  borderClass,
  wishes,
}: {
  invitationId: string;
  accentClass: string;
  borderClass: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section id="ucapan" className="w-full px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading eyebrow="Wedding Wall" title="Kirim Ucapan & Doa" />

        <div className="mt-10">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[#E2DAD0] bg-white/70"
            nameClass="text-[#556B2F]"
            avatarClass="bg-[#8A9A86] text-white"
            emptyClass="text-[#B9AE9F]"
          />
        </div>

        <div className="mt-10 rounded-3xl border border-[#E2DAD0] bg-white/70 p-7 text-left shadow-sm backdrop-blur-sm">
          <WishForm invitationId={invitationId} accentClass={accentClass} borderClass={borderClass} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

const GATE_FALLBACK_BG =
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&q=80";

function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="relative w-full overflow-hidden bg-[#6B705C] px-6 py-16 text-center text-[#FAF7F2]">
      {/* Tekstur titik ivory halus di footer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(rgba(250,247,242,0.14) 0.5px, transparent 0.5px)" }}
      />
      <div className="relative">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Leaf className="h-6 w-6" />
        </span>

        <h2 className="mt-4 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold italic sm:text-4xl">
          Terima Kasih
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#E2DAD0]">
          Kehadiran dan doa tulus Anda adalah kado terindah bagi pernikahan kami.
        </p>

        <p className="mt-6 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold tracking-tight">
          {groomName ?? "Pria"}
          <span className="mx-2 font-[family-name:var(--font-script)] font-normal text-[#E2DAD0]">
            &amp;
          </span>
          {brideName ?? "Wanita"}
        </p>

        <p className="mt-10 border-t border-white/15 pt-6 text-[10px] uppercase tracking-[0.3em] text-[#D0C6B8]">
          © {new Date().getFullYear()} MEDUTA
        </p>
      </div>
    </footer>
  );
}
