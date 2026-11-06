"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  AtSign,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Quote,
  X,
} from "lucide-react";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { SaveToCalendarButton, useCountdown } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import type { GalleryItem } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Modern Minimal — "Edition No. 01"
 * Tata letak editorial minimalis: kertas hangat (paper), tinta hampir hitam,
 * garis rambut, ruang kosong lega, dan tipografi serif besar. Semua konten
 * data-driven mengikuti arsitektur Meduta:
 * - Data mempelai, cerita, acara, galeri, kado, kutipan, & pesan dari user
 * - Musik latar user (BackgroundMusic)
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm)
 * - Background berlapis: pilihan user > admin (dekorasi) > bawaan template
 * Khas template ini: cover foto grayscale, monogram, penomoran section,
 * countdown garis tipis, galeri mosaik, dan lightbox.
 */

/* Palet modern minimal (paper hangat + tinta + aksen bronze redup) */
const MM = {
  paper: "#F6F4EF",
  paperSoft: "#FBFAF7",
  ink: "#171613",
  inkSoft: "#3F3C35",
  muted: "#74716A",
  line: "#DDD8CE",
  accent: "#8C7A5E",
} as const;

/* Kelas form bersama agar input/RSVP/ucapan senada dengan tema */
const ACCENT = "bg-[#171613] hover:bg-[#3F3C35]";
const BORDER =
  "border-[#DDD8CE] bg-white focus:border-[#171613] focus:ring-[#E7E2D8]";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1400&q=70";

/* CSS lokal: reveal-on-scroll (kelas mengandung "-reveal" agar mode
   thumbnail ?shot=1 memaksa konten terlihat tanpa IntersectionObserver). */
const MM_CSS = `
  .mm-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .mm-reveal.mm-visible {
    opacity: 1;
    transform: translateY(0);
  }
  /* Mode embed (thumbnail live): semua konten langsung terlihat */
  .mm-embed .mm-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .mm-reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
`;

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };
type Person = NonNullable<TemplateProps["data"]["groom"]>;
type StoryList = NonNullable<TemplateProps["data"]["story"]>;
type GalleryList = NonNullable<TemplateProps["data"]["gallery"]>;
type GiftList = NonNullable<TemplateProps["data"]["gifts"]>;

