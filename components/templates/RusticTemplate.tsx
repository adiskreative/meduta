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
 * Rustic Wedding — "Terracotta Barn / Pampas & Linen"
 * Konsep barn wedding yang hangat: linen, oat, terakota, zaitun, dan kuningan.
 * Aset lokal dari /public/design/rustic dipakai bergantian agar tiap section
 * punya ornamen yang seimbang (tidak menumpuk di satu sisi).
 *
 * Konten tetap data-driven lewat TemplateProps:
 * - mempelai, kutipan, cerita, acara, galeri, kado, ucapan, musik
 * - RSVP & ucapan memakai server action bersama (RsvpForm/WishForm)
 * - background: pilihan user > dekorasi admin > foto bawaan template
 */

/* Palet earthy */
const RU = {
  linen: "#F6EFE3",
  paper: "#FFFBF2",
  oat: "#EADDC8",
  terracotta: "#B4553A",
  terracottaDeep: "#96452F",
  clay: "#D08B6B",
  olive: "#4A5A3C",
  oliveDeep: "#2F3A28",
  sage: "#9AA98B",
  espresso: "#35251D",
  ink: "#241811",
  brass: "#B08D57",
  blush: "#E8CFC2",
  muted: "#7C6A5B",
} as const;

const ACCENT = "bg-[#B4553A] hover:bg-[#96452F] shadow-lg shadow-[#B4553A]/25";
const BORDER =
  "border-[#DCCDB6] bg-[#FFFBF2] focus:border-[#B4553A] focus:ring-[#F0DCC2]";

const DEFAULT_COVER = "/design/rustic/aisle.webp";

/* Reveal-on-scroll. Kelas mengandung "-reveal" supaya mode thumbnail
   (?shot=1) memaksa semua konten terlihat tanpa IntersectionObserver. */
const RU_CSS = `
  .ru-reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ru-reveal.ru-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .ru-embed .ru-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  @keyframes ruFloat {
    0%, 100% { transform: translateY(0) rotate(-1.5deg); }
    50% { transform: translateY(-14px) rotate(2.5deg); }
  }
  .ru-float { animation: ruFloat 10s ease-in-out infinite; }
  .ru-float-slow { animation: ruFloat 14s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .ru-reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
    .ru-float, .ru-float-slow { animation: none; }
  }
`;

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };
type Person = NonNullable<TemplateProps["data"]["groom"]>;
type StoryList = NonNullable<TemplateProps["data"]["story"]>;
type GalleryList = NonNullable<TemplateProps["data"]["gallery"]>;
type GiftList = NonNullable<TemplateProps["data"]["gifts"]>;
type EventList = NonNullable<TemplateProps["data"]["events"]>;
type Tone = "linen" | "oat" | "olive";

const SECTION_TONES: Record<Tone, string> = {
  linen: "bg-[#F6EFE3]",
  oat: "bg-[#EADDC8]",
  olive: "bg-[#2F3A28]",
};

