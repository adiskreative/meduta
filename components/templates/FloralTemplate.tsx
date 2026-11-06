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
 * Floral Premium — "Secret Garden"
 * Konsep taman penuh warna: hijau daun tua, koral, peoni, dan marigold di atas
 * kertas krem hangat. Semua konten data-driven mengikuti arsitektur Meduta:
 * - Mempelai, cerita, acara, galeri, kado, kutipan, & pesan dari user
 * - Musik latar user (BackgroundMusic)
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm)
 * - Background berlapis: pilihan user > admin (dekorasi) > bawaan template
 * Khas template ini: ornamen bunga SVG, bingkai foto berarch, timeline sulur,
 * section acara hijau penuh warna, countdown warna-warni, dan lightbox galeri.
 */

/* Palet taman penuh warna */
const FL = {
  cream: "#FFF8EE",
  creamSoft: "#FDEFE1",
  peach: "#FCE4D3",
  lilac: "#F6ECF3",
  green: "#0F3B2B",
  greenSoft: "#1F5E45",
  leaf: "#3E7C58",
  ink: "#173B2F",
  coral: "#E15B44",
  coralDeep: "#C0553F",
  peony: "#D8407A",
  marigold: "#F2A93B",
  line: "#E8D5C2",
  muted: "#7C6A5B",
} as const;

const ACCENT = "bg-[#E15B44] hover:bg-[#C94A35] shadow-lg shadow-[#E15B44]/25";
const BORDER =
  "border-[#E8D5C2] bg-white focus:border-[#E15B44] focus:ring-[#FBE3DA]";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1400&q=70";

/* CSS lokal: reveal-on-scroll (kelas mengandung "-reveal" agar mode
   thumbnail ?shot=1 memaksa konten terlihat tanpa IntersectionObserver). */
const FL_CSS = `
  .fl-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .fl-reveal.fl-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .fl-embed .fl-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  @keyframes flFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-14px) rotate(5deg); }
  }
  .fl-float { animation: flFloat 9s ease-in-out infinite; }
  .fl-float-slow { animation: flFloat 13s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .fl-reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
    .fl-float, .fl-float-slow { animation: none; }
  }
`;

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };
type Person = NonNullable<TemplateProps["data"]["groom"]>;
type StoryList = NonNullable<TemplateProps["data"]["story"]>;
type GalleryList = NonNullable<TemplateProps["data"]["gallery"]>;
type GiftList = NonNullable<TemplateProps["data"]["gifts"]>;
type EventList = NonNullable<TemplateProps["data"]["events"]>;
type Tone = "cream" | "blush" | "peach" | "lilac" | "green";