export default function MinimalTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(
    isEmbed ? undefined : props.data.musicUrl,
    props.data.musicStart,
    props.data.musicEnd,
  );
  return (
    <MinimalShell
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

function MinimalShell({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
  decorations,
  embedded,
  gateOpen = true,
  onGateOpen,
  music,
}: TemplateProps & GateProps & { music?: MusicController }) {
  useReveal();

  if (!isPublished) return <DraftNotice />;

  const groom = data.groom;
  const bride = data.bride;
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  // Info acara utama + rangkaian acara (entri "Akad" digabung, tidak dobel)
  const agenda = splitAgenda(data.events, {
    date: data.eventDate,
    time: data.eventTime,
    venue: data.venueName,
    mapUrl: data.locationMap,
  });
  const date = dateParts(agenda.main.date ?? data.eventDate);
  const mapUrl = agenda.main.mapUrl || data.locationMap;
  const showQuote = !data.quoteHidden && !!data.quoteText?.trim();

  // Prioritas background: pilihan user > admin (template) > bawaan template
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  // Prioritas foto gerbang: user > admin (dekorasi) > mempelai > galeri[0]
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: groom?.photoUrl,
    bridePhotoUrl: bride?.photoUrl,
    firstGalleryUrl: gallery[0]?.url,
  });

  const groomNick = groom?.nickname ?? groom?.name;
  const brideNick = bride?.nickname ?? bride?.name;

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden ${embedded ? "mm-embed" : ""}`}
      style={{
        backgroundColor: MM.paper,
        color: MM.ink,
        fontFamily: "Inter, var(--font-sans), sans-serif",
      }}
    >
      <style>{MM_CSS}</style>

      <div className="relative z-10">
        <Cover
          eventName={data.eventName ?? "The Wedding"}
          groomNick={groomNick}
          brideNick={brideNick}
          eventDate={data.eventDate}
          guestName={guestName}
          locked={!gateOpen}
          onOpen={onGateOpen}
          bgUrl={bgUrl}
          gatePhoto={gatePhoto}
        />

        {gateOpen && (
          <main>
            <IntroSection
              groomInitial={initialOf(groomNick)}
              brideInitial={initialOf(brideNick)}
              customMessage={data.customMessage}
              date={data.eventDate}
              venueName={data.venueName}
            />

            {showQuote ? (
              <QuoteSection
                text={data.quoteText?.trim() ?? ""}
                source={data.quoteSource || data.quoteTitle}
              />
            ) : null}

            {groom?.name || bride?.name ? <CoupleSection groom={groom} bride={bride} /> : null}

            {story.length > 0 ? <StorySection story={story} /> : null}

            <EventsSection
              date={date}
              eventDate={agenda.main.date ?? data.eventDate}
              time={agenda.main.time || data.eventTime}
              venue={agenda.main.venue || data.venueName}
              location={data.location}
              mapUrl={mapUrl}
              additional={agenda.additional}
              coupleTitle={`${groomNick ?? "Pria"} & ${brideNick ?? "Wanita"}`}
              eventTitle={data.eventName ?? "Undangan Pernikahan"}
            />

            {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

            <RsvpSection invitationId={invitationId} guestName={guestName} />

            {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

            <WishesSection invitationId={invitationId} wishes={wishes} />

            <Footer groomNick={groomNick} brideNick={brideNick} />
          </main>
        )}
      </div>

      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="border border-white/15 bg-[#171613] text-[#F6F4EF] shadow-xl shadow-black/25"
          playingIconClassName="h-4 w-4 animate-pulse"
          pausedIconClassName="h-4 w-4 opacity-50"
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Utilitas                                                            */
/* ------------------------------------------------------------------ */

function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = document.querySelectorAll(".mm-reveal:not(.mm-visible)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("mm-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  });
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mm-reveal ${className}`}>{children}</div>;
}

function initialOf(name?: string) {
  return (name ?? "?").trim().charAt(0).toUpperCase();
}

function dateParts(date?: string) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(value),
    month: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(value),
    year: new Intl.DateTimeFormat("id-ID", { year: "numeric" }).format(value),
    weekday: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(value),
  };
}