export default function RusticTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(
    isEmbed ? undefined : props.data.musicUrl,
    props.data.musicStart,
    props.data.musicEnd,
  );
  return (
    <RusticShell
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

function RusticShell({
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

  // Info acara utama + fallback venue/peta dari entri "Akad".
  const agenda = splitAgenda(data.events, {
    date: data.eventDate,
    time: data.eventTime,
    venue: data.venueName,
    mapUrl: data.locationMap,
  });

  // Kartu rangkaian acara memakai daftar events apa adanya (Akad + Resepsi
  // tampil keduanya, tanpa duplikasi dengan banner tanggal utama).
  const schedule: EventList =
    data.events && data.events.length > 0
      ? data.events
      : data.eventDate
        ? [
            {
              id: "main-event",
              title: data.eventName ?? "Acara Pernikahan",
              date: data.eventDate,
              time: data.eventTime,
              location: [data.venueName, data.location].filter(Boolean).join(", "),
              locationMap: data.locationMap,
            },
          ]
        : [];

  const eventDate = agenda.main.date ?? data.eventDate;
  const eventTime = agenda.main.time || data.eventTime;
  const venue = agenda.main.venue || data.venueName;
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
      className={`relative min-h-screen overflow-x-hidden ${embedded ? "ru-embed" : ""}`}
      style={{
        backgroundColor: RU.linen,
        color: RU.espresso,
        fontFamily: "Inter, var(--font-sans), sans-serif",
      }}
    >
      <style>{RU_CSS}</style>

      <Cover
        eventName={data.eventName ?? "The Wedding Of"}
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
            eventDate={data.eventDate}
            venueName={data.venueName}
          />

          {showQuote ? (
            <QuoteSection
              text={data.quoteText?.trim() ?? ""}
              source={data.quoteSource || data.quoteTitle}
            />
          ) : null}

          {groom?.name || bride?.name ? (
            <CoupleSection groom={groom} bride={bride} />
          ) : null}

          {story.length > 0 ? <StorySection story={story} /> : null}

          <EventsSection
            eventDate={eventDate}
            eventTime={eventTime}
            venue={venue}
            location={data.location}
            mapUrl={mapUrl}
            schedule={schedule}
            coupleTitle={`${groomNick ?? "Pria"} & ${brideNick ?? "Wanita"}`}
            eventTitle={data.eventName ?? "Undangan Pernikahan"}
          />

          <VenueSection venue={venue} location={data.location} mapUrl={mapUrl} />

          {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

          <RsvpSection invitationId={invitationId} guestName={guestName} />

          {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

          <WishesSection invitationId={invitationId} wishes={wishes} />

          <Footer groomNick={groomNick} brideNick={brideNick} eventDate={eventDate} />
        </main>
      )}

      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="border border-[#B08D57]/60 bg-[#35251D] text-[#E3B98C] shadow-xl shadow-black/30"
          playingIconClassName="h-4 w-4 animate-pulse"
          pausedIconClassName="h-4 w-4 opacity-60"
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
    const elements = document.querySelectorAll(".ru-reveal:not(.ru-visible)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("ru-visible");
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

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`ru-reveal ${className}`}>{children}</div>;
}

function initialOf(name?: string) {
  return (name ?? "?").trim().charAt(0).toUpperCase() || "?";
}

function dateParts(date?: string) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(value),
    month: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(value),
    monthShort: new Intl.DateTimeFormat("id-ID", { month: "short" })
      .format(value)
      .replace(".", ""),
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

/* ------------------------------------------------------------------ */
/* Ornamen & tekstur                                                   */
/* ------------------------------------------------------------------ */

function Botanical({
  src,
  className = "",
  fit = "contain",
  style,
}: {
  src: string;
  className?: string;
  fit?: "contain" | "cover";
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none select-none ${
        fit === "cover" ? "object-cover" : "object-contain"
      } ${className}`}
      style={style}
    />
  );
}

function PaperGrain({ light = false }: { light?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        backgroundImage: `radial-gradient(${
          light ? "rgba(255,255,255,0.055)" : "rgba(53,37,29,0.055)"
        } 0.6px, transparent 0.6px)`,
        backgroundSize: "4px 4px",
      }}
    />
  );
}

function PaperEdge({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
    >
      <path
        d="M0 56 C120 40 210 68 330 54 C450 40 540 66 660 52 C780 38 870 64 990 50 C1110 36 1200 62 1320 48 C1380 41 1410 52 1440 46 L1440 90 L0 90 Z"
        fill={color}
      />
    </svg>
  );
}

function Sprig({ className = "", color = RU.brass }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none">
      <path d="M32 58 C32 40 32 22 32 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {[18, 28, 38].map((y) => (
        <g key={y}>
          <ellipse cx="24" cy={y} rx="9" ry="3.4" fill={color} opacity="0.8" transform={`rotate(-32 24 ${y})`} />
          <ellipse cx="40" cy={y + 5} rx="9" ry="3.4" fill={color} opacity="0.8" transform={`rotate(32 40 ${y + 5})`} />
        </g>
      ))}
    </svg>
  );
}

function Rule({ dark = false }: { dark?: boolean }) {
  const line = dark ? "rgba(232,207,194,0.45)" : "rgba(176,141,87,0.55)";
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <span className="h-px w-10" style={{ backgroundColor: line }} />
      <span
        className="h-2 w-2 rotate-45"
        style={{ backgroundColor: dark ? RU.clay : RU.brass }}
      />
      <span className="h-px w-10" style={{ backgroundColor: line }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kerangka section                                                    */
/* ------------------------------------------------------------------ */

function Section({
  id,
  tone = "linen",
  decor,
  children,
}: {
  id?: string;
  tone?: Tone;
  decor?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dark = tone === "olive";
  return (
    <section
      id={id}
      className={`relative overflow-hidden ${SECTION_TONES[tone]} ${
        dark ? "text-[#F6EFE3]" : "text-[#35251D]"
      }`}
    >
      <PaperGrain light={dark} />
      {decor}
      <div className="relative mx-auto w-full max-w-xl px-6 py-16 sm:px-8 sm:py-20">
        {children}
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div className="relative z-10 text-center">
      <Rule dark={dark} />
      <p
        className="mt-4 text-[9px] uppercase tracking-[0.42em]"
        style={{ color: dark ? RU.blush : RU.terracotta }}
      >
        {eyebrow}
      </p>
      <h2
        className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.9rem,8vw,2.7rem)] leading-[1.08]"
        style={{ color: dark ? RU.linen : RU.espresso }}
      >
        {title}
      </h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang + cover                                                     */
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
  gatePhoto?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  locked?: boolean;
  onOpen?: () => void;
  bgUrl?: string;
}) {
  if (locked) {
    return (
      <InvitationGate
        theme="rustic"
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
    <header className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#2F3A28] text-[#FFF9EF]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgUrl || DEFAULT_COVER}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        style={{ objectPosition: "center 42%" }}
      />
      {/* Tirai zaitun + tanah liat supaya teks tetap terbaca di atas foto */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(175deg, rgba(47,58,40,0.55) 0%, rgba(53,37,29,0.34) 40%, rgba(36,24,17,0.9) 100%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 78% 18%, rgba(208,139,107,0.38), transparent 42%), radial-gradient(circle at 10% 84%, rgba(180,85,58,0.34), transparent 48%)",
        }}
      />
      {/* Vignette: pada layar lebar sisi kiri/kanan tetap terasa bagian dari foto,
          bukan pita gradasi datar. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 95% 82% at 50% 45%, transparent 34%, rgba(30,20,14,0.44) 100%)",
        }}
      />
      <PaperGrain light />

      <Botanical
        src="/design/rustic/gold-spray.webp"
        className="ru-float-slow absolute -right-12 top-14 z-0 h-44 w-44 opacity-55 sm:h-56 sm:w-56 lg:h-64 lg:w-64"
      />
      <Botanical
        src="/design/rustic/pampas.webp"
        className="absolute -left-16 bottom-8 z-0 h-60 w-60 opacity-35 sm:h-72 sm:w-72 lg:h-80 lg:w-80"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-10 pt-7 sm:px-10 sm:pb-12 sm:pt-9 lg:max-w-3xl">
        <div className="animate-fade-up flex items-start justify-between gap-5 text-[9px] uppercase leading-relaxed tracking-[0.3em] text-[#F6EFE3]/85">
          <span className="max-w-[62%]">{eventName}</span>
          <span className="shrink-0">{year ?? "The Wedding"}</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="animate-fade-up-delay-1 text-[10px] uppercase tracking-[0.44em] text-[#E8CFC2]">
            Together with joy
          </p>

          <h1 className="animate-fade-up-delay-2 mt-6 w-full">
            <span className="block break-words font-[family-name:var(--font-script)] text-[clamp(2.9rem,15vw,4.6rem)] leading-[0.95] drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
              {groomNick ?? "Pria"}
            </span>
            <span className="my-1 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#E3B98C]/70" />
              <span className="font-[family-name:var(--font-script)] text-[2.6rem] leading-none text-[#E3B98C]">
                &amp;
              </span>
              <span className="h-px w-10 bg-[#E3B98C]/70" />
            </span>
            <span className="block break-words font-[family-name:var(--font-script)] text-[clamp(2.9rem,15vw,4.6rem)] leading-[0.95] drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
              {brideNick ?? "Wanita"}
            </span>
          </h1>

          {eventDate ? (
            <div className="animate-fade-up-delay-3 mt-8 inline-flex items-center gap-3 rounded-full border border-[#F6EFE3]/25 bg-[#241811]/35 px-5 py-2.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#E3B98C]" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#F6EFE3]/90">
                {formatDate(eventDate)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="animate-fade-up-delay-4">
          {guestName ? (
            <div className="rounded-[1.5rem] border border-[#F6EFE3]/25 bg-[#2F3A28]/40 px-5 py-4 text-center backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[0.34em] text-[#E8CFC2]">
                Kepada Yth.
              </p>
              <p className="mt-1 break-words font-[family-name:var(--font-script)] text-3xl text-[#FFF9EF]">
                {guestName}
              </p>
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#F6EFE3]/30 pt-4">
            <span className="text-[9px] uppercase tracking-[0.32em] text-[#F6EFE3]/80">
              Scroll to explore
            </span>
            <ArrowDown className="h-4 w-4 animate-bounce text-[#E3B98C]" />
          </div>
        </div>
      </div>

      <PaperEdge
        color={RU.linen}
        className="absolute inset-x-0 bottom-0 z-10 h-8 w-full sm:h-10"
      />
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Pembuka                                                             */
/* ------------------------------------------------------------------ */

function IntroSection({
  groomInitial,
  brideInitial,
  customMessage,
  eventDate,
  venueName,
}: {
  groomInitial: string;
  brideInitial: string;
  customMessage?: string;
  eventDate?: string;
  venueName?: string;
}) {
  return (
    <Section
      tone="linen"
      decor={
        <>
          <Botanical
            src="/design/rustic/garland.webp"
            fit="cover"
            className="absolute -top-8 left-1/2 h-24 w-[24rem] -translate-x-1/2 opacity-85 sm:h-28 sm:w-[32rem]"
            style={{
              // Ujung bawah garland melebur ke linen supaya tidak terlihat
              // seperti potongan foto persegi.
              maskImage: "linear-gradient(to bottom, #000 52%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 52%, transparent 100%)",
            }}
          />
          <Botanical
            src="/design/rustic/corner-trail.webp"
            className="absolute -right-12 top-28 hidden h-56 w-56 opacity-50 sm:block"
          />
          <Botanical
            src="/design/rustic/pampas.webp"
            className="absolute -left-20 bottom-0 h-56 w-56 opacity-20"
          />
        </>
      }
    >
      <Reveal className="pt-8 text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-[#B08D57]/50" />
          <span className="absolute inset-[6px] rounded-full border border-dashed border-[#B08D57]/40" />
          <span className="font-[family-name:var(--font-script)] text-2xl text-[#35251D]">
            {groomInitial}
            <span className="mx-1 text-[#B4553A]">&amp;</span>
            {brideInitial}
          </span>
        </div>

        <p className="mt-6 text-[9px] uppercase tracking-[0.44em] text-[#B4553A]">
          The Invitation
        </p>

        {customMessage ? (
          <p className="mx-auto mt-5 max-w-md font-[family-name:var(--font-serif-elegant)] text-[1.32rem] font-light leading-relaxed text-[#35251D]/90">
            {customMessage}
          </p>
        ) : null}

        <div className="mt-6">
          <Rule />
        </div>

        {eventDate ? (
          <p className="mx-auto mt-4 max-w-xs text-[10px] uppercase leading-loose tracking-[0.26em] text-[#7C6A5B]">
            {formatDate(eventDate)}
            {venueName ? ` — ${venueName}` : ""}
          </p>
        ) : null}
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Kutipan                                                             */
/* ------------------------------------------------------------------ */

function QuoteSection({ text, source }: { text: string; source?: string }) {
  return (
    <Section
      tone="olive"
      decor={
        <>
          <Botanical
            src="/design/rustic/pampas.webp"
            className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 opacity-[0.18]"
          />
          <Botanical
            src="/design/rustic/gold-spray.webp"
            className="absolute -right-16 top-4 h-56 w-56 rotate-12 opacity-30"
          />
        </>
      }
    >
      <Reveal className="relative py-2 text-center sm:py-4">
        <Quote className="mx-auto h-7 w-7" style={{ color: RU.brass }} />
        <p
          className="mx-auto mt-5 max-w-lg whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-[1.4rem] font-light italic leading-relaxed sm:text-[1.6rem]"
          style={{ color: RU.linen }}
        >
          {text}
        </p>
        {source ? (
          <p
            className="mt-6 text-[9px] uppercase tracking-[0.34em]"
            style={{ color: "#E3B98C" }}
          >
            {source}
          </p>
        ) : null}
        <div className="mt-7">
          <Rule dark />
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai                                                            */
/* ------------------------------------------------------------------ */

function CoupleSection({ groom, bride }: { groom?: Person; bride?: Person }) {
  return (
    <Section
      tone="oat"
      decor={
        <>
          <Botanical
            src="/design/rustic/corner-trail.webp"
            className="absolute -left-10 -top-8 hidden h-56 w-56 opacity-45 sm:block"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, #000 26%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 26%)",
            }}
          />
          <Botanical
            src="/design/rustic/spray.webp"
            className="absolute -right-10 bottom-2 hidden h-56 w-56 opacity-45 sm:block"
          />
        </>
      }
    >
      <SectionHead eyebrow="Bride & Groom" title="Kedua Mempelai" />
      <Reveal>
        <div className="mt-11 grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-8">
          <PersonCard person={groom} role="Mempelai Pria" />
          <PersonCard person={bride} role="Mempelai Wanita" />
        </div>
        <p className="mx-auto mt-12 max-w-sm text-center font-[family-name:var(--font-serif-elegant)] text-sm italic leading-relaxed text-[#7C6A5B]">
          Dengan penuh sukacita, kami mengundang Anda untuk menjadi bagian dari
          hari bahagia kami.
        </p>
      </Reveal>
    </Section>
  );
}

function PersonCard({ person, role }: { person?: Person; role: string }) {
  const name = person?.name ?? "-";
  const nickname =
    person?.nickname && person.name && person.nickname !== person.name
      ? person.nickname
      : undefined;
  const instagram = instagramHandle(person?.instagram);

  return (
    <figure className="group relative mx-auto w-full max-w-[16rem]">
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-t-full rounded-b-[1.75rem] bg-[#B4553A]/25"
        />
        <div className="relative overflow-hidden rounded-t-full rounded-b-[1.75rem] border-[6px] border-[#FFFBF2] bg-[#EADDC8] shadow-xl shadow-[#35251D]/15">
          {person?.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={person.photoUrl}
              alt={name}
              className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 bg-[#EADDC8]">
              <Sprig className="h-14 w-14 opacity-80" />
              <span className="font-[family-name:var(--font-script)] text-4xl text-[#B4553A]">
                {initialOf(name)}
              </span>
            </div>
          )}
        </div>

        <Botanical
          src="/design/rustic/pampas.webp"
          className="absolute -bottom-5 -left-5 h-20 w-20 opacity-90"
        />
        <Botanical
          src="/design/rustic/gold-spray.webp"
          className="absolute -right-3 top-10 h-14 w-14 opacity-75"
        />
      </div>

      <figcaption className="relative mt-5 text-center">
        <p className="text-[9px] uppercase tracking-[0.32em] text-[#B4553A]">
          {role}
        </p>
        <h3 className="mt-1.5 break-words font-[family-name:var(--font-display)] text-2xl leading-tight text-[#35251D]">
          {name}
        </h3>
        {nickname ? (
          <p className="mt-0.5 font-[family-name:var(--font-script)] text-2xl text-[#96452F]">
            {nickname}
          </p>
        ) : null}
        {person?.parentName ? (
          <p className="mt-2 text-xs leading-relaxed text-[#7C6A5B]">
            {person.parentName}
          </p>
        ) : null}
        {person?.bio ? (
          <p className="mt-2 border-t border-[#DCCDB6] pt-2.5 text-xs italic leading-relaxed text-[#7C6A5B]">
            &ldquo;{person.bio}&rdquo;
          </p>
        ) : null}
        {instagram ? (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-[#4A5A3C] transition-opacity hover:opacity-60"
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
    <Section
      tone="linen"
      decor={
        <>
          <Botanical
            src="/design/rustic/spray.webp"
            className="absolute -right-16 bottom-6 hidden h-64 w-64 opacity-45 sm:block"
          />
          <Botanical
            src="/design/rustic/gold-spray.webp"
            className="absolute -left-10 top-10 h-40 w-40 -rotate-12 opacity-40"
          />
        </>
      }
    >
      <SectionHead eyebrow="Our Story" title="Cerita Kami" />
      <Reveal className="mt-10">
        <div className="relative">
          <ol className="space-y-8">
            {story.map((item, index) => (
              <li key={item.id} className="relative pl-11">
                <span className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#DCCDB6] bg-[#FFFBF2]">
                  <span
                    className="h-2 w-2 rotate-45"
                    style={{
                      backgroundColor: index % 2 === 0 ? RU.terracotta : RU.olive,
                    }}
                  />
                </span>
                {/* Garis hanya digambar antar-marker; item terakhir tidak
                    menyisakan garis menggantung di bawah timeline. */}
                {index < story.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[13px] top-9 h-full w-px"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(176,141,87,0.7) 0 4px, transparent 4px 10px)",
                    }}
                  />
                ) : null}
                <p className="text-[9px] uppercase tracking-[0.28em] text-[#B4553A]">
                  {formatDate(item.date) || "Momen"}
                </p>
                {item.title ? (
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight text-[#35251D]">
                    {item.title}
                  </h3>
                ) : null}
                {item.description ? (
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#7C6A5B]">
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara + countdown                                                   */
/* ------------------------------------------------------------------ */

function EventsSection({
  eventDate,
  eventTime,
  venue,
  location,
  mapUrl,
  schedule,
  coupleTitle,
  eventTitle,
}: {
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  location?: string;
  mapUrl?: string;
  schedule: EventList;
  coupleTitle: string;
  eventTitle: string;
}) {
  const date = dateParts(eventDate);

  return (
    <Section
      tone="olive"
      decor={
        <>
          <Botanical
            src="/design/rustic/pampas.webp"
            className="absolute -right-24 top-[42%] h-72 w-72 opacity-[0.14]"
          />
          <Botanical
            src="/design/rustic/gold-spray.webp"
            className="absolute -left-16 bottom-6 h-56 w-56 rotate-12 opacity-20"
          />
        </>
      }
    >
      <SectionHead eyebrow="Save the Date" title="Hari Bahagia" dark />

      <Reveal>
        {date ? (
          <div className="mt-10 flex items-center justify-center gap-5">
            <div className="text-center">
              <span className="block font-[family-name:var(--font-display)] text-[4.6rem] leading-[0.8] text-[#F6EFE3]">
                {date.day}
              </span>
              <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] text-[#D08B6B]">
                {date.month} {date.year}
              </span>
            </div>
            <span aria-hidden className="h-24 w-px bg-[#F6EFE3]/20" />
            <div className="min-w-0 text-left">
              <p className="text-[9px] uppercase tracking-[0.32em] text-[#F6EFE3]/55">
                {date.weekday}
              </p>
              {eventTime ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#F6EFE3]/90">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#D08B6B]" />
                  {formatTime(eventTime)}
                </p>
              ) : null}
              {venue ? (
                <p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed text-[#F6EFE3]/90">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D08B6B]" />
                  <span className="break-words">{venue}</span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {eventDate ? (
          <div className="mt-9">
            <CountdownGrid target={eventDate} />
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#F6EFE3] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#35251D] transition hover:bg-white"
            >
              <MapPin className="h-3.5 w-3.5" />
              Lihat Peta
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {venue || location ? (
            <SaveToCalendarButton
              title={`${eventTitle} — ${coupleTitle}`}
              date={eventDate}
              time={eventTime}
              location={[venue, location].filter(Boolean).join(", ")}
              className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#E3B98C]/60 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E3B98C] transition hover:bg-[#E3B98C]/10"
            />
          ) : null}
        </div>
      </Reveal>

      {schedule.length > 0 ? (
        <Reveal className="mt-12">
          <p className="text-center text-[9px] uppercase tracking-[0.36em] text-[#E3B98C]">
            Rangkaian Acara
          </p>
          <div className="mt-5 space-y-3.5">
            {schedule.map((event) => (
              <ScheduleCard key={event.id} event={event} />
            ))}
          </div>
        </Reveal>
      ) : null}
    </Section>
  );
}

function CountdownGrid({ target }: { target?: string }) {
  const left = useCountdown(target);
  const items = [
    { label: "Hari", value: left.days },
    { label: "Jam", value: left.hours },
    { label: "Menit", value: left.minutes },
    { label: "Detik", value: left.seconds },
  ];
  if (!target) return null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Hitung mundur acara">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-xl border border-[#F6EFE3]/10 bg-[#F6EFE3] px-1 py-3 shadow-lg shadow-black/20"
        >
          <span className="font-[family-name:var(--font-display)] text-xl tabular-nums text-[#35251D] sm:text-2xl">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-[#7C6A5B] sm:text-[9px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScheduleCard({ event }: { event: EventList[number] }) {
  const date = dateParts(event.date);
  return (
    <article className="relative overflow-hidden rounded-2xl bg-[#F6EFE3] p-4 text-left shadow-lg shadow-black/15 sm:p-5">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-[#B4553A]" />
      <div className="flex items-start gap-4 pl-2">
        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#B4553A] text-[#F6EFE3]">
          <span className="font-[family-name:var(--font-display)] text-lg leading-none">
            {date?.day ?? "•"}
          </span>
          <span className="mt-0.5 text-[8px] uppercase tracking-wide">
            {date?.monthShort ?? "—"}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="break-words font-[family-name:var(--font-display)] text-lg leading-tight text-[#35251D]">
            {event.title ?? "Acara"}
          </h3>
          {event.time ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7C6A5B]">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#B4553A]" />
              {formatTime(event.time)}
            </p>
          ) : null}
          {event.location ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-[#7C6A5B]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B4553A]" />
              <span className="break-words">{event.location}</span>
            </p>
          ) : null}
          {event.locationMap ? (
            <a
              href={event.locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#B4553A] transition hover:text-[#96452F] hover:underline"
            >
              Lihat Lokasi
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Venue                                                               */
/* ------------------------------------------------------------------ */

function VenueSection({
  venue,
  location,
  mapUrl,
}: {
  venue?: string;
  location?: string;
  mapUrl?: string;
}) {
  if (!venue && !location && !mapUrl) return null;

  return (
    <Section
      tone="linen"
      decor={
        <>
          <Botanical
            src="/design/rustic/spray.webp"
            className="absolute -right-16 top-10 hidden h-64 w-64 opacity-40 sm:block"
          />
          <Botanical
            src="/design/rustic/pampas.webp"
            className="absolute -left-20 bottom-0 h-60 w-60 opacity-20"
          />
        </>
      }
    >
      <SectionHead eyebrow="The Venue" title="Lokasi Acara" />

      <Reveal>
        <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-[2rem] border border-[#DCCDB6] bg-[#FFFBF2] p-3 shadow-xl shadow-[#35251D]/10">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#EADDC8]">
            <Botanical
              src="/design/rustic/venue-chapel.webp"
              fit="cover"
              className="h-44 w-full sm:h-48"
            />
            {/* Ilustrasi melebur ke kertas, bukan berhenti sebagai kotak. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#EADDC8] to-transparent"
            />
          </div>

          <div className="px-4 pb-5 pt-4 text-center">
            <span className="mx-auto block h-1.5 w-1.5 rotate-45 bg-[#B08D57]" />
            {venue ? (
              <h3 className="mt-3 break-words font-[family-name:var(--font-display)] text-2xl leading-tight text-[#35251D]">
                {venue}
              </h3>
            ) : null}
            {location ? (
              <p className="mt-2 text-sm leading-relaxed text-[#7C6A5B]">
                {location}
              </p>
            ) : null}
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#B4553A] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F6EFE3] shadow-lg shadow-[#B4553A]/25 transition hover:bg-[#96452F]"
              >
                <MapPin className="h-3.5 w-3.5" />
                Buka Google Maps
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </Reveal>
    </Section>
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
        setSelected((current) =>
          current === null ? current : (current + 1) % gallery.length,
        );
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

  const current = selected === null ? null : gallery[selected];
  const restCount = gallery.length - 1;

  return (
    <Section
      id="galeri"
      tone="oat"
      decor={
        <>
          <Botanical
            src="/design/rustic/peony.webp"
            className="absolute -left-14 -top-16 h-44 w-44 opacity-40"
          />
          <Botanical
            src="/design/rustic/corner-trail.webp"
            className="absolute -bottom-16 -right-14 hidden h-64 w-64 rotate-180 opacity-40 sm:block"
          />
        </>
      }
    >
      <SectionHead eyebrow="Gallery" title="Galeri Momen" />

      <Reveal className="mt-10">
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {gallery.map((item, index) => {
            const first = index === 0;
            const isLastWide =
              restCount % 2 === 1 && index === gallery.length - 1 && !first;
            return (
              <GalleryTile
                key={item.id}
                item={item}
                index={index}
                wide={first || isLastWide}
                onOpen={() => setSelected(index)}
              />
            );
          })}
        </div>
      </Reveal>

      {current ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1F1710]/95 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Foto galeri"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Tutup"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-[#F6EFE3] transition hover:bg-white/10"
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
                    value === null
                      ? value
                      : (value - 1 + gallery.length) % gallery.length,
                  );
                }}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-[#F6EFE3] transition hover:bg-white/10 sm:left-6"
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
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-[#F6EFE3] transition hover:bg-white/10 sm:right-6"
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
              className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            {current.caption ? (
              <figcaption className="mt-4 max-w-md text-center text-[10px] uppercase tracking-[0.28em] text-[#E3B98C]">
                {current.caption}
              </figcaption>
            ) : null}
            <span className="mt-2 text-[10px] tabular-nums text-white/45">
              {(selected ?? 0) + 1} / {gallery.length}
            </span>
          </figure>
        </div>
      ) : null}
    </Section>
  );
}

function GalleryTile({
  item,
  index,
  wide,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  wide: boolean;
  onOpen: () => void;
}) {
  const rotation =
    index % 4 === 0
      ? "-rotate-[1.6deg]"
      : index % 4 === 1
        ? "rotate-[1.4deg]"
        : index % 4 === 2
          ? "rotate-[1.8deg]"
          : "-rotate-[1.2deg]";

  return (
    <figure className={`relative ${wide ? "col-span-2" : ""}`}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={item.caption ? `Perbesar foto: ${item.caption}` : "Perbesar foto"}
        className={`group relative block w-full bg-[#FFFBF2] p-2 pb-9 shadow-[0_16px_34px_rgba(53,37,29,0.18)] transition-transform duration-500 hover:rotate-0 ${rotation}`}
      >
        <span className="absolute -top-1.5 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 bg-[#E8CFC2]/75" />
        <span className="block overflow-hidden bg-[#EADDC8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.caption ?? "Foto galeri"}
            className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              wide ? "aspect-[16/10]" : "aspect-[3/4]"
            }`}
          />
        </span>
        {item.caption ? (
          <span className="absolute inset-x-3 bottom-2.5 truncate text-center font-[family-name:var(--font-script)] text-lg text-[#35251D]/80">
            {item.caption}
          </span>
        ) : (
          <span className="absolute inset-x-3 bottom-3 text-center text-[9px] uppercase tracking-[0.28em] text-[#7C6A5B]">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#35251D]/80 text-[#F6EFE3] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </button>
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
    <Section
      tone="linen"
      decor={
        <Botanical
          src="/design/rustic/pampas.webp"
          className="absolute -left-24 top-20 h-72 w-72 opacity-20"
        />
      }
    >
      <SectionHead eyebrow="RSVP" title="Konfirmasi Kehadiran" />
      <Reveal>
        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-[#7C6A5B]">
          Mohon konfirmasi kehadiran Anda agar kami dapat menyambut Anda dengan
          sebaik-baiknya.
        </p>

        <div className="relative mx-auto mt-16 max-w-md rounded-[1.75rem] border border-[#DCCDB6] bg-[#FFFBF2] px-6 pb-6 pt-0 shadow-xl shadow-[#35251D]/10 sm:px-8 sm:pb-8">
          <Botanical
            src="/design/rustic/envelope-wax.webp"
            className="relative z-10 mx-auto -mt-12 h-24 w-24 rotate-6 drop-shadow-lg sm:-mt-14 sm:h-28 sm:w-28"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-dashed border-[#DCCDB6]/80"
          />
          <div className="relative -mt-1">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado                                                                */
/* ------------------------------------------------------------------ */

function GiftsSection({ gifts }: { gifts: GiftList }) {
  const tones = [RU.terracotta, RU.olive, RU.brass, RU.clay];

  return (
    <Section
      id="kado"
      tone="oat"
      decor={
        <>
          <Botanical
            src="/design/rustic/gold-spray.webp"
            className="absolute -right-8 top-12 h-40 w-40 rotate-12 opacity-35 sm:h-48 sm:w-48"
          />
          <Botanical
            src="/design/rustic/corner-trail.webp"
            className="absolute -bottom-10 -left-10 hidden h-56 w-56 opacity-35 sm:block"
          />
        </>
      }
    >
      <SectionHead eyebrow="Wedding Gift" title="Tanda Kasih" />

      <Reveal>
        <Botanical
          src="/design/rustic/envelope-heart.webp"
          className="mx-auto mt-2 h-40 w-40 -rotate-3 drop-shadow-md"
        />

        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-[#7C6A5B]">
          Doa restu Anda adalah hadiah terindah. Bila ingin memberikan tanda
          kasih, Anda dapat menyalurkannya melalui:
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gifts.map((gift, index) => (
            <article
              key={gift.id}
              className="relative overflow-hidden rounded-2xl border border-[#DCCDB6] bg-[#FFFBF2] p-5 text-left shadow-sm"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: tones[index % tones.length] }}
              />
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#B4553A]">
                    {gift.provider}
                  </p>
                  {gift.name ? (
                    <p className="mt-0.5 truncate text-xs text-[#7C6A5B]">
                      {gift.name}
                    </p>
                  ) : null}
                </div>
                <Sprig className="h-6 w-6 shrink-0 opacity-70" />
              </div>
              <p className="mt-4 break-all font-mono text-base font-semibold tracking-wide text-[#35251D] sm:text-lg">
                {gift.accountNumber}
              </p>
              {gift.holderName ? (
                <p className="mt-1 text-xs text-[#7C6A5B]">
                  a.n. {gift.holderName}
                </p>
              ) : null}
              <div className="mt-3">
                <CopyButton text={gift.accountNumber} />
              </div>
            </article>
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
    <Section
      id="ucapan"
      tone="linen"
      decor={
        <>
          <Botanical
            src="/design/rustic/spray.webp"
            className="absolute -right-10 top-12 hidden h-52 w-52 opacity-35 sm:block"
          />
          <Botanical
            src="/design/rustic/peony.webp"
            className="absolute -bottom-8 -left-10 h-44 w-44 opacity-25"
          />
        </>
      }
    >
      <SectionHead eyebrow="Wedding Wall" title="Ucapan & Doa" />
      <Reveal>
        <div className="mt-8">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[#DCCDB6] bg-[#FFFBF2]"
            nameClass="text-[#B4553A]"
            avatarClass="bg-[#4A5A3C] text-[#F6EFE3]"
            emptyClass="text-[#9A8A78]"
          />
        </div>
        <div className="relative mx-auto mt-8 max-w-md rounded-[1.75rem] border border-[#DCCDB6] bg-[#FFFBF2] p-6 shadow-xl shadow-[#35251D]/10 sm:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-dashed border-[#DCCDB6]/80"
          />
          <div className="relative">
            <p className="mb-5 text-center text-[9px] uppercase tracking-[0.34em] text-[#B4553A]">
              Kirim Ucapan
            </p>
            <WishForm
              invitationId={invitationId}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
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
  eventDate,
}: {
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
}) {
  return (
    <footer className="relative overflow-hidden bg-[#241811] px-6 py-16 text-center text-[#F6EFE3]">
      <PaperGrain light />
      <Botanical
        src="/design/rustic/pampas.webp"
        className="absolute -left-12 bottom-0 h-56 w-56 opacity-20"
      />
      <Botanical
        src="/design/rustic/spray.webp"
        className="absolute -right-10 top-4 h-52 w-52 opacity-25"
      />
      <Botanical
        src="/design/rustic/garland.webp"
        fit="cover"
        className="absolute inset-x-0 top-0 h-16 w-full opacity-30"
        style={{
          maskImage: "linear-gradient(to bottom, #000 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 35%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-md">
        <p className="text-[9px] uppercase tracking-[0.42em] text-[#E3B98C]">
          Thank You
        </p>
        <p className="mt-5 font-[family-name:var(--font-script)] text-[clamp(2.6rem,12vw,3.6rem)] leading-[1.05]">
          {groomNick ?? "Pria"}
          <span className="mx-2 text-[#E3B98C]">&amp;</span>
          {brideNick ?? "Wanita"}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#F6EFE3]/60">
          Terima kasih atas doa &amp; kehadiran Anda
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-[#B08D57]/50" />
          <span className="h-2 w-2 rotate-45 bg-[#B08D57]" />
          <span className="h-px w-12 bg-[#B08D57]/50" />
        </div>

        {eventDate ? (
          <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-[#F6EFE3]/65">
            {formatDate(eventDate)}
          </p>
        ) : null}

        <p className="mt-6 text-[9px] uppercase tracking-[0.34em] text-[#F6EFE3]/40">
          Meduta — {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Draft                                                               */
/* ------------------------------------------------------------------ */

function DraftNotice() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center gap-3 overflow-hidden px-6 text-center"
      style={{ backgroundColor: RU.linen, color: RU.espresso }}
    >
      <PaperGrain />
      <Botanical
        src="/design/rustic/pampas.webp"
        className="absolute -left-16 bottom-0 h-56 w-56 opacity-25"
      />
      <Sprig className="h-12 w-12" />
      <p className="mt-2 text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="max-w-xs text-sm leading-relaxed" style={{ color: RU.muted }}>
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}
