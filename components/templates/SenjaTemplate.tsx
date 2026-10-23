"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  House,
  Images,
  MapPin,
  MessageCircle,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import CopyButton from "./CopyButton";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import { useCountdown, SaveToCalendarButton } from "./SharedWidgets";
import { formatDate, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Senja Editorial — adopsi presisi dari desain referensi "Nadira & Arkan"
 * (palet beige #F7F3EE / rose #C99591 / brown #403633, tipografi Cormorant
 * editorial, ornamen floral SVG, kelopak jatuh, nav scroll-intent). Diubah
 * menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, kisah, galeri, kado)
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan di DB
 * - Musik latar user (BackgroundMusic) — bukan osilator Web Audio sintetis
 * - Gerbang menutup seluruh undangan: foto + overlay brown + tombol "Buka"
 * - Prioritas foto: gatePhoto (user > admin) > mempelai > galeri[0]
 * - Responsive master-mobile: mobile kolom (≤640), tablet md:, editorial
 *   laptop lg (hero asimetris, galeri mosaik 12-kolom offset, timeline
 *   tengah alternating, acara berdampingan dengan pemisah vertikal)
 */

const SN = {
  bg: "#F7F3EE",
  bg2: "#EFE7DE",
  beige: "#DCCFC1",
  rose: "#C99591",
  pink: "#D9B4B0",
  brown: "#403633",
  text: "#514846",
  cream: "#FBF8F4",
  accent: "#B08A70",
  accentInk: "#8F6B52",
  accentDeep: "#9A7358",
  sage: "#8E9A82",
  line: "rgba(176,138,112,.38)",
} as const;

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };
type SenjaNavItem = { id: string; label: string; Icon: LucideIcon };

export default function SenjaTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const [closing, setClosing] = useState(false);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <SenjaShell
      {...props}
      data={isEmbed ? { ...props.data, musicUrl: undefined } : props.data}
      gateOpen={gateOpen}
      closing={closing}
      onGateOpen={() => {
        // Musik dimulai sinkron-sinkron saat klik (kebijakan autoplay);
        // konten dibebaskan saat gerbang sedang fade-out.
        setClosing(true);
        music.play();
        window.setTimeout(() => {
          setGateOpen(true);
          setClosing(false);
        }, 700);
      }}
      music={music}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function SenjaShell({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
  decorations,
  gateOpen = true,
  closing = false,
  onGateOpen,
  music,
}: TemplateProps & GateProps & { music?: MusicController; closing?: boolean }) {
  if (!isPublished) {
    return <DraftNotice />;
  }

  const groom = data.groom;
  const bride = data.bride;
  const groomNick = groom?.nickname ?? groom?.name ?? "Pria";
  const brideNick = bride?.nickname ?? bride?.name ?? "Wanita";
  const events = data.events ?? [];
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];
  const navItems: SenjaNavItem[] = [
    { id: "home", label: "Home", Icon: House },
    ...(groom?.name || bride?.name
      ? [{ id: "mempelai", label: "Mempelai", Icon: UsersRound }]
      : []),
    ...(events.length > 0 || data.eventDate
      ? [{ id: "acara", label: "Acara", Icon: CalendarDays }]
      : []),
    ...(story.length > 0
      ? [{ id: "kisah", label: "Kisah", Icon: Heart }]
      : []),
    ...(gallery.length > 0
      ? [{ id: "galeri", label: "Galeri", Icon: Images }]
      : []),
    { id: "rsvp", label: "RSVP", Icon: CalendarDays },
    { id: "ucapan", label: "Ucapan", Icon: MessageCircle },
  ];

  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: groom?.photoUrl,
    bridePhotoUrl: bride?.photoUrl,
    firstGalleryUrl: gallery[0]?.url,
  });
  const heroPhoto = gatePhoto;
  const closingPhoto = gatePhoto;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans font-light antialiased"
      style={{
        backgroundColor: SN.bg,
        color: SN.text,
        fontFamily: '"Jost", "Helvetica Neue", Arial, sans-serif',
        fontSize: 15,
        lineHeight: 1.85,
      }}
    >
      {/* Keyframes khusus Senja (scroll cue, zoom foto lambat, kelopak jatuh) */}
      <style dangerouslySetInnerHTML={{ __html: SENJA_KINETICS }} />

      {(!gateOpen || closing) && onGateOpen && (
        <SenjaGate
          photoUrl={gatePhoto || bgUrl}
          brideNick={brideNick}
          groomNick={groomNick}
          eventDate={data.eventDate}
          guestName={guestName}
          onOpen={onGateOpen}
          closing={closing}
        />
      )}

      <main className="w-full">
        <Hero
          photo={heroPhoto}
          brideNick={brideNick}
          groomNick={groomNick}
          eventDate={data.eventDate}
        />

        {/* Kutipan — prioritas user → admin; disembunyikan bila dimatikan */}
        {!data.quoteHidden && data.quoteText?.trim() ? (
          <Quote
            title={data.quoteTitle}
            text={data.quoteText.trim()}
            source={data.quoteSource}
          />
        ) : null}

        {(groom?.name || bride?.name) && (
          <Couple groom={groom} bride={bride} />
        )}

        {data.eventDate ? (
          <Countdown eventDate={data.eventDate} photo={closingPhoto} />
        ) : null}

        {events.length > 0 || data.eventDate ? (
          <Acara
            eventDate={data.eventDate}
            eventTime={data.eventTime}
            venueName={data.venueName}
            location={data.location}
            locationMap={data.locationMap}
            events={events}
          />
        ) : null}

        {story.length > 0 ? <Kisah story={story} /> : null}

        {gallery.length > 0 ? <Galeri gallery={gallery} /> : null}

        <Rsvp invitationId={invitationId} guestName={guestName} />

        {gifts.length > 0 ? <Kado gifts={gifts} /> : null}

        <Ucapan invitationId={invitationId} wishes={wishes} />

        <Closing brideNick={brideNick} groomNick={groomNick} photo={closingPhoto} />
      </main>

      <SenjaFooter brideNick={brideNick} groomNick={groomNick} />
      <SenjaNavigation items={navItems} visible={gateOpen} />

      {/* FAB musik latar user */}
      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          positionClassName="fixed bottom-24 right-4 z-[65] md:bottom-24 md:right-7"
          buttonClassName="border border-[rgba(176,138,112,.4)] bg-[rgba(247,243,238,.85)] text-[#403633] shadow-md backdrop-blur-md"
        />
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: SN.bg, color: SN.brown }}
    >
      <Floral sym="cluster" className="h-16 w-16 opacity-70" />
      <p className="font-[family-name:var(--font-serif-elegant)] text-xl">Undangan belum dipublikasikan</p>
      <p className="text-sm opacity-60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