function instagramHandle(value?: string) {
  if (!value) return "";
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/$/, "");
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: MM.paper, color: MM.ink }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full border font-[family-name:var(--font-display)] text-lg"
        style={{ borderColor: MM.line, color: MM.accent }}
      >
        M
      </span>
      <p className="mt-2 text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="max-w-xs text-sm leading-relaxed" style={{ color: MM.muted }}>
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cover + gerbang                                                     */
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
  gatePhoto,
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  locked?: boolean;
  onOpen?: () => void;
  bgUrl?: string;
  gatePhoto?: string;
}) {
  if (locked) {
    return (
      <InvitationGate
        theme="minimal"
        eventName={eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        eventDate={eventDate}
        guestName={guestName}
        onOpen={onOpen}
        backgroundUrl={bgUrl}
        photoUrl={gatePhoto}
      />
    );
  }

  const year = dateParts(eventDate)?.year;

  return (
    <header className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#14130F] text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgUrl || DEFAULT_COVER}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-65 grayscale"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/30 to-black/85" />
      <div className="pointer-events-none absolute inset-4 border border-white/15 sm:inset-6" />

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-7 pb-9 pt-8 sm:px-12 sm:pb-12 sm:pt-10">
        <div className="animate-fade-up flex items-start justify-between gap-6 text-[9px] uppercase leading-relaxed tracking-[0.32em] text-white/65">
          <span className="max-w-[62%]">{eventName}</span>
          <span className="shrink-0">{year ?? "The Wedding"}</span>
        </div>

        <div className="my-auto py-14">
          <h1 className="animate-fade-up-delay-1">
            <span className="block break-words font-[family-name:var(--font-display)] text-[clamp(2.8rem,14vw,4.4rem)] font-light leading-[0.92] tracking-[-0.02em]">
              {groomNick ?? "Pria"}
            </span>
            <span className="animate-fade-up-delay-2 my-4 flex items-center gap-4 text-[#CFC3AD]">
              <span className="h-px w-12 bg-current opacity-50" />
              <span className="font-[family-name:var(--font-serif-elegant)] text-2xl italic leading-none">
                &amp;
              </span>
            </span>
            <span className="animate-fade-up-delay-2 block break-words pl-10 font-[family-name:var(--font-display)] text-[clamp(2.8rem,14vw,4.4rem)] font-light leading-[0.92] tracking-[-0.02em]">
              {brideNick ?? "Wanita"}
            </span>
          </h1>

          {eventDate ? (
            <p className="animate-fade-up-delay-3 mt-9 max-w-[16rem] text-[10px] uppercase leading-loose tracking-[0.28em] text-white/70">
              {formatDate(eventDate)}
            </p>
          ) : null}
        </div>

        <div className="animate-fade-up-delay-4 flex items-end justify-between gap-6 border-t border-white/25 pt-5">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/50">
              Kepada Yth.
            </p>
            <p className="mt-1 truncate font-[family-name:var(--font-display)] text-xl font-light">
              {guestName || "Tamu Undangan"}
            </p>
          </div>
          <span className="flex shrink-0 flex-col items-center gap-1.5 text-[8px] uppercase tracking-[0.3em] text-white/45">
            <span>Scroll</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          </span>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Section dasar                                                       */
/* ------------------------------------------------------------------ */

function Section({
  id,
  first = false,
  children,
}: {
  id?: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`px-6 sm:px-8 ${first ? "" : "border-t"}`}
      style={{ borderColor: MM.line }}
    >
      <div className="mx-auto w-full max-w-xl py-16 sm:py-20">{children}</div>
    </section>
  );
}

function SectionHead({
  index,
  label,
  title,
}: {
  index: string;
  label: string;
  title: string;
}) {
  return (
    <div
      className="mb-8 flex items-end justify-between gap-6 border-b pb-5"
      style={{ borderColor: MM.line }}
    >
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.34em]"
          style={{ color: MM.accent }}
        >
          {index} / {label}
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[2rem] font-light leading-none tracking-tight sm:text-[2.4rem]">
          {title}
        </h2>
      </div>
      <span
        aria-hidden
        className="mb-1 hidden h-px w-14 sm:block"
        style={{ backgroundColor: MM.line }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pembuka + kutipan                                                   */
/* ------------------------------------------------------------------ */

function IntroSection({
  groomInitial,
  brideInitial,
  customMessage,
  date,
  venueName,
}: {
  groomInitial: string;
  brideInitial: string;
  customMessage?: string;
  date?: string;
  venueName?: string;
}) {
  const parts = dateParts(date);
  return (
    <Section first>
      <Reveal className="text-center">
        <p
          className="text-[9px] uppercase tracking-[0.42em]"
          style={{ color: MM.accent }}
        >
          The Invitation
        </p>

        <div
          className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full border"
          style={{ borderColor: MM.line }}
        >
          <span className="font-[family-name:var(--font-display)] text-lg tracking-[0.08em]">
            {groomInitial}
            <span className="mx-1 font-[family-name:var(--font-serif-elegant)] italic" style={{ color: MM.accent }}>
              &amp;
            </span>
            {brideInitial}
          </span>
        </div>

        {customMessage ? (
          <p
            className="mx-auto mt-8 max-w-md font-[family-name:var(--font-serif-elegant)] text-[1.45rem] font-light leading-relaxed"
            style={{ color: MM.inkSoft }}
          >
            {customMessage}
          </p>
        ) : null}

        {parts ? (
          <p
            className="mx-auto mt-8 max-w-xs text-[10px] uppercase leading-loose tracking-[0.3em]"
            style={{ color: MM.muted }}
          >
            {parts.weekday}, {parts.day} {parts.month} {parts.year}
            {venueName ? ` — ${venueName}` : ""}
          </p>
        ) : null}
      </Reveal>
    </Section>
  );
}

function QuoteSection({ text, source }: { text: string; source?: string }) {
  return (
    <Section>
      <Reveal className="text-center">
        <Quote className="mx-auto h-5 w-5" style={{ color: MM.accent }} />
        <p
          className="mx-auto mt-5 max-w-lg whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-[1.35rem] font-light italic leading-relaxed"
          style={{ color: MM.inkSoft }}
        >
          {text}
        </p>
        {source ? (
          <p
            className="mt-6 text-[9px] uppercase tracking-[0.32em]"
            style={{ color: MM.muted }}
          >
            {source}
          </p>
        ) : null}
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai                                                            */
/* ------------------------------------------------------------------ */

function CoupleSection({ groom, bride }: { groom?: Person; bride?: Person }) {
  return (
    <Section>
      <SectionHead index="01" label="The Couple" title="Mempelai" />
      <Reveal>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <PersonCard person={groom} role="The Groom" relation="Putra dari" />
          <PersonCard person={bride} role="The Bride" relation="Putri dari" />
        </div>
        <p
          className="mx-auto mt-10 max-w-sm text-center font-[family-name:var(--font-serif-elegant)] text-sm italic leading-relaxed"
          style={{ color: MM.muted }}
        >
          Dengan penuh sukacita, kami mengundang Anda untuk menjadi bagian dari
          hari bahagia kami.
        </p>
      </Reveal>
    </Section>
  );
}

function PersonCard({
  person,
  role,
  relation,
}: {
  person?: Person;
  role: string;
  relation: string;
}) {
  const name = person?.name ?? person?.nickname;
  const nickname =
    person?.nickname && person.name && person.nickname !== person.name
      ? person.nickname
      : undefined;
  const instagram = instagramHandle(person?.instagram);

  return (
    <figure className="group">
      <div
        className="relative aspect-[3/4] w-full overflow-hidden"
        style={{ backgroundColor: "#E9E4DA" }}
      >
        {person?.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={person.photoUrl}
            alt={name ?? role}
            className="h-full w-full object-cover grayscale-[45%] transition-all duration-700 group-hover:scale-[1.04] group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-[family-name:var(--font-display)] text-5xl font-light"
              style={{ color: "#C2B9A9" }}
            >
              {initialOf(name)}
            </span>
          </div>
        )}
      </div>

      <figcaption className="mt-4">
        <p
          className="text-[8px] uppercase tracking-[0.3em]"
          style={{ color: MM.accent }}
        >
          {role}
        </p>
        <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-light leading-tight">
          {name ?? "-"}
        </p>
        {nickname ? (
          <p
            className="mt-0.5 font-[family-name:var(--font-serif-elegant)] text-sm italic"
            style={{ color: MM.muted }}
          >
            — {nickname}
          </p>
        ) : null}
        {person?.parentName ? (
          <p className="mt-2 text-[10px] leading-relaxed" style={{ color: MM.muted }}>
            {relation} {person.parentName}
          </p>
        ) : null}
        {instagram ? (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[10px] tracking-wide transition-opacity hover:opacity-60"
            style={{ color: MM.inkSoft }}
          >
            <AtSign className="h-3 w-3" />
            {instagram}
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Cerita                                                              */
/* ------------------------------------------------------------------ */

function StorySection({ story }: { story: StoryList }) {
  return (
    <Section>
      <SectionHead index="02" label="Our Story" title="Cerita Kami" />
      <Reveal>
        <ol>
          {story.map((item, index) => (
            <li
              key={item.id}
              className={index === 0 ? "" : "mt-7 border-t pt-7"}
              style={index === 0 ? undefined : { borderColor: MM.line }}
            >
              <div className="flex gap-5">
                <span
                  className="mt-0.5 shrink-0 font-[family-name:var(--font-serif-elegant)] text-sm italic tabular-nums"
                  style={{ color: MM.accent }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  {item.date ? (
                    <p
                      className="text-[9px] uppercase tracking-[0.28em]"
                      style={{ color: MM.muted }}
                    >
                      {formatDate(item.date)}
                    </p>
                  ) : null}
                  {item.title ? (
                    <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-light">
                      {item.title}
                    </h3>
                  ) : null}
                  {item.description ? (
                    <p
                      className="mt-2 whitespace-pre-line text-sm leading-relaxed"
                      style={{ color: MM.muted }}
                    >
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara + countdown                                                   */
/* ------------------------------------------------------------------ */

function EventsSection({
  date,
  eventDate,
  time,
  venue,
  location,
  mapUrl,
  additional,
  coupleTitle,
  eventTitle,
}: {
  date: ReturnType<typeof dateParts>;
  eventDate?: string;
  time?: string;
  venue?: string;
  location?: string;
  mapUrl?: string;
  additional: NonNullable<TemplateProps["data"]["events"]>;
  coupleTitle: string;
  eventTitle: string;
}) {
  return (
    <Section>
      <SectionHead index="03" label="The Celebration" title="Save the Date" />
      <Reveal>
        {date ? (
          <div className="flex items-end justify-between gap-6">
            <span className="font-[family-name:var(--font-display)] text-[5rem] font-light leading-[0.72] tracking-tight sm:text-[6rem]">
              {date.day}
            </span>
            <div className="pb-1 text-right">
              <p className="text-[10px] uppercase tracking-[0.3em]">{date.weekday}</p>
              <p className="font-[family-name:var(--font-serif-elegant)] text-xl italic">
                {date.month} {date.year}
              </p>
              {time ? (
                <p
                  className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: MM.muted }}
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(time)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {eventDate ? (
          <div className="mt-8">
            <EventCountdown target={eventDate} />
          </div>
        ) : null}

        {venue || location ? (
          <div className="mt-8">
            <p
              className="text-[9px] uppercase tracking-[0.3em]"
              style={{ color: MM.accent }}
            >
              Venue
            </p>
            {venue ? (
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-light">
                {venue}
              </p>
            ) : null}
            {location ? (
              <p
                className="mt-1.5 flex gap-2 text-sm leading-relaxed"
                style={{ color: MM.muted }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{location}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-2.5">
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#171613] px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-[#F6F4EF] transition hover:bg-[#3F3C35]"
            >
              Lihat Peta
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {venue ? (
            <SaveToCalendarButton
              title={`${eventTitle} — ${coupleTitle}`}
              date={eventDate}
              time={time}
              location={[venue, location].filter(Boolean).join(", ")}
              className="inline-flex items-center gap-2 border border-[#DDD8CE] px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-[#171613] transition hover:bg-white"
            />
          ) : null}
        </div>

        {additional.length > 0 ? (
          <div className="mt-10">
            <p
              className="text-[9px] uppercase tracking-[0.3em]"
              style={{ color: MM.accent }}
            >
              Rangkaian Acara
            </p>
            <div className="mt-4">
              {additional.map((event) => (
                <article
                  key={event.id}
                  className="border-t py-5 first:border-t-0 first:pt-0"
                  style={{ borderColor: MM.line }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-light">
                      {event.title ?? "Acara"}
                    </h3>
                    {event.date ? (
                      <span
                        className="shrink-0 text-right text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: MM.muted }}
                      >
                        {formatDate(event.date)}
                      </span>
                    ) : null}
                  </div>
                  {event.time ? (
                    <p className="mt-1 text-sm" style={{ color: MM.muted }}>
                      {formatTime(event.time)}
                    </p>
                  ) : null}
                  {event.location ? (
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: MM.muted }}>
                      {event.location}
                    </p>
                  ) : null}
                  {event.locationMap ? (
                    <a
                      href={event.locationMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
                      style={{ color: MM.inkSoft }}
                    >
                      Lihat Lokasi
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Reveal>
    </Section>
  );
}

function EventCountdown({ target }: { target: string }) {
  const left = useCountdown(target);
  const items = [
    { label: "Hari", value: left.days },
    { label: "Jam", value: left.hours },
    { label: "Menit", value: left.minutes },
    { label: "Detik", value: left.seconds },
  ];
  return (
    <div
      className="grid grid-cols-4 border-y"
      style={{ borderColor: MM.line }}
      aria-label="Hitung mundur acara"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`flex flex-col items-center py-5 ${index > 0 ? "border-l" : ""}`}
          style={index > 0 ? { borderColor: MM.line } : undefined}
        >
          <span className="font-[family-name:var(--font-serif-elegant)] text-2xl font-light tabular-nums sm:text-3xl">
            {String(item.value).padStart(2, "0")}
          </span>
          <span
            className="mt-1 text-[8px] uppercase tracking-[0.24em]"
            style={{ color: MM.muted }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri + lightbox                                                   */
/* ------------------------------------------------------------------ */

function GallerySection({ gallery }: { gallery: GalleryList }) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight") {
        setSelected((current) => (current === null ? current : (current + 1) % gallery.length));
      }
      if (event.key === "ArrowLeft") {
        setSelected((current) =>
          current === null ? current : (current - 1 + gallery.length) % gallery.length,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, gallery.length]);

  const [first, ...rest] = gallery;
  const current = selected === null ? null : gallery[selected];

  return (
    <Section>
      <SectionHead index="04" label="Moments" title="Galeri" />
      <Reveal>
        <div className="space-y-2.5">
          {first ? (
            <GalleryFigure
              item={first}
              hero
              onOpen={() => setSelected(0)}
            />
          ) : null}

          {rest.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {rest.map((item, index) => (
                <GalleryFigure
                  key={item.id}
                  item={item}
                  wide={rest.length % 2 === 1 && index === rest.length - 1}
                  onOpen={() => setSelected(index + 1)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Reveal>

      {current ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D0C0A]/95 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Foto galeri"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Tutup"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>

          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Foto sebelumnya"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected((value) =>
                    value === null ? value : (value - 1 + gallery.length) % gallery.length,
                  );
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Foto berikutnya"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected((value) =>
                    value === null ? value : (value + 1) % gallery.length,
                  );
                }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <figure
            className="flex max-h-[82vh] max-w-3xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.caption ?? "Foto galeri"}
              className="max-h-[74vh] w-auto max-w-full object-contain"
            />
            {current.caption ? (
              <figcaption className="mt-4 text-center text-[9px] uppercase tracking-[0.28em] text-white/60">
                {current.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </Section>
  );
}

function GalleryFigure({
  item,
  onOpen,
  hero = false,
  wide = false,
}: {
  item: GalleryItem;
  onOpen: () => void;
  hero?: boolean;
  wide?: boolean;
}) {
  return (
    <figure className={wide ? "col-span-2" : ""}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={item.caption ? `Perbesar foto: ${item.caption}` : "Perbesar foto"}
        className={`group relative block w-full cursor-pointer overflow-hidden ${
          hero ? "aspect-[16/10]" : wide ? "aspect-[16/9]" : "aspect-square"
        }`}
        style={{ backgroundColor: "#E9E4DA" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption ?? "Foto galeri"}
          className="h-full w-full object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
        />
        <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[#171613] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </button>
      {item.caption ? (
        <figcaption
          className="mt-2 text-[9px] uppercase tracking-[0.24em]"
          style={{ color: MM.muted }}
        >
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
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
    <Section>
      <SectionHead index="05" label="RSVP" title="Konfirmasi Kehadiran" />
      <Reveal>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: MM.muted }}>
          Kehadiran dan doa restu Anda adalah kebahagiaan besar bagi kami.
        </p>
        <div
          className="border p-6 sm:p-8"
          style={{ borderColor: MM.line, backgroundColor: MM.paperSoft }}
        >
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass={ACCENT}
            borderClass={BORDER}
          />
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado                                                                */
/* ------------------------------------------------------------------ */

function GiftsSection({ gifts }: { gifts: GiftList }) {
  return (
    <Section>
      <SectionHead index="06" label="Wedding Gift" title="Tanda Kasih" />
      <Reveal>
        <p className="mb-2 text-sm leading-relaxed" style={{ color: MM.muted }}>
          Doa restu Anda adalah hadiah terindah. Bila ingin memberikan tanda
          kasih, Anda dapat menyalurkannya melalui:
        </p>
        <div>
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="border-t py-5 first:border-t-0"
              style={{ borderColor: MM.line }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className="text-[9px] uppercase tracking-[0.3em]"
                    style={{ color: MM.accent }}
                  >
                    {gift.provider}
                  </p>
                  <p className="mt-1 font-mono text-lg tracking-[0.1em]">
                    {gift.accountNumber}
                  </p>
                  {gift.holderName ? (
                    <p className="mt-1 text-xs" style={{ color: MM.muted }}>
                      a.n. {gift.holderName}
                    </p>
                  ) : null}
                </div>
                <CopyButton text={gift.accountNumber} />
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Ucapan & doa                                                        */
/* ------------------------------------------------------------------ */

function WishesSection({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <Section id="ucapan">
      <SectionHead index="07" label="Guest Book" title="Ucapan & Doa" />
      <Reveal>
        <WishList
          wishes={wishes ?? []}
          cardClass="border-[#DDD8CE] bg-white"
          nameClass="text-[#171613]"
          avatarClass="bg-[#171613] text-[#F6F4EF]"
          emptyClass="text-[#8B877C]"
        />
        <div
          className="mt-6 border p-6 sm:p-8"
          style={{ borderColor: MM.line, backgroundColor: MM.paperSoft }}
        >
          <p
            className="mb-5 text-[9px] uppercase tracking-[0.3em]"
            style={{ color: MM.accent }}
          >
            Kirim Ucapan
          </p>
          <WishForm
            invitationId={invitationId}
            accentClass={ACCENT}
            borderClass={BORDER}
          />
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer({
  groomNick,
  brideNick,
}: {
  groomNick?: string;
  brideNick?: string;
}) {
  return (
    <footer className="px-6 py-20 text-center text-[#F6F4EF]" style={{ backgroundColor: MM.ink }}>
      <p className="text-[9px] uppercase tracking-[0.42em] text-[#CFC3AD]">
        Thank You
      </p>
      <p className="mt-5 font-[family-name:var(--font-display)] text-3xl font-light leading-tight">
        {groomNick ?? "Pria"}
        <span className="mx-2 font-[family-name:var(--font-serif-elegant)] italic text-[#CFC3AD]">
          &amp;
        </span>
        {brideNick ?? "Wanita"}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-white/50">
        Terima kasih atas doa &amp; kehadiran Anda
      </p>
      <div className="mx-auto mt-10 h-px w-10 bg-white/20" />
      <p className="mt-6 text-[9px] uppercase tracking-[0.35em] text-white/30">
        Meduta — {new Date().getFullYear()}
      </p>
    </footer>
  );
}