export default function FloralTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(
    isEmbed ? undefined : props.data.musicUrl,
    props.data.musicStart,
    props.data.musicEnd,
  );
  return (
    <FloralShell
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

function FloralShell({
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
      className={`relative min-h-screen overflow-x-hidden ${embedded ? "fl-embed" : ""}`}
      style={{
        backgroundColor: FL.cream,
        color: FL.ink,
        fontFamily: "Inter, var(--font-sans), sans-serif",
      }}
    >
      <style>{FL_CSS}</style>

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

          {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

          <RsvpSection invitationId={invitationId} guestName={guestName} />

          {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

          <WishesSection invitationId={invitationId} wishes={wishes} />

          <Footer groomNick={groomNick} brideNick={brideNick} />
        </main>
      )}

      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="border border-[#F7D9A0]/50 bg-[#0F3B2B] text-[#F7D9A0] shadow-xl shadow-black/25"
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
    const elements = document.querySelectorAll(".fl-reveal:not(.fl-visible)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("fl-visible");
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
  return <div className={`fl-reveal ${className}`}>{children}</div>;
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
/* Ornamen bunga (SVG inline, tanpa aset eksternal)                    */
/* ------------------------------------------------------------------ */

function Flower({
  className = "",
  petal = FL.coral,
  center = FL.marigold,
  style,
}: {
  className?: string;
  petal?: string;
  center?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <g>
        {[0, 72, 144, 216, 288].map((angle, index) => (
          <ellipse
            key={angle}
            cx="50"
            cy="27"
            rx="12.5"
            ry="19"
            fill={petal}
            opacity={0.95 - index * 0.04}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="10" fill={center} />
      <circle cx="50" cy="50" r="4.5" fill={FL.cream} opacity="0.7" />
    </svg>
  );
}

function LeafSprig({
  className = "",
  color = FL.leaf,
  style,
}: {
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 24 C 30 6, 78 6, 118 22"
        stroke={color}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {[20, 40, 60, 80, 100].map((x, index) => (
        <ellipse
          key={x}
          cx={x}
          cy={index % 2 === 0 ? 14 : 30}
          rx="9"
          ry="4.5"
          fill={color}
          opacity="0.9"
          transform={`rotate(${index % 2 === 0 ? -24 : 24} ${x} ${index % 2 === 0 ? 14 : 30})`}
        />
      ))}
    </svg>
  );
}

function SectionDecor({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-50 blur-2xl"
        style={{
          background: dark
            ? "radial-gradient(circle, rgba(242,169,59,0.5), transparent 70%)"
            : "radial-gradient(circle, rgba(225,91,68,0.22), transparent 70%)",
        }}
      />
      <div
        className="absolute -right-24 top-1/3 h-72 w-72 rounded-full opacity-45 blur-2xl"
        style={{
          background: dark
            ? "radial-gradient(circle, rgba(216,64,122,0.45), transparent 70%)"
            : "radial-gradient(circle, rgba(242,169,59,0.22), transparent 70%)",
        }}
      />
      <Flower
        className="absolute -left-5 bottom-8 h-20 w-20 opacity-25"
        petal={dark ? FL.peony : FL.coral}
        center={FL.marigold}
      />
      <Flower
        className="absolute -right-4 top-8 h-14 w-14 opacity-25"
        petal={dark ? FL.marigold : FL.peony}
        center={FL.cream}
      />
      <LeafSprig
        className="absolute bottom-5 right-6 h-8 w-20 opacity-30"
        color={dark ? FL.marigold : FL.leaf}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kerangka section                                                    */
/* ------------------------------------------------------------------ */

const TONES: Record<Tone, string> = {
  cream: "bg-[#FFF8EE]",
  blush: "bg-[#FDEFE1]",
  peach: "bg-[#FCE4D3]",
  lilac: "bg-[#F6ECF3]",
  green: "bg-[#0F3B2B]",
};

function Section({
  id,
  tone = "cream",
  children,
}: {
  id?: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  const dark = tone === "green";
  return (
    <section
      id={id}
      className={`relative overflow-hidden ${TONES[tone]} ${dark ? "text-[#FFF8EE]" : "text-[#173B2F]"}`}
    >
      <SectionDecor dark={dark} />
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
    <div className="text-center">
      <div className="flex items-center justify-center gap-3">
        <span
          className="h-px w-8"
          style={{ backgroundColor: dark ? "rgba(247,217,160,0.5)" : FL.line }}
        />
        <Flower
          className="h-5 w-5"
          petal={dark ? FL.marigold : FL.coral}
          center={dark ? FL.peony : FL.marigold}
        />
        <span
          className="h-px w-8"
          style={{ backgroundColor: dark ? "rgba(247,217,160,0.5)" : FL.line }}
        />
      </div>
      <p
        className="mt-4 text-[9px] uppercase tracking-[0.4em]"
        style={{ color: dark ? FL.marigold : FL.coralDeep }}
      >
        {eyebrow}
      </p>
      <h2
        className="mt-2 font-[family-name:var(--font-display)] text-[2rem] leading-[1.05] sm:text-[2.6rem]"
        style={{ color: dark ? FL.cream : FL.ink }}
      >
        {title}
      </h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Draft                                                               */
/* ------------------------------------------------------------------ */

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: FL.cream, color: FL.ink }}
    >
      <Flower className="h-12 w-12" petal={FL.coral} center={FL.marigold} />
      <p className="mt-2 text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="max-w-xs text-sm leading-relaxed" style={{ color: FL.muted }}>
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
        theme="floral"
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
    <header className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#0F3B2B] text-[#FFF8EE]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgUrl || DEFAULT_COVER}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      {/* Pewarnaan penuh: hijau taman di atas, koral hangat di bawah */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(165deg, rgba(15,59,43,0.82) 0%, rgba(15,59,43,0.38) 42%, rgba(225,91,68,0.58) 100%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 72% 16%, rgba(242,169,59,0.35), transparent 45%), linear-gradient(to top, rgba(11,42,31,0.92), transparent 62%)",
        }}
      />

      {/* Ornamen bunga di sudut layar */}
      <Flower
        className="fl-float pointer-events-none absolute -left-7 top-24 h-28 w-28 opacity-80"
        petal={FL.peony}
        center={FL.marigold}
      />
      <Flower
        className="fl-float-slow pointer-events-none absolute -right-8 top-40 h-24 w-24 opacity-75"
        petal={FL.coral}
        center={FL.marigold}
      />
      <Flower
        className="fl-float-slow pointer-events-none absolute -left-4 bottom-24 h-20 w-20 opacity-70"
        petal={FL.marigold}
        center={FL.peony}
      />
      <LeafSprig
        className="pointer-events-none absolute -right-2 bottom-16 h-10 w-28 opacity-70"
        color={FL.marigold}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
        <div className="animate-fade-up flex items-start justify-between gap-5 text-[9px] uppercase leading-relaxed tracking-[0.3em] text-[#FFF3DD]/85">
          <span className="max-w-[62%]">{eventName}</span>
          <span className="shrink-0">{year ?? "The Wedding"}</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="animate-fade-up-delay-1 text-[10px] uppercase tracking-[0.44em] text-[#F7D9A0]">
            Together with joy
          </p>

          <h1 className="animate-fade-up-delay-2 mt-6 w-full">
            <span className="block break-words font-[family-name:var(--font-script)] text-[clamp(2.9rem,15vw,4.6rem)] leading-[0.95] drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
              {groomNick ?? "Pria"}
            </span>
            <span className="my-1.5 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#F7D9A0]/60" />
              <span className="font-[family-name:var(--font-script)] text-[2.5rem] leading-none text-[#F7D9A0]">
                &amp;
              </span>
              <span className="h-px w-10 bg-[#F7D9A0]/60" />
            </span>
            <span className="block break-words font-[family-name:var(--font-script)] text-[clamp(2.9rem,15vw,4.6rem)] leading-[0.95] drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
              {brideNick ?? "Wanita"}
            </span>
          </h1>

          {eventDate ? (
            <div className="animate-fade-up-delay-3 mt-8 inline-flex flex-col items-center rounded-2xl border border-white/25 bg-[#0F3B2B]/35 px-6 py-3 backdrop-blur-md">
              <span className="text-[9px] uppercase tracking-[0.36em] text-[#F7D9A0]">
                Save the date
              </span>
              <span className="mt-1 text-sm tracking-[0.16em] text-[#FFF8EE]">
                {formatDate(eventDate)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="animate-fade-up-delay-4">
          {guestName ? (
            <div className="rounded-t-[1.75rem] border border-white/25 bg-[#FFF8EE]/12 px-5 py-4 text-center backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[0.34em] text-[#F7D9A0]">
                Kepada Yth.
              </p>
              <p className="mt-1 break-words font-[family-name:var(--font-script)] text-3xl text-[#FFF8EE]">
                {guestName}
              </p>
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/25 pt-4">
            <span className="text-[8px] uppercase tracking-[0.32em] text-white/55">
              Scroll to explore
            </span>
            <ArrowDown className="h-4 w-4 animate-bounce text-[#F7D9A0]" />
          </div>
        </div>
      </div>
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
    <Section tone="cream">
      <Reveal className="text-center">
        <div className="mx-auto flex h-24 w-20 items-center justify-center rounded-t-full border-2 border-[#E8D5C2] bg-white/70 shadow-sm">
          <span className="font-[family-name:var(--font-script)] text-2xl text-[#173B2F]">
            {groomInitial}
            <span className="mx-0.5 text-[#E15B44]">&amp;</span>
            {brideInitial}
          </span>
        </div>

        <p className="mt-6 text-[9px] uppercase tracking-[0.42em] text-[#C0553F]">
          The Invitation
        </p>

        {customMessage ? (
          <p className="mx-auto mt-5 max-w-md font-[family-name:var(--font-serif-elegant)] text-[1.35rem] font-light leading-relaxed text-[#173B2F]/90">
            {customMessage}
          </p>
        ) : null}

        <LeafSprig className="mx-auto mt-6 h-8 w-28" color={FL.leaf} />

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
    <Section tone="green">
      <Reveal className="relative text-center">
        <Quote className="mx-auto h-8 w-8" style={{ color: FL.marigold }} />
        <p
          className="mx-auto mt-5 max-w-lg whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-[1.4rem] font-light italic leading-relaxed sm:text-[1.6rem]"
          style={{ color: FL.cream }}
        >
          {text}
        </p>
        {source ? (
          <p
            className="mt-6 text-[9px] uppercase tracking-[0.34em]"
            style={{ color: FL.marigold }}
          >
            {source}
          </p>
        ) : null}
        <Flower
          className="mx-auto mt-7 h-8 w-8 opacity-90"
          petal={FL.coral}
          center={FL.marigold}
        />
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai                                                            */
/* ------------------------------------------------------------------ */

function CoupleSection({ groom, bride }: { groom?: Person; bride?: Person }) {
  return (
    <Section tone="blush">
      <SectionHead eyebrow="Bride & Groom" title="Kedua Mempelai" />
      <Reveal>
        <div className="mt-11 grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-8">
          <PersonCard
            person={groom}
            role="Mempelai Pria"
            accent={FL.marigold}
            petal={FL.coral}
          />
          <PersonCard
            person={bride}
            role="Mempelai Wanita"
            accent={FL.coral}
            petal={FL.peony}
          />
        </div>
        <p className="mx-auto mt-12 max-w-sm text-center font-[family-name:var(--font-serif-elegant)] text-sm italic leading-relaxed text-[#7C6A5B]">
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
  accent,
  petal,
}: {
  person?: Person;
  role: string;
  accent: string;
  petal: string;
}) {
  const name = person?.name ?? "-";
  const nickname =
    person?.nickname && person.name && person.nickname !== person.name
      ? person.nickname
      : undefined;
  const instagram = instagramHandle(person?.instagram);

  return (
    <figure className="group relative mx-auto w-full max-w-[15.5rem]">
      <span
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-full rounded-b-[2rem]"
        style={{ backgroundColor: accent }}
      />
      <div className="relative overflow-hidden rounded-t-full rounded-b-[2rem] border-[5px] border-[#FFF8EE] bg-[#F2DCCB] shadow-xl shadow-[#173B2F]/15">
        {person?.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={person.photoUrl}
            alt={name}
            className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-[#F6E4D4]">
            <Flower className="h-16 w-16 opacity-80" petal={petal} center={accent} />
          </div>
        )}
      </div>

      <Flower
        className="absolute -left-5 top-6 h-12 w-12 drop-shadow-sm"
        petal={petal}
        center={FL.marigold}
      />
      <Flower
        className="absolute -right-3 bottom-16 h-8 w-8 opacity-90"
        petal={FL.marigold}
        center={FL.cream}
      />

      <figcaption className="relative mt-5 text-center">
        <p className="text-[9px] uppercase tracking-[0.32em] text-[#C0553F]">
          {role}
        </p>
        <h3 className="mt-1.5 break-words font-[family-name:var(--font-display)] text-2xl leading-tight text-[#173B2F]">
          {name}
        </h3>
        {nickname ? (
          <p className="mt-0.5 font-[family-name:var(--font-script)] text-2xl text-[#D8407A]">
            {nickname}
          </p>
        ) : null}
        {person?.parentName ? (
          <p className="mt-2 text-xs leading-relaxed text-[#7C6A5B]">
            {person.parentName}
          </p>
        ) : null}
        {person?.bio ? (
          <p className="mt-2 border-t border-[#E8D5C2] pt-2.5 text-xs italic leading-relaxed text-[#7C6A5B]">
            &ldquo;{person.bio}&rdquo;
          </p>
        ) : null}
        {instagram ? (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-[#173B2F] transition-opacity hover:opacity-60"
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
  const petalTones = [FL.coral, FL.marigold, FL.peony, FL.leaf];
  return (
    <Section tone="peach">
      <SectionHead eyebrow="Our Story" title="Cerita Kami" />
      <Reveal>
        <div className="relative mt-10">
          <span
            aria-hidden
            className="absolute left-[13px] top-3 w-[2px]"
            style={{
              height: "calc(100% - 2.5rem)",
              background: `linear-gradient(${FL.leaf}, ${FL.coral})`,
            }}
          />
          <ol className="space-y-8">
            {story.map((item, index) => (
              <li key={item.id} className="relative pl-11">
                <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8EE]">
                  <Flower
                    className="h-6 w-6"
                    petal={petalTones[index % petalTones.length]}
                    center={FL.cream}
                  />
                </span>
                <p className="text-[9px] uppercase tracking-[0.28em] text-[#C0553F]">
                  {formatDate(item.date) || "Momen"}
                </p>
                {item.title ? (
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight text-[#173B2F]">
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
    <Section id="acara" tone="green">
      <SectionHead eyebrow="Save the Date" title="Hari Bahagia" dark />

      <Reveal>
        {date ? (
          <div className="mt-10 flex items-center justify-center gap-5">
            <div className="text-center">
              <span className="block font-[family-name:var(--font-display)] text-[4.5rem] leading-[0.8] text-[#FFF8EE]">
                {date.day}
              </span>
              <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] text-[#F7D9A0]">
                {date.month} {date.year}
              </span>
            </div>
            <span aria-hidden className="h-24 w-px bg-white/20" />
            <div className="min-w-0 text-left">
              <p className="text-[9px] uppercase tracking-[0.32em] text-white/55">
                {date.weekday}
              </p>
              {eventTime ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#FFF8EE]/90">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#F7D9A0]" />
                  {formatTime(eventTime)}
                </p>
              ) : null}
              {venue ? (
                <p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed text-[#FFF8EE]/90">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F7D9A0]" />
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
              className="inline-flex items-center gap-2 rounded-full bg-[#FFF8EE] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F3B2B] transition hover:bg-white"
            >
              <MapPin className="h-3.5 w-3.5" />
              Lihat Peta
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {venue ? (
            <SaveToCalendarButton
              title={`${eventTitle} — ${coupleTitle}`}
              date={eventDate}
              time={eventTime}
              location={[venue, location].filter(Boolean).join(", ")}
              className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#F7D9A0]/60 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7D9A0] transition hover:bg-[#F7D9A0]/10"
            />
          ) : null}
        </div>
      </Reveal>

      {schedule.length > 0 ? (
        <Reveal className="mt-12">
          <p className="text-center text-[9px] uppercase tracking-[0.36em] text-[#F7D9A0]">
            Rangkaian Acara
          </p>
          <div className="mt-5 space-y-3.5">
            {schedule.map((event, index) => (
              <ScheduleCard
                key={event.id}
                event={event}
                accent={[FL.coral, FL.marigold, FL.peony, FL.leaf][index % 4]}
              />
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
    { label: "Hari", value: left.days, bg: FL.coral, fg: FL.cream },
    { label: "Jam", value: left.hours, bg: FL.marigold, fg: FL.green },
    { label: "Menit", value: left.minutes, bg: FL.peony, fg: FL.cream },
    { label: "Detik", value: left.seconds, bg: FL.leaf, fg: FL.cream },
  ];
  if (!target) return null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Hitung mundur acara">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-2xl px-1 py-3 shadow-lg shadow-black/20"
          style={{ backgroundColor: item.bg, color: item.fg }}
        >
          <span className="font-[family-name:var(--font-display)] text-xl tabular-nums sm:text-2xl">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="mt-0.5 text-[8px] uppercase tracking-[0.18em] sm:text-[9px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScheduleCard({
  event,
  accent,
}: {
  event: EventList[number];
  accent: string;
}) {
  const date = dateParts(event.date);
  return (
    <article className="relative overflow-hidden rounded-2xl bg-[#FFF8EE] p-4 text-left shadow-lg shadow-black/15 sm:p-5">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start gap-4 pl-2">
        <span
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-[#FFF8EE]"
          style={{ backgroundColor: accent }}
        >
          <span className="font-[family-name:var(--font-display)] text-lg leading-none">
            {date?.day ?? "•"}
          </span>
          <span className="mt-0.5 text-[8px] uppercase tracking-wide">
            {date?.monthShort ?? "—"}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="break-words font-[family-name:var(--font-display)] text-lg leading-tight text-[#173B2F]">
            {event.title ?? "Acara"}
          </h3>
          {event.time ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7C6A5B]">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#C0553F]" />
              {formatTime(event.time)}
            </p>
          ) : null}
          {event.location ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-[#7C6A5B]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C0553F]" />
              <span className="break-words">{event.location}</span>
            </p>
          ) : null}
          {event.locationMap ? (
            <a
              href={event.locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#E15B44] transition hover:text-[#C0553F] hover:underline"
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
  const frameTones = [FL.coral, FL.marigold, FL.peony, FL.leaf];

  return (
    <Section id="galeri" tone="cream">
      <SectionHead eyebrow="Gallery" title="Galeri Momen" />

      <Reveal className="mt-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {gallery.map((item, index) => {
            const first = index === 0;
            const isLastWide =
              restCount % 2 === 1 && index === gallery.length - 1 && !first;
            const wide = first || isLastWide;
            return (
              <GalleryTile
                key={item.id}
                item={item}
                index={index}
                wide={wide}
                tone={frameTones[index % frameTones.length]}
                onOpen={() => setSelected(index)}
              />
            );
          })}
        </div>
      </Reveal>

      {current ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A2A20]/95 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Foto galeri"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Tutup"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
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
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10 sm:left-6"
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
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10 sm:right-6"
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
              <figcaption className="mt-4 max-w-md text-center text-[10px] uppercase tracking-[0.28em] text-[#F7D9A0]">
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
  tone,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  wide: boolean;
  tone: string;
  onOpen: () => void;
}) {
  const first = index === 0;
  return (
    <figure className={`relative ${wide ? "col-span-2" : ""}`}>
      <span
        aria-hidden
        className={`absolute inset-0 translate-x-2 translate-y-2 ${
          first ? "rounded-t-[2.5rem] rounded-b-2xl" : "rounded-2xl"
        }`}
        style={{ backgroundColor: tone }}
      />
      <button
        type="button"
        onClick={onOpen}
        aria-label={item.caption ? `Perbesar foto: ${item.caption}` : "Perbesar foto"}
        className={`group relative block w-full cursor-pointer overflow-hidden border-[5px] border-[#FFF8EE] bg-[#F2DCCB] shadow-lg shadow-[#173B2F]/15 ${
          first
            ? "aspect-[4/3] rounded-t-[2.5rem] rounded-b-2xl"
            : wide
              ? "aspect-[16/10] rounded-2xl"
              : "aspect-[3/4] rounded-2xl"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption ?? "Foto galeri"}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0A2A20]/65 via-transparent to-transparent" />
        {item.caption ? (
          <span className="absolute inset-x-0 bottom-0 p-3 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-[#FFF8EE]">
            {item.caption}
          </span>
        ) : null}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF8EE]/90 text-[#173B2F] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
    <Section id="rsvp" tone="blush">
      <SectionHead eyebrow="RSVP" title="Konfirmasi Kehadiran" />
      <Reveal>
        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-[#7C6A5B]">
          Mohon konfirmasi kehadiran Anda agar kami dapat menyambut Anda dengan
          sebaik-baiknya.
        </p>
        <div className="relative mx-auto mt-8 max-w-md rounded-3xl border border-[#E8D5C2] bg-white p-6 shadow-xl shadow-[#173B2F]/10 sm:p-8">
          <span
            aria-hidden
            className="absolute -top-4 left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border-4 border-[#FDEFE1]"
            style={{ backgroundColor: FL.marigold }}
          />
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
  const tones = [FL.coral, FL.marigold, FL.peony, FL.leaf];
  return (
    <Section id="kado" tone="cream">
      <SectionHead eyebrow="Wedding Gift" title="Tanda Kasih" />
      <Reveal>
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-[#7C6A5B]">
          Doa restu Anda adalah hadiah terindah. Bila ingin memberikan tanda
          kasih, Anda dapat menyalurkannya melalui:
        </p>
        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gifts.map((gift, index) => (
            <article
              key={gift.id}
              className="relative overflow-hidden rounded-2xl border border-[#E8D5C2] bg-white p-5 text-left shadow-sm"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: tones[index % tones.length] }}
              />
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#C0553F]">
                    {gift.provider}
                  </p>
                  {gift.name ? (
                    <p className="mt-0.5 truncate text-xs text-[#7C6A5B]">
                      {gift.name}
                    </p>
                  ) : null}
                </div>
                <Flower
                  className="h-7 w-7 shrink-0"
                  petal={tones[index % tones.length]}
                  center={FL.cream}
                />
              </div>
              <p className="mt-4 break-all font-mono text-base font-semibold tracking-wide text-[#173B2F] sm:text-lg">
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
    <Section id="ucapan" tone="lilac">
      <SectionHead eyebrow="Wedding Wall" title="Ucapan & Doa" />
      <Reveal>
        <div className="mt-8">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[#E8D5C2] bg-white"
            nameClass="text-[#C0553F]"
            avatarClass="bg-gradient-to-br from-[#E15B44] to-[#D8407A] text-white"
            emptyClass="text-[#9C8A7A]"
          />
        </div>
        <div className="relative mx-auto mt-8 max-w-md rounded-3xl border border-[#E8D5C2] bg-white p-6 shadow-xl shadow-[#173B2F]/10 sm:p-8">
          <p className="mb-5 text-center text-[9px] uppercase tracking-[0.34em] text-[#C0553F]">
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
    <footer className="relative overflow-hidden bg-[#0F3B2B] px-6 py-16 text-center text-[#FFF8EE]">
      <Flower
        className="fl-float-slow pointer-events-none absolute -left-6 top-6 h-24 w-24 opacity-50"
        petal={FL.peony}
        center={FL.marigold}
      />
      <Flower
        className="fl-float pointer-events-none absolute -right-4 bottom-8 h-20 w-20 opacity-50"
        petal={FL.coral}
        center={FL.marigold}
      />
      <LeafSprig
        className="pointer-events-none absolute right-10 top-16 h-8 w-24 opacity-40"
        color={FL.marigold}
      />

      <div className="relative mx-auto max-w-md">
        <p className="text-[9px] uppercase tracking-[0.42em] text-[#F7D9A0]">
          Thank You
        </p>
        <p className="mt-5 font-[family-name:var(--font-script)] text-[clamp(2.6rem,12vw,3.6rem)] leading-[1.05]">
          {groomNick ?? "Pria"}
          <span className="mx-2 text-[#F7D9A0]">&amp;</span>
          {brideNick ?? "Wanita"}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Terima kasih atas doa &amp; kehadiran Anda
        </p>

        <div className="mt-9 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-[#F7D9A0]/40" />
          <Flower className="h-5 w-5" petal={FL.coral} center={FL.marigold} />
          <span className="h-px w-12 bg-[#F7D9A0]/40" />
        </div>

        <p className="mt-7 text-[9px] uppercase tracking-[0.34em] text-white/35">
          Meduta — {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