function SenjaNavigation({
  items,
  visible,
}: {
  items: SenjaNavItem[];
  visible: boolean;
}) {
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".senja-nav a[href^='#']"),
    );
    const sections = links
      .map((link) => document.getElementById(link.hash.slice(1)))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              Math.abs(first.boundingClientRect.top) -
              Math.abs(second.boundingClientRect.top),
          )[0];
        if (visibleSection) setActiveId(visibleSection.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Navigasi undangan"
      aria-hidden={!visible}
      className={`senja-nav ${visible ? "is-visible" : ""}`}
    >
      {items.map(({ id, label, Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={activeId === id ? "location" : undefined}
          className={activeId === id ? "is-active" : ""}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

function SenjaFooter({
  brideNick,
  groomNick,
}: {
  brideNick: string;
  groomNick: string;
}) {
  return (
    <footer className="senja-footer">
      <p>
        {brideNick} &amp; {groomNick} E-Invitation
      </p>
      <p>
        Made with <Heart aria-label="cinta" />
        @meduta 2026
      </p>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Ornamen floral SVG — cluster & sprig, digambar dari desain           */
/* ------------------------------------------------------------------ */

function Floral({
  sym,
  className = "",
}: {
  sym: "cluster" | "sprig";
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox={sym === "sprig" ? "0 0 140 320" : "0 0 300 300"}
      aria-hidden="true"
      focusable="false"
    >
      {sym === "cluster" ? <Cluster /> : <Sprig />}
    </svg>
  );
}

function Cluster() {
  return (
    <g>
      <g fill="none" stroke="#8E9A82" strokeWidth="1.5" strokeLinecap="round">
        <path d="M-6 28C62 48 132 102 198 198S258 268 292 296" />
        <path d="M28 -6C84 40 150 58 272 70" />
        <path d="M-6 112C42 122 84 166 112 236" />
        <path d="M60 -6C70 50 110 90 150 112" />
      </g>
      <g fill="#9AA58C" opacity=".92">
        <ellipse cx="44" cy="40" rx="17" ry="7" transform="rotate(-18 44 40)" />
        <ellipse cx="92" cy="74" rx="16" ry="6.5" transform="rotate(-50 92 74)" />
        <ellipse cx="138" cy="124" rx="17" ry="7" transform="rotate(32 138 124)" />
        <ellipse cx="168" cy="166" rx="16" ry="6.5" transform="rotate(-60 168 166)" />
        <ellipse cx="206" cy="214" rx="17" ry="7" transform="rotate(25 206 214)" />
        <ellipse cx="248" cy="262" rx="16" ry="6.5" transform="rotate(-48 248 262)" />
        <ellipse cx="96" cy="26" rx="15" ry="6.5" transform="rotate(14 96 26)" />
        <ellipse cx="186" cy="52" rx="16" ry="6.5" transform="rotate(-24 186 52)" />
      </g>
      <g fill="#B5BEA8" opacity=".95">
        <circle cx="118" cy="98" r="9" />
        <circle cx="196" cy="88" r="8" />
        <circle cx="150" cy="76" r="7" />
        <circle cx="124" cy="200" r="8" />
        <circle cx="224" cy="150" r="8" />
        <circle cx="262" cy="244" r="8" />
      </g>
      <g fill="#FBF8F4" stroke="#DCCFC1" strokeWidth=".6">
        <circle cx="134" cy="150" r="3.4" />
        <circle cx="214" cy="92" r="3.4" />
        <circle cx="52" cy="170" r="3.2" />
      </g>
      {/* Mawar utama */}
      <g transform="translate(176 62)">
        <g fill="#D9B4B0" stroke="#C99591" strokeWidth=".7" opacity=".95">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse key={a} cx="0" cy="-20" rx="14" ry="21" transform={`rotate(${a})`} />
          ))}
        </g>
        <g fill="#E6C9C5" stroke="#C99591" strokeWidth=".6">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-11" rx="9" ry="13" transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r="5" fill="#C99591" />
      </g>
      <g transform="translate(84 84)">
        <circle r="35" fill="#C99591" />
        <circle r="27" fill="#D9B4B0" />
        <path
          d="M-21 -4C-15 -23 15 -23 19 -2C21 15 -6 23 -15 10C-21 0 -4 -13 4 -6C9 -2 2 6 -3 4"
          fill="none"
          stroke="#C99591"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle r="8" fill="#C99591" opacity=".85" />
      </g>
      <g transform="translate(44 176)">
        <circle r="24" fill="#D9B4B0" />
        <circle r="17" fill="#E6C9C5" />
        <circle r="5" fill="#C99591" />
      </g>
      <g transform="translate(218 152)">
        <circle r="16" fill="#C99591" opacity=".88" />
        <circle r="10" fill="#D9B4B0" />
        <circle r="4" fill="#C99591" />
      </g>
    </g>
  );
}

function Sprig() {
  return (
    <g>
      <path
        d="M72 324C60 240 84 160 62 80S70 10 72 -4"
        fill="none"
        stroke="#8E9A82"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g fill="#9AA58C">
        <ellipse cx="50" cy="40" rx="17" ry="7" transform="rotate(-30 50 40)" />
        <ellipse cx="88" cy="62" rx="17" ry="7" transform="rotate(28 88 62)" />
        <ellipse cx="46" cy="132" rx="18" ry="7" transform="rotate(-24 46 132)" />
        <ellipse cx="94" cy="154" rx="18" ry="7" transform="rotate(30 94 154)" />
        <ellipse cx="52" cy="214" rx="18" ry="7" transform="rotate(-26 52 214)" />
        <ellipse cx="96" cy="240" rx="18" ry="7" transform="rotate(26 96 240)" />
      </g>
      <g fill="#B5BEA8">
        <circle cx="38" cy="82" r="8" />
        <circle cx="92" cy="104" r="8" />
        <circle cx="40" cy="174" r="8" />
        <circle cx="98" cy="196" r="8" />
      </g>
      <g transform="translate(66 108)">
        <circle r="21" fill="#C99591" />
        <circle r="15" fill="#D9B4B0" />
        <circle r="4.5" fill="#C99591" />
      </g>
    </g>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`mx-auto block h-9 w-64 max-w-full ${className}`}
      viewBox="0 0 260 44"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 22H98M162 22H254" stroke="#B08A70" strokeWidth=".8" opacity=".6" />
      <g fill="#9AA58C">
        <ellipse cx="108" cy="16" rx="12" ry="4.6" transform="rotate(-20 108 16)" />
        <ellipse cx="108" cy="28" rx="12" ry="4.6" transform="rotate(20 108 28)" />
        <ellipse cx="152" cy="16" rx="12" ry="4.6" transform="rotate(20 152 16)" />
        <ellipse cx="152" cy="28" rx="12" ry="4.6" transform="rotate(-20 152 28)" />
      </g>
      <g transform="translate(130 22)">
        <circle r="11" fill="#C99591" />
        <circle r="7.5" fill="#D9B4B0" />
      </g>
    </svg>
  );
}

/* Nama mempelai: judul besar dengan "&" script di baris tersendiri */
function NamesTitle({
  brideNick,
  groomNick,
  cream = false,
  size = "large",
}: {
  brideNick: string;
  groomNick: string;
  cream?: boolean;
  size?: "large" | "medium";
}) {
  return (
    <h1
      className={`font-[family-name:var(--font-serif-elegant)] font-light leading-[0.95] tracking-tight ${
        size === "large" ? "text-5xl sm:text-6xl lg:text-7xl xl:text-8xl" : "text-4xl sm:text-5xl"
      }`}
      style={{ color: cream ? SN.cream : SN.brown }}
    >
      {brideNick}
      <span className="my-1 block font-[family-name:var(--font-script)] text-3xl leading-none tracking-normal sm:text-4xl" style={{ color: SN.pink }}>
        &amp;
      </span>
      {groomNick}
    </h1>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang (Buka Undangan)                                             */
/* ------------------------------------------------------------------ */

function SenjaGate({
  photoUrl,
  brideNick,
  groomNick,
  eventDate,
  guestName,
  onOpen,
  closing = false,
}: {
  photoUrl?: string;
  brideNick: string;
  groomNick: string;
  eventDate?: string;
  guestName?: string;
  onOpen: () => void;
  closing?: boolean;
}) {
  // Kunci scroll halaman selama gerbang masih terpasang
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleOpen = () => {
    if (closing) return;
    onOpen();
  };

  return (
    <div
      role="dialog"
      aria-label="Sampul undangan"
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-end overflow-hidden text-center ${
        closing ? "animate-gate-open" : ""
      }`}
      style={{ color: SN.cream, backgroundColor: SN.brown }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80"}
        alt=""
        className="animate-float-slow absolute inset-0 h-full w-full scale-105 object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(64,54,51,.84) 0%, rgba(64,54,51,.46) 48%, rgba(201,149,145,.2) 100%)",
        }}
      />
      {/* Ornamen floral di dua sudut atas */}
      <Floral sym="cluster" className="absolute -left-10 -top-8 w-40 opacity-70 sm:w-52 md:-left-14 md:top-0 md:w-72" />
      <Floral sym="cluster" className="absolute -right-10 -top-8 w-40 opacity-70 sm:w-52 md:-right-14 md:top-0 md:w-72" />

      <div className="relative z-10 flex w-full flex-col items-center gap-4 px-6 pb-16 pt-10 md:pb-24">
        <p className="animate-fade-up text-[11px] uppercase tracking-[0.46em]" style={{ color: "#EBD9CB" }}>
          The Wedding of
        </p>
        <div className="animate-fade-up-delay-1 drop-shadow-2xl">
          <NamesTitle brideNick={brideNick} groomNick={groomNick} cream size="large" />
        </div>
        {eventDate && (
          <p
            className="animate-fade-up-delay-2 text-[12px] uppercase tracking-[0.34em]"
            style={{ color: "#F2E7DC" }}
          >
            {formatDate(eventDate)}
          </p>
        )}
        {guestName && (
          <div className="animate-fade-up-delay-3 mt-4 flex flex-col items-center gap-1">
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">Kepada:</p>
            <p className="font-[family-name:var(--font-serif-elegant)] text-2xl italic sm:text-3xl">{guestName}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleOpen}
          className="animate-fade-up-delay-4 mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/70 bg-white/10 px-8 py-3.5 text-[10.5px] uppercase tracking-[0.26em] backdrop-blur-md transition-all duration-300 hover:bg-white/20 active:scale-95"
          style={{ color: SN.cream }}
        >
          <BookOpen className="h-4 w-4" />
          Buka Undangan
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero editorial — mobile stack, laptop split (teks | foto organik)    */
/* ------------------------------------------------------------------ */

function Hero({
  photo,
  brideNick,
  groomNick,
  eventDate,
}: {
  photo?: string;
  brideNick: string;
  groomNick: string;
  eventDate?: string;
}) {
  return (
    <section
      id="home"
      className="relative overflow-hidden pb-20 pt-16 md:pt-20 lg:pb-28 lg:pt-24"
      style={{ background: `radial-gradient(120% 60% at 50% 0%, #F1E2DA 0%, ${SN.bg} 62%), ${SN.bg}` }}
    >
      <Floral sym="sprig" className="absolute -left-6 top-[18%] w-16 rotate-[-8deg] opacity-90 sm:w-20 lg:w-28" />
      <Floral sym="sprig" className="absolute -right-6 top-[30%] w-16 -scale-x-100 rotate-[-8deg] opacity-90 sm:w-20 lg:w-28" />
      <Floral sym="cluster" className="absolute -right-16 -top-8 w-40 opacity-90 md:w-56" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        {/* Mobile & tablet: kolom tengah. Laptop: editorial asimetris */}
        <div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="flex flex-col items-center gap-4 text-center lg:col-span-7 lg:items-start lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.46em]" style={{ color: SN.accentInk }}>
              The Wedding of
            </p>
            <NamesTitle brideNick={brideNick} groomNick={groomNick} size="large" />
          </div>

          <div className="relative z-10 mx-auto mt-10 w-64 sm:w-72 lg:col-span-5 lg:mx-0 lg:mt-0 lg:w-full lg:max-w-[460px]">
            <div
              className="aspect-[4/5] overflow-hidden shadow-[0_38px_60px_-34px_rgba(64,54,51,.55)]"
              style={{
                borderRadius: "48% 52% 46% 54% / 36% 38% 62% 64%",
                backgroundColor: SN.beige,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo ?? "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=70"}
                alt={`Foto ${brideNick} dan ${groomNick}`}
                className="h-full w-full object-cover"
              />
            </div>
            <Floral sym="cluster" className="absolute -bottom-8 -left-12 w-28 sm:w-32 lg:w-40" />
            <Floral sym="cluster" className="absolute -right-8 -top-6 w-20 opacity-90 lg:w-24" />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center lg:mt-16 xl:items-start xl:text-left">
          <p className="text-[11px] uppercase tracking-[0.46em]" style={{ color: SN.accentInk }}>
            Save the Date
          </p>
          {eventDate && (
            <p className="text-[12px] uppercase tracking-[0.34em]" style={{ color: SN.brown }}>
              {formatDate(eventDate)}
            </p>
          )}
          <div className="mt-2 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.34em]" style={{ color: SN.accentInk }}>
            <span>Scroll</span>
            <i className="sn-scroll-line block w-px" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kutipan                                                             */
/* ------------------------------------------------------------------ */

function Quote({ title, text, source }: { title?: string; text: string; source?: string }) {
  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <Floral sym="cluster" className="absolute -left-16 -top-10 w-48 opacity-85" />
      <Floral sym="cluster" className="absolute -bottom-10 -right-16 w-48 opacity-85" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-5 px-6 text-center">
        {title ? (
          <p className="text-[11px] uppercase tracking-[0.46em]" style={{ color: SN.accentInk }}>
            {title}
          </p>
        ) : null}
        <blockquote
          className="font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed sm:text-xl"
          style={{ color: SN.brown }}
        >
          &ldquo;{text}&rdquo;
        </blockquote>
        {source ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: SN.accentInk }}>
            {source}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai — frame foto lengkung + ornamen bunga                      */
/* ------------------------------------------------------------------ */

function Person({
  nick,
  name,
  photo,
  parentName,
  childOf,
  side,
}: {
  nick: string;
  name?: string;
  photo?: string;
  parentName?: string;
  childOf?: string;
  side: "w" | "m";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="relative mb-6 w-56 max-w-full sm:w-64 lg:w-72">
        {/* Garis bingkai offset */}
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-3 translate-y-3"
          style={{ border: `1px solid ${SN.line}`, borderRadius: "999px 999px 24px 24px" }}
        />
        <div
          className="relative aspect-[3/4] overflow-hidden shadow-[0_30px_50px_-30px_rgba(64,54,51,.5)]"
          style={{ borderRadius: "999px 999px 18px 18px", backgroundColor: SN.beige }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`Potret ${nick}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${SN.rose}33` }}>
              <Heart className="h-10 w-10" style={{ color: SN.rose }} />
            </div>
          )}
        </div>
        {side === "w" ? (
          <>
            <Floral sym="cluster" className="absolute -bottom-8 -left-11 w-28 sm:w-32" />
            <Floral sym="sprig" className="absolute -right-5 top-[14%] w-14 -scale-x-100 opacity-90" />
          </>
        ) : (
          <>
            <Floral sym="cluster" className="absolute -bottom-8 -right-11 w-28 sm:w-32" />
            <Floral sym="sprig" className="absolute -left-5 top-[14%] w-14 opacity-90" />
          </>
        )}
      </div>
      <h3 className="font-[family-name:var(--font-serif-elegant)] font-light leading-tight text-4xl sm:text-5xl" style={{ color: SN.brown }}>
        {nick}
      </h3>
      {photo && name && (
        <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: SN.accentInk }}>
          {name}
        </p>
      )}
      {childOf && (
        <p className="text-sm leading-relaxed">{childOf}</p>
      )}
      {parentName && (
        <p className="text-sm leading-relaxed">
          {childOf ? "" : "Putra/Putri"} dari <b className="font-normal" style={{ color: SN.brown }}>{parentName}</b>
        </p>
      )}
    </div>
  );
}

function Couple({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section
      id="mempelai"
      className="relative overflow-hidden py-20 md:py-24"
      style={{ background: `linear-gradient(${SN.bg}, ${SN.bg2} 14%, ${SN.bg2} 86%, ${SN.bg})` }}
    >
      <Floral sym="cluster" className="absolute -right-14 -top-6 w-44 opacity-80" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.46em]" style={{ color: SN.accentInk }}>
          Mempelai
        </p>
        <p className="mx-auto mb-14 mt-5 max-w-sm font-[family-name:var(--font-serif-elegant)] text-2xl italic leading-snug sm:text-3xl" style={{ color: SN.brown }}>
          Kami mohon do&apos;a &amp; restunya atas pernikahan kami
        </p>
        <div className="grid grid-cols-1 items-center justify-items-center gap-14 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6">
          <Person
            side="w"
            nick={bride?.nickname ?? bride?.name ?? "Wanita"}
            name={bride?.name}
            photo={bride?.photoUrl}
            parentName={bride?.parentName}
            childOf={bride?.childOf ?? bride?.bio}
          />
          <p className="font-[family-name:var(--font-script)] text-6xl leading-none" style={{ color: SN.rose }}>
            &amp;
          </p>
          <Person
            side="m"
            nick={groom?.nickname ?? groom?.name ?? "Pria"}
            name={groom?.name}
            photo={groom?.photoUrl}
            parentName={groom?.parentName}
            childOf={groom?.childOf ?? groom?.bio}
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Countdown — brown dengan foto tertutup mask                         */
/* ------------------------------------------------------------------ */

const COUNT_LABELS: { key: "days" | "hours" | "minutes" | "seconds"; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

function Countdown({ eventDate, photo }: { eventDate: string; photo?: string }) {
  const t = useCountdown(eventDate);
  return (
    <section className="relative overflow-hidden py-20 md:py-24" style={{ backgroundColor: SN.brown, color: SN.cream }}>
      {/* Foto latar tersamar (mask atas-bawah) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo ?? "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70"}
          alt=""
          className="h-full w-full object-cover"
          style={{
            WebkitMaskImage: "linear-gradient(transparent, #000 22%, #000 78%, transparent)",
            maskImage: "linear-gradient(transparent, #000 22%, #000 78%, transparent)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(rgba(64,54,51,.62), rgba(64,54,51,.7)), linear-gradient(120deg, rgba(201,149,145,.35), transparent)",
          }}
        />
      </div>
      <Floral sym="cluster" className="absolute -left-10 -top-8 w-44 opacity-80" />
      <Floral sym="cluster" className="absolute -bottom-8 -right-10 w-44 opacity-80" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.46em]" style={{ color: "#EBD9CB" }}>
          Menuju Hari Bahagia
        </p>
        <p className="mt-2 font-[family-name:var(--font-script)] text-3xl" style={{ color: SN.pink }}>
          Kami menghitung hari
        </p>
        <div className="mt-9 grid grid-cols-4">
          {COUNT_LABELS.map((u, i) => (
            <div key={u.key} className={i === 0 ? "" : "border-l"} style={{ borderColor: "rgba(251,248,244,.22)" }}>
              <b className="block font-[family-name:var(--font-serif-elegant)] font-light leading-none tabular-nums tracking-tight text-[clamp(42px,12vw,84px)]">
                {String(t[u.key]).padStart(2, "0")}
              </b>
              <span className="mt-3 block text-[9.5px] uppercase tracking-[0.32em]" style={{ color: "#E8D6C8" }}>
                {u.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-10 text-white">
          <Divider className="brightness-[1.25]" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara — akad + resepsi berdampingan dengan pemisah di laptop        */
/* ------------------------------------------------------------------ */

function Acara({
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
  // Entri "Akad" digabung ke kartu utama agar tidak tampil dobel (akadWins).
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

  const cards = [
    { id: "akad", title: "Akad Nikah", date: agenda.main.date, time: agenda.main.time, venue: agenda.main.venue, mapUrl: agenda.main.mapUrl },
    ...agenda.additional.map((e) => ({
      id: e.id,
      title: e.title ?? "Acara",
      date: e.date,
      time: e.time,
      venue: e.location,
      mapUrl: e.locationMap,
    })),
  ];

  return (
    <section id="acara" className="relative overflow-hidden py-20 md:py-24">
      <Floral sym="sprig" className="absolute -left-6 top-[8%] w-16 opacity-85 sm:w-20" />
      <Floral sym="sprig" className="absolute -right-6 bottom-[6%] w-16 -scale-x-100 -scale-y-100 opacity-85 sm:w-20" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <h2 className="sn-h2">Acara</h2>
        <p className="mx-auto mt-5 max-w-sm text-sm">
          Kami bermaksud untuk mengundang saudara/i dalam acara pernikahan kami pada:
        </p>

        <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-x-12">
          {cards.length >= 2 ? (
            <>
              {cards.map((e, idx) => (
                <div key={e.id} style={{ display: "contents" }}>
                  <EventBlock title={e.title} date={e.date ?? agenda.main.date} time={e.time} venue={e.venue} mapUrl={e.mapUrl} />
                  {idx === 0 && (
                    <span aria-hidden="true" className="mx-auto hidden h-full min-h-[200px] w-px lg:block" style={{ backgroundColor: SN.line }} />
                  )}
                </div>
              ))}
            </>
          ) : (
            cards.map((e) => (
              <EventBlock key={e.id} title={e.title} date={e.date} time={e.time} venue={e.venue} mapUrl={e.mapUrl} />
            ))
          )}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5">
          {(cards[0]?.mapUrl ?? locationMap) && (
            <a
              href={cards[0]?.mapUrl ?? locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="sn-btn"
            >
              <MapPin className="h-3.5 w-3.5" />
              Navigasi Map
            </a>
          )}
          {agenda.main.date && (
            <SaveToCalendarButton
              title={`Pernikahan ${agenda.main.venue ?? "Kami"}`}
              date={agenda.main.date}
              time={agenda.main.time}
              location={agenda.main.venue}
              className="sn-btn"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function EventBlock({
  title,
  date,
  time,
  venue,
  mapUrl,
}: {
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h3 className="sn-h2 text-2xl sm:text-3xl" style={{ letterSpacing: ".18em" }}>
        {title}
      </h3>
      {time && (
        <p className="font-[family-name:var(--font-serif-elegant)] text-2xl italic leading-tight sm:text-3xl" style={{ color: SN.accentInk }}>
          {time}
        </p>
      )}
      {date && (
        <p className="text-[12px] uppercase tracking-[0.24em]" style={{ color: SN.text }}>
          {formatDate(date)}
        </p>
      )}
      {venue && (
        <p className="mt-3 font-[family-name:var(--font-serif-elegant)] text-xl leading-snug sm:text-2xl" style={{ color: SN.brown }}>
          {venue}
        </p>
      )}
      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[11px] uppercase tracking-[0.24em] underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: SN.accentInk }}
        >
          Lihat Lokasi
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kisah — timeline (kiri di ponsel/tablet, tengah alternating laptop)  */
/* ------------------------------------------------------------------ */

function yearLabel(date?: string): string {
  if (!date) return "Momen";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return String(d.getFullYear());
}

function Kisah({ story }: { story: NonNullable<TemplateProps["data"]["story"]> }) {
  return (
    <section id="kisah" className="relative overflow-hidden py-20 md:py-24">
      <Floral sym="cluster" className="absolute -left-14 -top-8 w-44 opacity-80" />
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="font-[family-name:var(--font-script)] text-3xl" style={{ color: SN.rose }}>
            Perjalanan kami
          </p>
          <h2 className="sn-h2 mt-2">Kisah Cinta</h2>
        </div>

        <div className="relative mt-14">
          {/* Garis vertikal progres */}
          <span
            aria-hidden="true"
            className="absolute bottom-2 top-2 w-px left-[11px] lg:left-1/2"
            style={{ backgroundColor: "rgba(176,138,112,.22)" }}
          />
          <ol className="space-y-12">
            {story.map((s) => (
              <li key={s.id} className="relative grid grid-cols-[24px_1fr] gap-x-5 lg:grid-cols-[1fr_56px_1fr] lg:items-center lg:gap-x-0">
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1 grid h-5 w-5 place-items-center rounded-full lg:col-start-2 lg:row-start-1 lg:mx-auto lg:mt-0"
                  style={{ backgroundColor: SN.bg }}
                >
                  <span className="block h-2.5 w-2.5 rounded-full border transition-all" style={{ borderColor: SN.accent, backgroundColor: SN.rose }} />
                </span>
                <div
                  className={`col-start-2 lg:row-start-1 ${
                    story.indexOf(s) % 2 === 0 ? "lg:col-start-3 lg:pl-9" : "lg:col-start-1 lg:pr-9 lg:text-right"
                  }`}
                >
                  <time className="text-[11px] uppercase tracking-[0.34em]" style={{ color: SN.accentInk }}>
                    {yearLabel(s.date)}
                  </time>
                  <h3 className="mt-1.5 font-[family-name:var(--font-serif-elegant)] font-light text-2xl uppercase tracking-[0.12em]" style={{ color: SN.brown }}>
                    {s.title ?? "Momen"}
                  </h3>
                  {s.description && (
                    <p className="mt-2 max-w-md text-sm leading-relaxed" style={story.indexOf(s) % 2 === 0 ? undefined : { marginLeft: "auto" }}>
                      &ldquo;{s.description}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri — mosaik ponsel + editorial offset laptop + lightbox          */
/* ------------------------------------------------------------------ */

/** Kelas grid per-indeks mengikuti desain: 12-kolom dengan offset memanjat. */
function galClass(i: number): string {
  const lgClasses: Record<number, string> = {
    0: "lg:col-span-5 lg:aspect-[4/5]",
    1: "lg:col-span-3 lg:aspect-[3/4] lg:mt-24 lg:-ml-2.5",
    2: "lg:col-span-4 lg:aspect-[4/5] lg:mt-9",
    3: "lg:col-start-2 lg:col-span-4 lg:aspect-[3/4] lg:-mt-9",
    4: "lg:col-span-7 lg:aspect-[16/10] lg:mt-6",
    5: "lg:col-start-1 lg:col-span-4 lg:aspect-square lg:mt-3.5",
    6: "lg:col-start-5 lg:col-span-4 lg:aspect-[4/5] lg:-mt-14",
  };
  return lgClasses[i] ?? "lg:col-start-auto lg:col-span-4 lg:aspect-[3/4]";
}

function Galeri({ gallery }: { gallery: NonNullable<TemplateProps["data"]["gallery"]> }) {
  const [index, setIndex] = useState<number | null>(null);

  // Navigasi keyboard saat lightbox terbuka
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => ((i ?? 0) + 1) % gallery.length);
      if (e.key === "ArrowLeft") setIndex((i) => ((i ?? 0) - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, gallery.length]);

  return (
    <section
      id="galeri"
      className="relative overflow-hidden py-20 md:py-24"
      style={{ background: `linear-gradient(${SN.bg}, ${SN.bg2} 12%, ${SN.bg2} 90%, ${SN.bg})` }}
    >
      <Floral sym="cluster" className="absolute -right-14 -top-7 w-40 opacity-85" />
      <Floral sym="cluster" className="absolute -bottom-7 -left-14 w-40 opacity-85" />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <h2 className="sn-h2 text-center">Galeri</h2>
        {/* Ponsel/tablet: 2 kolom, foto besar tiap 3. Laptop: mosaik 12 kolom */}
        <div className="mt-12 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-12 lg:items-start lg:gap-5">
          {gallery.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Buka foto ${i + 1}: ${g.caption ?? "foto galeri"}`}
              className={`group relative overflow-hidden rounded-md shadow-[0_18px_34px_-24px_rgba(64,54,51,.55)] ${
                i % 3 === 0 ? "col-span-2 aspect-[4/5]" : "aspect-[3/4]"
              } ${galClass(i)}`}
              style={{ backgroundColor: SN.beige }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.url}
                alt={g.caption ?? "Foto galeri"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galeri foto"
          onClick={() => setIndex(null)}
          className="fixed inset-0 z-[60] grid place-items-center backdrop-blur-md"
          style={{ backgroundColor: "rgba(40,32,30,.72)" }}
        >
          <div className="grid h-full w-full place-items-center overflow-hidden px-3 py-16" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[index]?.url}
              alt={gallery[index]?.caption ?? "Foto galeri"}
              className="max-h-full max-w-[min(100%,920px)] rounded-md object-contain shadow-2xl"
            />
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setIndex(null)}
            className="sn-btn absolute right-4 top-4 grid h-10 w-10 place-items-center !rounded-full !border-white/40 !bg-white/10 !p-0"
          >
            ✕
          </button>
          <button
            type="button"
            aria-label="Foto sebelumnya"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => ((i ?? 0) - 1 + gallery.length) % gallery.length);
            }}
            className="sn-btn absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center !rounded-full !border-white/40 !bg-white/10 !p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => ((i ?? 0) + 1) % gallery.length);
            }}
            className="sn-btn absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center !rounded-full !border-white/40 !bg-white/10 !p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="absolute bottom-5 left-0 right-0 text-center text-[11px] tracking-[0.3em]" style={{ color: SN.cream }}>
            {String(index + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
          </p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP                                                                */
/* ------------------------------------------------------------------ */

function Rsvp({ invitationId, guestName }: { invitationId: string; guestName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <section
      id="rsvp"
      className="relative overflow-hidden py-20 md:py-24"
      style={{ background: `linear-gradient(${SN.bg}, #EBD7D0 30%, #E7D0C9 70%, ${SN.bg})` }}
    >
      <Floral sym="cluster" className="absolute -left-16 -top-9 w-48 opacity-90" />
      <Floral sym="cluster" className="absolute -bottom-9 -right-16 w-48 opacity-90" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-3 px-6 text-center">
        <h2 className="sn-h2">RSVP</h2>
        <p className="text-[11px] uppercase tracking-[0.46em]" style={{ color: SN.accentInk }}>
          Konfirmasi Kehadiran
        </p>
        <p className="text-sm">Kehadiran dan doa Anda adalah hadiah terbaik bagi kami.</p>
        <button type="button" className="sn-btn sn-btn-solid mt-6" onClick={() => setIsOpen(true)}>
          Konfirmasi Kehadiran
        </button>
      </div>
      {isOpen && (
        <SenjaModal title="Konfirmasi" onClose={closeModal}>
          <p className="mb-6 text-center text-sm">Mohon isi data kehadiran Anda.</p>
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass="text-[#FFFDF9] bg-[#9A7358] hover:bg-[#85634B]"
            borderClass="border-[rgba(176,138,112,.38)] bg-white focus:border-[#9A7358] focus:ring-[#E7D0C9]"
          />
        </SenjaModal>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado                                                                */
/* ------------------------------------------------------------------ */

function Kado({ gifts }: { gifts: NonNullable<TemplateProps["data"]["gifts"]> }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <section id="kado" className="relative overflow-hidden py-20 md:py-24">
      <Floral sym="sprig" className="absolute -right-6 top-[10%] w-16 -scale-x-100 opacity-85 sm:w-20" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-4 px-6 text-center">
        <p className="font-[family-name:var(--font-script)] text-3xl" style={{ color: SN.rose }}>
          Tanda kasih
        </p>
        <h2 className="sn-h2">Kado</h2>
        <p className="text-sm">
          Doa restu Anda sudah cukup bagi kami. Bila ingin memberi tanda kasih,
          kami berterima kasih dengan tulus.
        </p>
        <button type="button" className="sn-btn sn-btn-solid mt-6" onClick={() => setIsOpen(true)}>
          Kirim Kado
        </button>
      </div>
      {isOpen && (
        <SenjaModal title="Kado Cashless" onClose={closeModal}>
          <p className="mb-5 text-center text-sm">Anda dapat mengirimkan kado cashless.</p>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {gifts.map((g, i) => (
              <div
                key={g.id}
                className="rounded-2xl border p-5 text-left shadow-sm"
                style={{
                  borderColor: SN.line,
                  backgroundColor: i % 2 === 0 ? "rgba(251,248,244,.8)" : "rgba(142,154,130,.12)",
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full font-[family-name:var(--font-serif-elegant)] text-base"
                    style={{ backgroundColor: i % 2 === 0 ? SN.accent : SN.sage, color: "#FFFDF9" }}
                    aria-hidden="true"
                  >
                    {g.provider.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-[family-name:var(--font-serif-elegant)] text-lg" style={{ color: SN.brown }}>
                      {g.provider}
                    </p>
                    {g.name && <p className="text-xs opacity-70">{g.name}</p>}
                  </div>
                </div>
                <p className="select-all text-sm tracking-[0.14em]" style={{ color: SN.brown }}>
                  {g.accountNumber}
                </p>
                {g.holderName && <p className="mt-0.5 text-xs opacity-70">a.n. {g.holderName}</p>}
                <div className="mt-3">
                  <div className="sn-btn sn-btn-sm inline-flex">
                    <CopyButton text={g.accountNumber} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SenjaModal>
      )}
    </section>
  );
}

function SenjaModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="senja-modal-title"
      className="senja-modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="senja-sheet">
        <Floral sym="cluster" className="absolute -left-7 -top-6 w-32 opacity-80" />
        <button
          ref={closeButtonRef}
          type="button"
          className="senja-close"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>
        <h3 id="senja-modal-title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ucapan & doa                                                        */
/* ------------------------------------------------------------------ */

function Ucapan({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section
      id="ucapan"
      className="relative overflow-hidden py-20 md:py-24"
      style={{ background: `linear-gradient(${SN.bg}, ${SN.bg2} 10%, ${SN.bg2} 92%, ${SN.bg})` }}
    >
      <Floral sym="cluster" className="absolute -right-14 -top-7 w-40 opacity-80" />
      <div className="relative z-10 mx-auto max-w-lg px-6">
        <h2 className="sn-h2 text-center">Ucapan &amp; Doa</h2>
        <div
          className="mt-10 rounded-2xl border-l-4 p-5 text-left"
          style={{
            borderColor: SN.rose,
            backgroundColor: "rgba(251,248,244,.7)",
          }}
        >
          <WishForm
            invitationId={invitationId}
            accentClass="text-[#FFFDF9] bg-[#9A7358] hover:bg-[#85634B]"
            borderClass="border-[rgba(176,138,112,.38)] bg-transparent focus:border-[#9A7358] focus:ring-[#EFE7DE]"
          />
        </div>
        <div className="mt-10">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[rgba(176,138,112,.38)] bg-[rgba(251,248,244,.75)]"
            nameClass="text-[#403633]"
            avatarClass="bg-[#C99591] text-[#FFFDF9]"
            emptyClass="opacity-60"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Penutup — brown, kelopak jatuh, hormat kami                         */
/* ------------------------------------------------------------------ */

const PETALS: [number, number, number, number][] = [
  [6, 15, 2, 34],
  [22, 18, -5, -52],
  [38, 14, 8, 28],
  [54, 20, -12, -44],
  [68, 16, 4, 36],
  [82, 17, -8, -30],
  [94, 15, 1, 42],
  [14, 19, -14, -38],
  [47, 16, 11, 30],
  [73, 18, -3, -46],
  [88, 14, 6, 24],
  [31, 21, -10, -34],
];

function Closing({
  brideNick,
  groomNick,
  photo,
}: {
  brideNick: string;
  groomNick: string;
  photo?: string;
}) {
  return (
    <section className="relative grid min-h-[560px] place-items-center overflow-hidden py-20 md:py-24" style={{ backgroundColor: SN.brown, color: SN.cream }}>
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo ?? "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70"}
          alt=""
          className="h-full w-full object-cover"
          style={{
            WebkitMaskImage: "linear-gradient(transparent, #000 16%)",
            maskImage: "linear-gradient(transparent, #000 16%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(rgba(64,54,51,.5), rgba(64,54,51,.72)), linear-gradient(200deg, rgba(201,149,145,.4), transparent)",
          }}
        />
      </div>

      {/* Kelopak jatuh */}
      <div aria-hidden="true">
        {PETALS.map(([left, dur, dl, sx], i) => (
          <span
            key={i}
            className="sn-petal"
            style={{
              left: `${left}%`,
              "--dur": `${dur}s`,
              "--dl": `${dl}s`,
              "--sx": `${sx}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <Floral sym="cluster" className="absolute -left-14 -top-8 w-44 opacity-80" />
      <Floral sym="cluster" className="absolute -right-14 -top-8 w-44 opacity-80" />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-4 px-6 text-center">
        <p className="font-[family-name:var(--font-serif-elegant)] text-2xl italic leading-relaxed sm:text-3xl">
          &ldquo;Atas kehadiran saudara/i &amp; Do&apos;a restunya,
          <br />
          kami ucapkan terimakasih&rdquo;
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.4em]" style={{ color: "#EBD9CB" }}>
          Hormat Kami
        </p>
        <div className="mt-2">
          <NamesTitle brideNick={brideNick} groomNick={groomNick} cream size="medium" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gaya khusus (h2, tombol, kelopak, scroll cue) — satu blok <style>    */
/* ------------------------------------------------------------------ */

const SENJA_KINETICS = `
.senja-nav{
  position:fixed; z-index:60; left:50%;
  bottom:calc(14px + env(safe-area-inset-bottom,0px));
  width:min(440px,calc(100% - 28px));
  display:flex; justify-content:space-between; padding:7px 8px;
  border:1px solid rgba(176,138,112,.3); border-radius:999px;
  background:rgba(247,243,238,.78); backdrop-filter:blur(16px) saturate(1.2);
  -webkit-backdrop-filter:blur(16px) saturate(1.2);
  box-shadow:0 14px 34px -14px rgba(64,54,51,.4);
  visibility:hidden; pointer-events:none;
  transform:translate(-50%,150%); transition:transform .9s cubic-bezier(.2,.7,.2,1);
}
.senja-nav.is-visible{visibility:visible;pointer-events:auto;transform:translate(-50%,0)}
.senja-nav a{
  flex:1; min-width:0; display:flex; flex-direction:column; align-items:center;
  gap:3px; padding:6px 2px; border-radius:999px; color:#7B6E69;
  font:400 7px/1 Jost,Arial,sans-serif;
  letter-spacing:.07em; text-transform:uppercase; text-decoration:none;
  transition:color .3s,background .3s;
}
.senja-nav a svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.3}
.senja-nav a.is-active{color:#403633;background:rgba(201,149,145,.26)}
.senja-footer{
  padding:34px 24px calc(96px + env(safe-area-inset-bottom,0px));
  background:#403633; color:#CDBFB4; text-align:center;
  font:400 11px/2 Jost,Arial,sans-serif;
  letter-spacing:.18em; text-transform:uppercase;
}
.senja-footer p{margin:0}
.senja-footer svg{
  width:11px;height:11px;fill:#C99591;stroke:#C99591;
  vertical-align:-1px;
}
.sn-h2{
  font-family: var(--font-serif-elegant), Georgia, serif;
  font-weight:300; font-size:clamp(30px,8.4vw,42px);
  letter-spacing:.2em; text-transform:uppercase; color:#403633;
  margin:0; line-height:1.15; padding-left:.2em;
}
.sn-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:.55rem;
  padding:12px 22px; border:1px solid #B08A70; border-radius:999px;
  background:transparent; color:#403633;
  font-size:10.5px; letter-spacing:.26em; text-transform:uppercase; line-height:1;
  text-decoration:none; transition:background .35s, color .35s, transform .45s;
}
.sn-btn-solid{
  background:#9A7358;border-color:#9A7358;color:#FFFDF9;
  scroll-margin-block:120px;
}
.sn-btn-solid:hover{background:#85634B}
.sn-btn:hover{background:rgba(176,138,112,.12)}
.sn-btn-sm{padding:8px 16px; font-size:9.5px}
.senja-modal{
  position:fixed; inset:0; z-index:80; display:grid; place-items:center;
  padding:16px; background:rgba(64,54,51,.46); backdrop-filter:blur(7px);
  -webkit-backdrop-filter:blur(7px);
}
.senja-sheet{
  position:relative; width:min(100%,420px); max-height:calc(100% - 20px);
  overflow:auto; border-radius:26px; padding:44px 28px 30px;
  background:#F7F3EE; box-shadow:0 34px 80px -24px rgba(64,54,51,.55);
}
.senja-sheet h3{
  margin:0; color:#403633; text-align:center;
  font:300 28px/1.15 var(--font-serif-elegant),Georgia,serif;
  letter-spacing:.16em; text-transform:uppercase;
}
.senja-close{
  position:absolute; z-index:2; top:12px; right:12px; display:grid;
  width:34px; height:34px; place-items:center; border:1px solid rgba(176,138,112,.38);
  border-radius:50%; background:transparent; color:#403633; font-size:22px; line-height:1;
}
.sn-scroll-line{
  height:38px; background:linear-gradient(#B08A70, transparent);
  transform-origin:top; animation:snCue 2.4s ease-in-out infinite;
}
@keyframes snCue{
  0%{transform:scaleY(0)} 50%{transform:scaleY(1)}
  100%{transform:scaleY(1); opacity:0}
}
.sn-petal{
  position:absolute; top:-30px; width:10px; height:14px;
  border-radius:70% 0 70% 0; background:#D9B4B0; opacity:0; z-index:1;
  animation:snFall var(--dur,16s) linear var(--dl,0s) infinite;
}
@keyframes snFall{
  0%{transform:translate(0,-30px) rotate(0); opacity:0}
  10%{opacity:.5} 90%{opacity:.42}
  100%{transform:translate(var(--sx,40px), 680px) rotate(420deg); opacity:0}
}
@media (prefers-reduced-motion:reduce){
  .sn-scroll-line, .sn-petal{animation:none}
  .senja-nav{transition:none}
}
`;
