"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
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
 * Ruby Royale — adopsi presisi dari desain referensi SVG (1080×1920,
 * mockup Andi Pratama & Rahmatika): maroon dalam, arch emas bercahaya,
 * roses putih di mobile (angin lembut), heart cincin emas dengan inisial
 * besar, pill krem "Buka Undangan", bed bunga magenta di penutup gerbang,
 * dan galeri foto BER-OTOMATIS ganti (sesuai anotasi desain
 * "<otomatis next photo>").
 *
 * Sesuai permintaan:
 * - Background gerbang memakai FOTO dengan opacity ±25% di atas maroon.
 * - Bunga sudut kiri/kanan atas-bawah bergoyang LAMBAT seperti tertiup
 *   angin (keyframes rwSwayT / rwSwayB).
 * - Galeri foto: slider otomatis (crossfade slide tiap ±4 detik).
 * - Semua fitur Meduta utuh: TemplateProps, RSVP & ucapan server action,
 *   musik latar, kado salin, countdown, acara splitAgenda + Map &
 *   Google Calendar, quoteHidden, dsb.
 * - Responsif: ponsel (kolom, sesuai poster) → md → lg (mempelai
 *   berdampingan, acara berdampingan, tidak pernah overflow-x).
 */

const RW = {
  bg: "#2E0715",
  bgDeep: "#1C020C",
  wine: "#43101F",
  cream: "#ECECD6",
  creamSoft: "rgba(236,236,214,.72)",
  gold: "#C9971F",
  goldHi: "#F3D476",
  goldDeep: "#8A5A12",
  maroonText: "#5E1121",
  pink: "#D66B96",
  rose: "#E8A79F",
} as const;

const SANS = '"Poppins", Inter, Arial, sans-serif';
const SERIF = 'var(--font-display), Georgia, serif';
const SCRIPT = 'var(--font-script), cursive';

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };
type RubyNavItem = { id: string; label: string; Icon: LucideIcon };

export default function RubyTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const [closing, setClosing] = useState(false);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <RubyShell
      {...props}
      data={isEmbed ? { ...props.data, musicUrl: undefined } : props.data}
      gateOpen={gateOpen}
      closing={closing}
      onGateOpen={() => {
        // Musik dimulai sinkron saat klik (kebijakan autoplay);
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

function RubyShell({
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
  const navItems: RubyNavItem[] = [
    { id: "home", label: "Home", Icon: House },
    ...(groom?.name || bride?.name
      ? [{ id: "mempelai", label: "Mempelai", Icon: UsersRound }]
      : []),
    ...(events.length > 0 || data.eventDate
      ? [{ id: "acara", label: "Acara", Icon: CalendarDays }]
      : []),
    ...(story.length > 0 ? [{ id: "kisah", label: "Kisah", Icon: Heart }] : []),
    ...(gallery.length > 0 ? [{ id: "galeri", label: "Galeri", Icon: Images }] : []),
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
  const closingPhoto = gatePhoto;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden antialiased"
      style={{
        backgroundColor: RW.bg,
        color: RW.cream,
        fontFamily: SANS,
        fontSize: 14.5,
        lineHeight: 1.9,
      }}
    >
      {/* Keyframes khusus Ruby (sway angin, galeri otomatis, petal) */}
      <style dangerouslySetInnerHTML={{ __html: RUBY_KINETICS }} />
      {/* Foto gerbang yang sama menjadi latar sepanjang undangan. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden="true"
        src={gatePhoto || bgUrl || GATE_FALLBACK}
        alt=""
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
        style={{ opacity: 0.3 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(rgba(28,2,12,.58), rgba(28,2,12,.64)), radial-gradient(120% 90% at 50% 6%, rgba(67,16,31,.45) 0%, transparent 55%), radial-gradient(140% 100% at 50% 104%, rgba(20,1,8,.45) 0%, transparent 52%)",
        }}
      />

      {(!gateOpen || closing) && onGateOpen && (
        <RubyGate
          photoUrl={gatePhoto || bgUrl}
          brideNick={brideNick}
          groomNick={groomNick}
          guestName={guestName}
          onOpen={onGateOpen}
          closing={closing}
        />
      )}

      <main className="relative z-10 w-full">
        <Hero brideNick={brideNick} groomNick={groomNick} eventDate={data.eventDate} />

        {!data.quoteHidden && data.quoteText?.trim() ? (
          <Quote title={data.quoteTitle} text={data.quoteText.trim()} source={data.quoteSource} />
        ) : null}

        {(groom?.name || bride?.name) && (
          <Mempelai groom={groom} bride={bride} />
        )}

        {data.eventDate ? <Countdown eventDate={data.eventDate} /> : null}

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

        <Rsvp invitationId={invitationId} guestName={guestName} gifts={gifts} />

        <Ucapan invitationId={invitationId} wishes={wishes} />

        <Closing brideNick={brideNick} groomNick={groomNick} photo={closingPhoto} />
      </main>

      <RubyFooter />
      <RubyNavigation items={navItems} visible={gateOpen} />

      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          positionClassName="fixed bottom-24 right-4 z-[65] md:bottom-24 md:right-7"
          buttonClassName="border border-[rgba(243,212,118,.4)] bg-[rgba(28,2,12,.8)] text-[#F3D476] shadow-md backdrop-blur-md"
        />
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: RW.bg, color: RW.cream, fontFamily: SANS }}
    >
      <CornerRose sym="cluster" className="h-16 w-16 opacity-60" duration={8} />
      <p className="text-lg" style={{ fontFamily: SERIF }}>
        Undangan belum dipublikasikan
      </p>
      <p className="text-sm opacity-60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

function RubyNavigation({
  items,
  visible,
}: {
  items: RubyNavItem[];
  visible: boolean;
}) {
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".rw-nav a[href^='#']"),
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
              Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top),
          )[0];
        if (visibleSection) setActiveId(visibleSection.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Navigasi undangan" aria-hidden={!visible} className={`rw-nav ${visible ? "is-visible" : ""}`}>
      {items.map(({ id, label, Icon }) => (
        <a key={id} href={`#${id}`} aria-current={activeId === id ? "location" : undefined} className={activeId === id ? "is-active" : ""}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

function RubyFooter() {
  return (
    <footer className="rw-footer">
      <p>
        The Wedding Of <Heart aria-label="cinta" /> — E-Invitation
      </p>
      <p>Made with love @meduta 2026</p>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Ornamen SVG — rose, leaf, eucalyptus, bed, heart & arch             */
/* ------------------------------------------------------------------ */

/* Petal mawar putih krem — satu bloom (radius ±70px) */
function Bloom({ x, y, tone = "#FBF8F4" }: { x: number; y: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g fill={tone} stroke="#E0D4C8" strokeWidth=".8" opacity=".96">
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((a) => (
          <ellipse key={a} cx="0" cy="-36" rx="26" ry="37" transform={`rotate(${a})`} />
        ))}
      </g>
      <g fill="#F6EEE5" stroke="#E7DBCF" strokeWidth=".6">
        {[18, 90, 162, 234, 306].map((a) => (
          <ellipse key={a} cx="0" cy="-22" rx="17" ry="25" transform={`rotate(${a})`} />
        ))}
      </g>
      <g fill="#F1E7DB" opacity=".9">
        {[54, 126, 198, 270, 342].map((a) => (
          <ellipse key={a} cx="0" cy="-11" rx="10" ry="14" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r="7.5" fill="#EBDFD1" />
      <path d="M-5 1C-3 -5 4 -6 5 -1C5 3 0 4 -2 2C-3 1 -1 -1 0 0" fill="none" stroke="#D4C2B0" strokeWidth="1.2" />
    </g>
  );
}

/* Petal mawar magenta/pink — bed bunga penutup gerbang */
function PinkBloom({
  x,
  y,
  s = 1,
  tone = "#D14B84",
}: {
  x: number;
  y: number;
  s?: number;
  tone?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={tone} stroke="#A82F63" strokeWidth="1" opacity=".97">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse key={a} cx="0" cy="-30" rx="22" ry="32" transform={`rotate(${a})`} />
        ))}
      </g>
      <g fill="#E06CA2" stroke="#C64F8D" strokeWidth=".7">
        {[30, 102, 174, 246, 318].map((a) => (
          <ellipse key={a} cx="0" cy="-17" rx="14" ry="20" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r="9" fill="#B23A6F" />
      <path d="M-5 0C-2 -5 4 -5 5 0C4 4 0 5 -2 3C-3 2 -1 1 0 1" fill="none" stroke="#8E2453" strokeWidth="1.4" />
    </g>
  );
}

/* Daun sage — path daun dengan tulang tengah */
function Leaf({
  x,
  y,
  r,
  s = 1,
  c = "#7E8F79",
}: {
  x: number;
  y: number;
  r: number;
  s?: number;
  c?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0C16 -22 44 -22 54 0C44 20 16 20 0 0Z" fill={c} />
      <path d="M4 0C20 -5 36 -5 50 0" stroke="#5F6F59" strokeWidth="1.4" fill="none" opacity=".7" />
    </g>
  );
}

/* Tangkai eucalyptus bulat kecil */
function Eucalyptus({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0C10 -26 16 -56 14 -92" fill="none" stroke="#6E806A" strokeWidth="2" />
      <circle cx="12" cy="-16" r="7" fill="#9DB09A" />
      <circle cx="16" cy="-36" r="6.5" fill="#8CA089" />
      <circle cx="12" cy="-56" r="7" fill="#9DB09A" />
      <circle cx="15" cy="-76" r="5.5" fill="#8CA089" />
      <circle cx="14" cy="-92" r="5" fill="#A9BB9F" />
    </g>
  );
}

/* Mawar kuncup kecil untuk aksen */
function Bud({ x, y, r, tone = "#F3EBDF" }: { x: number; y: number; r: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <ellipse cx="0" cy="-10" rx="9" ry="13" fill={tone} stroke="#DCCFC0" strokeWidth=".7" />
      <path d="M-6 -2C-8 -10 8 -12 6 -3C4 4 -4 4 -6 -2Z" fill="#7E8F79" opacity=".55" />
    </g>
  );
}

type CornerSym = "cluster" | "cluster-lg" | "bed";

const CORNER_ROSE_SIZE = "w-[35vw] min-w-[120px] max-w-[180px]";
const CORNER_ROSE_LARGE_SIZE = "w-[42vw] min-w-[150px] max-w-[220px]";

/**
 * CornerRose — cluster mawar putih sudut (vaivoBox scaled hingga w) sesuai
 * desain. Pembungkus animasi sway (tertiup angin) dipegang parent; komponen
 * ini hanya memegang geometri.
 */
function RoseSVG({ sym }: { sym: CornerSym }) {
  if (sym === "bed") {
    return (
      <svg viewBox="0 0 1080 380" aria-hidden="true" focusable="false" className="h-full w-full">
        <defs>
          <linearGradient id="rwGoldBar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8A5A12" />
            <stop offset=".45" stopColor="#F3D476" />
            <stop offset="1" stopColor="#C9971F" />
          </linearGradient>
        </defs>
        {/* tangkai lebar menyapu */}
        <g stroke="url(#rwGoldBar)" strokeWidth="3" fill="none" opacity=".55">
          <path d="M60 380 C 220 320 300 240 380 150" />
          <path d="M1020 380 C 880 330 800 260 690 160" />
        </g>
        <g fill="none" stroke="#5F6F59" strokeWidth="3" opacity=".8">
          <path d="M540 380C500 320 460 260 430 200" />
          <path d="M540 380C580 316 630 258 660 198" />
          <path d="M300 380C340 330 400 292 456 268" />
          <path d="M780 380C760 330 700 292 640 268" />
        </g>
        {/* daun & eucalyptus kiri */}
        <Leaf x={210} y={330} r={-160} s={1.4} c="#F6F3EC" />
        <Leaf x={150} y={360} r={-140} s={1.6} c="#EDF0E7" />
        <Eucalyptus x={300} y={380} r={-18} s={1.2} />
        <Leaf x={390} y={300} r={-120} s={1.1} c="#AFC2A6" />
        {/* kanan (cermin) */}
        <Leaf x={870} y={330} r={160} s={1.4} c="#F6F3EC" />
        <Leaf x={930} y={360} r={140} s={1.6} c="#EDF0E7" />
        <Eucalyptus x={780} y={380} r={198} s={1.2} />
        <Leaf x={690} y={300} r={120} s={1.1} c="#AFC2A6" />
        {/* kuncup merah kecil menabur */}
        <Bud x={120} y={340} r={-30} tone="#C9558C" />
        <Bud x={940} y={340} r={30} tone="#C9558C" />
        <Bud x={250} y={290} r={-70} tone="#E8A3C4" />
        <Bud x={840} y={290} r={70} tone="#E8A3C4" />
        {/* bloom utama */}
        <PinkBloom x={280} y={230} s={1.25} />
        <PinkBloom x={800} y={230} s={1.25} />
        <PinkBloom x={540} y={280} s={1.5} />
        <PinkBloom x={440} y={330} s={.9} tone="#E8A3C4" />
        <PinkBloom x={640} y={330} s={.9} tone="#EA93B8" />
        {/* daun putih di tengah menutup batas */}
        <Leaf x={500} y={350} r={-110} s={1.5} c="#F8F6F0" />
        <Leaf x={580} y={350} r={110} s={1.5} c="#F8F6F0" />
      </svg>
    );
  }

  const isBig = sym === "cluster-lg";
  return (
    <svg viewBox={isBig ? "0 0 380 340" : "0 0 260 240"} aria-hidden="true" focusable="false" className="h-full w-full">
      <defs>
        <linearGradient id="rwGoldArc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#8A5A12" />
          <stop offset=".55" stopColor="#F3D476" />
          <stop offset="1" stopColor="#C9971F" />
        </linearGradient>
      </defs>
      {/* busur emas melengkung di belakang bunga */}
      <g transform={isBig ? undefined : "scale(.85)"}>
        <path d="M-30 210C70 240 150 170 190 60C220 -20 320 -30 380 20" fill="none" stroke="url(#rwGoldArc)" strokeWidth="4.5" opacity=".85" />
        <path d="M40 250C110 250 180 200 200 110" fill="none" stroke="url(#rwGoldArc)" strokeWidth="2" opacity=".45" />
        {/* daun sage + eucalyptus */}
        <Leaf x={30} y={150} r={-70} s={1.5} />
        <Leaf x={260} y={40} r={28} s={1.5} />
        <Leaf x={220} y={120} r={90} s={1.3} c="#A9BB9C" />
        <Eucalyptus x={120} y={160} r={-30} s={1.3} />
        <Leaf x={60} y={210} r={-130} s={1.2} c="#EDF0E7" />
        <Bud x={230} y={230} r={40} />
        <Bud x={70} y={110} r={-40} tone="#E8A3C4" />
        {/* bloom utama + sekunder */}
        <Bloom x={160} y={80} />
        <Bloom x={280} y={170} tone="#F6EFE7" />
      </g>
    </svg>
  );
}

/**
 * CornerRose — pembungkus posisi + animasi sway angin lambat.
 * anchor top: transform-origin atas; anchor bottom: origin bawah.
 */
function CornerRose({
  className = "",
  mirrored = false,
  top = true,
  duration = 8.5,
  delay = 0,
}: {
  sym: CornerSym;
  className?: string;
  mirrored?: boolean;
  top?: boolean;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute ${mirrored ? "-scale-x-100 " : ""}${
        top ? "" : "-scale-y-100 "
      }${className}`}
    >
      <div
        className="rw-sway h-full w-full"
        style={{
          transformOrigin: top ? "50% 0%" : "50% 100%",
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationName: top ? "rwSwayT" : "rwSwayB",
        }}
      >
        {/* Roset putih ASLI desain (6.png) — bukan ilustrasi buatan */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET_ROSE} alt="" className="h-auto w-full" draggable={false} />
      </div>
    </div>
  );
}

/* Segaris angin lembut: hanya keyframes geser + putar pelan */
const SWAY_KEYFRAMES = `
@keyframes rwSwayT{0%{transform:rotate(-2.2deg) translateX(-4px)}100%{transform:rotate(2.6deg) translateX(4px)}}
@keyframes rwSwayB{0%{transform:rotate(2.2deg) translateX(-4px)}100%{transform:rotate(-2.6deg) translateX(4px)}}
.rw-sway{animation:rwSwayT 8.5s ease-in-out infinite alternate}
`;

/**
 * GoldArch — lengkungan emas bercahaya. Dipakai: gerbang, hero, galeri
 * (upaya estetik mempertahankan "kada frame" dari desain).
 */
function GoldArch({ className = "", strength = 1 }: { className?: string; strength?: number }) {
  const main = `rgba(201,151,31,${Math.min(1, strength * .95)})`;
  const glow = `rgba(243,212,118,${Math.min(1, strength * .38)})`;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          border: `2.5px solid ${main}`,
          borderRadius: "999px 999px 0 0 / 34% 34% 0 0",
          boxShadow: `0 0 22px 3px ${glow}, inset 0 0 20px ${glow}`,
        }}
      />
      <div
        className="absolute -inset-[7px] opacity-60"
        style={{
          border: "1px solid rgba(201,151,31,.55)",
          borderRadius: "999px 999px 0 0 / 33% 33% 0 0",
        }}
      />
    </div>
  );
}

/* Heart & rings — artwork tengah gerbang dengan inisial di kiri-atas/kanan-bawah */
function HeartRings({ className = "" }: { className?: string }) {
  // SVG selalu mengisi 100% elemen pembungkusnya — pemanggil mengatur ukuran
  // lewat <div> pembungkus (bukan class di svg) agar tidak konflik utilitas.
  return (
    <svg
      viewBox="0 0 320 300"
      aria-hidden="true"
      focusable="false"
      className={className || "h-full w-full"}
    >
      <defs>
        <linearGradient id="rwHeartG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4CDC9" />
          <stop offset="1" stopColor="#E39A97" />
        </linearGradient>
        <linearGradient id="rwRingG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A8760F" />
          <stop offset=".45" stopColor="#F8E48A" />
          <stop offset="1" stopColor="#C9971F" />
        </linearGradient>
      </defs>
      {/* heart watercolor (2 layer + blur lembut) */}
      <path
        d="M160 272C70 218 26 166 26 106C26 60 62 28 104 28C130 28 150 42 160 64C170 42 190 28 216 28C258 28 294 60 294 106C294 166 250 218 160 272Z"
        fill="url(#rwHeartG)"
        style={{ filter: "blur(1px)" }}
      />
      <path
        d="M160 262C82 214 44 168 44 112C44 74 76 46 110 46C132 46 148 58 160 78C172 58 188 46 210 46C244 46 276 74 276 112C276 168 238 214 160 262Z"
        fill="#E99B96"
        opacity=".38"
        style={{ filter: "blur(7px)" }}
      />
      {/* cincin emas dua lingkaran overlap */}
      <g>
        <g transform="rotate(-18 132 148)">
          <circle cx="132" cy="148" r="46" fill="none" stroke="url(#rwRingG)" strokeWidth="13" />
          <path d="M92 120C104 104 120 98 136 102" fill="none" stroke="#fff" strokeWidth="3" opacity=".65" transform="rotate(-18 132 148)" />
        </g>
        <g transform="rotate(16 194 146)">
          <circle cx="194" cy="146" r="40" fill="none" stroke="url(#rwRingG)" strokeWidth="12" />
          <path d="M212 112C200 106 188 106 176 110" fill="none" stroke="#fff" strokeWidth="2.6" opacity=".55" transform="rotate(16 194 146)" />
        </g>
      </g>
      {/* mawar kecil di pinggir heart */}
      <g transform="translate(44 60) scale(.34)">
        <Bloom x={0} y={0} tone="#F2D3D0" />
      </g>
      <g transform="translate(276 60) scale(.3)">
        <Bloom x={0} y={0} tone="#E8A3C4" />
      </g>
      <g transform="translate(90 250) scale(.28)">
        <Bud x={0} y={0} r={20} tone="#E8A3C4" />
      </g>
      <g transform="translate(230 250) scale(.28)">
        <Bud x={0} y={0} r={-20} tone="#F2D3D0" />
      </g>
      {/* daun kecil */}
      <Leaf x={140} y={40} r={150} s={.45} c="#9DB09A" />
      <Leaf x={190} y={40} r={210} s={.45} c="#9DB09A" />
    </svg>
  );
}

/* Inisial besar elegan (Playfair Display) dengan sulur daun emas kecil */
function Initial({
  letter,
  className = "",
  color = RW.cream,
}: {
  letter?: string;
  className?: string;
  color?: string;
}) {
  if (!letter) return null;
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block leading-none ${className}`}
      style={{ fontFamily: SERIF, fontWeight: 600, color }}
    >
      {/* sulur daun kecil miring */}
      <svg
        viewBox="0 0 60 60"
        className="absolute -left-2 top-1 h-9 w-9 -rotate-45 opacity-80"
        aria-hidden="true"
      >
        <path d="M2 58C18 44 36 30 56 4" fill="none" stroke="url(#rwGoldArc)" strokeWidth="2.4" opacity=".8" />
        <Leaf x={22} y={34} r={-120} s={.42} c="#9DB09A" />
        <Leaf x={40} y={16} r={-80} s={.36} c="#A9BB9C" />
      </svg>
      {letter}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang (Buka Undangan) — poster desain SVG persis                  */
/* ------------------------------------------------------------------ */

const GATE_FALLBACK = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";

/**
 * Aset asli hasil ekstrak file SVG desain (designer/*.svg) — elemen bunga,
 * bingkai & heart dinyalakan “sama” dengan file yang diberikan, bukan
 * ilustrasi buatan. Tersimpan dioptimasi di /public/design/ruby-*.webp.
 */
const ASSET_ROSE = "/design/ruby-rose.webp";
const ASSET_ARCH = "/design/ruby-arch.webp";
const ASSET_BED = "/design/ruby-bed.webp";
const ASSET_HEART = "/design/ruby-heart.webp";
const ASSET_ARCH_TOP = "4.9%"; // 95/1920 seperti desain

function RubyGate({
  photoUrl,
  brideNick,
  groomNick,
  guestName,
  onOpen,
  closing = false,
}: {
  photoUrl?: string;
  brideNick: string;
  groomNick: string;
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

  return (
    <div
      role="dialog"
      aria-label="Sampul undangan"
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-between overflow-hidden text-center ${
        closing ? "animate-gate-open" : ""
      }`}
      style={{ backgroundColor: RW.bg, color: RW.cream }}
    >
      {/* FOTO LATAR — opacity ±25% persis permintaan; zoom sangat pelan */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl ?? GATE_FALLBACK}
        alt=""
        className="animate-float-slower absolute inset-0 h-full w-full scale-105 object-cover"
        style={{ opacity: 0.25 }}
      />
      {/* overlay maroon untuk menyalakan warna & gelapkan tepi */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 5%, rgba(67,16,31,.55) 0%, transparent 52%), radial-gradient(140% 110% at 50% 106%, rgba(20,1,8,.72) 0%, transparent 50%), rgba(46,7,21,.34)",
        }}
      />

      {/* Bingkai arch emas + bed bunga ASLI desain (dekor (7).png), dipotong
          dua: arch tetap diam, bed bawah bergoyang tertiup angin. Lebar penuh
          persis proporsi desain (sisi kiri/kanan nempel ke tepi). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-[2]" style={{ top: ASSET_ARCH_TOP }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET_ARCH} alt="" className="w-full" draggable={false} />
        <div
          className="rw-sway absolute bottom-0 left-0 w-full"
          style={{ transformOrigin: "50% 100%", animationName: "rwSwayB", animationDuration: "10s" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET_BED} alt="" className="w-full" draggable={false} />
        </div>
      </div>

      {/* Roset putih di dua sudut ATAS — ukuran & posisi persis desain
          (lebar 45,7%, ambang −2,35%); goyangan angin */}
      <CornerRose
        sym="cluster-lg"
        top
        className="-left-[2.35%] top-0 w-[45.7%]"
        duration={9}
      />
      <CornerRose
        sym="cluster-lg"
        top
        mirrored
        className="-right-[2.35%] top-0 w-[45.7%]"
        delay={-3.6}
        duration={10.5}
      />
      <CornerRose
        sym="cluster-lg"
        top={false}
        className="-left-[2.35%] bottom-0 w-[45.7%]"
        delay={-2}
        duration={9.8}
      />
      <CornerRose
        sym="cluster-lg"
        top={false}
        mirrored
        className="-right-[2.35%] bottom-0 w-[45.7%]"
        delay={-4.8}
        duration={10.2}
      />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-start px-8 pb-32">
        <p
          className="animate-fade-up mt-28 text-[clamp(2.2rem,8.5vw,3.4rem)] leading-[1.15]"
          style={{ fontFamily: SCRIPT, color: RW.cream }}
        >
          The Wedding Of
        </p>

        {/* Artwork ASLI: heart cincin emas (dekor (1).png) + inisial di
            kiri-atas / kanan-bawah, ukuran persis proporsi desain (heart
            ~23% lebar layar, inisial ~6,4vw) */}
        <div className="animate-fade-up-delay-1 relative mt-12 flex w-[62%] max-w-[270px] items-center justify-center">
          <Initial
            letter={groomNick.charAt(0)}
            className="absolute -top-[24%] left-0 text-[clamp(1.9rem,8vw,3rem)]"
            color={RW.cream}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET_HEART} alt="" className="w-[60%]" draggable={false} />
          <Initial
            letter={brideNick.charAt(0)}
            className="absolute bottom-[-4%] right-0 text-[clamp(1.9rem,8vw,3rem)]"
            color={RW.cream}
          />
        </div>

        {guestName && (
          <div className="animate-fade-up-delay-2 mt-8 flex flex-col items-center gap-1">
            <span
              className="text-xs font-medium tracking-[.18em]"
              style={{ color: RW.creamSoft }}
            >
              Kepada Yth :
            </span>
            <span
              className="text-base font-bold sm:text-lg"
              style={{ fontFamily: SANS, color: RW.cream }}
            >
              {guestName}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpen}
          className="animate-fade-up-delay-3 mt-auto rounded-full px-12 py-3.5 text-[clamp(1.05rem,6vw,1.65rem)] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-12px_rgba(243,212,118,.5)] active:scale-95"
          style={{
            backgroundColor: "rgba(236,236,214,.97)",
            color: RW.maroonText,
            fontFamily: SANS,
            boxShadow: "0 10px 26px -10px rgba(243,212,118,.45)",
          }}
        >
          Buka Undangan
        </button>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero (home) — script wedding of + names, arch kecil & scroll cue     */
/* ------------------------------------------------------------------ */

function NamesTitle({
  brideNick,
  groomNick,
  size = "large",
}: {
  brideNick: string;
  groomNick: string;
  size?: "large" | "medium";
}) {
  return (
    <div className="leading-tight">
      <h1
        className={`${size === "large" ? "text-[clamp(2.4rem,9vw,4.6rem)]" : "text-3xl sm:text-4xl"}`}
        style={{ fontFamily: SERIF, fontWeight: 500, color: RW.cream }}
      >
        {groomNick}
      </h1>
      <p
        className="my-1 text-[clamp(1.5rem,5vw,2.2rem)] leading-none"
        style={{ fontFamily: SCRIPT, color: RW.goldHi }}
      >
        &amp;
      </p>
      <h1
        className={`${size === "large" ? "text-[clamp(2.4rem,9vw,4.6rem)]" : "text-3xl sm:text-4xl"}`}
        style={{ fontFamily: SERIF, fontWeight: 500, color: RW.cream }}
      >
        {brideNick}
      </h1>
    </div>
  );
}

function Hero({
  brideNick,
  groomNick,
  eventDate,
}: {
  brideNick: string;
  groomNick: string;
  eventDate?: string;
}) {
  return (
    <section
      id="home"
      className="relative overflow-hidden pb-12 pt-20 md:pt-24"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(67,16,31,.6) 0%, transparent 60%)",
      }}
    >
      {/* Arch halus + rose sudut (angin) */}
      <GoldArch className="inset-x-[10%] bottom-[-14%] top-[4%]" strength={.55} />
      <CornerRose
        sym="cluster"
        top
        className={`-left-7 -top-4 ${CORNER_ROSE_SIZE} sm:-left-9`}
        duration={9.8}
        delay={-2}
      />
      <CornerRose
        sym="cluster"
        top
        mirrored
        className={`-right-7 -top-4 ${CORNER_ROSE_SIZE} sm:-right-9`}
        duration={8.2}
        delay={-1.1}
      />
      <CornerRose
        sym="cluster"
        top={false}
        className={`-bottom-5 -left-6 ${CORNER_ROSE_SIZE}`}
        duration={11}
        delay={-4}
      />
      <CornerRose
        sym="cluster"
        top={false}
        mirrored
        className={`-bottom-5 -right-6 ${CORNER_ROSE_SIZE}`}
        duration={9.4}
        delay={-6}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 text-center">
        <p
          className="animate-fade-up text-[clamp(1.9rem,7vw,2.6rem)] leading-[1.2]"
          style={{ fontFamily: SCRIPT, color: RW.cream }}
        >
          The Wedding Of
        </p>
        {/* heart kecil di antara nama */}
        <div className="animate-fade-up-delay-1 mb-1 h-20 w-[104px] sm:h-24 sm:w-[124px]">
          <HeartRings />
        </div>
        <div className="animate-fade-up-delay-1">
          <NamesTitle brideNick={brideNick} groomNick={groomNick} size="large" />
        </div>
        {eventDate && (
          <p
            className="animate-fade-up-delay-2 text-[12px] uppercase tracking-[.34em]"
            style={{ color: "rgba(243,212,118,.9)" }}
          >
            {formatDate(eventDate)}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[.34em]" style={{ color: RW.creamSoft }}>
          <span>Scroll</span>
          <i className="rw-scroll-line block w-px" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kutipan — maroon, pembuka gold heart kecil                          */
/* ------------------------------------------------------------------ */

function Quote({ title, text, source }: { title?: string; text: string; source?: string }) {
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <CornerRose sym="cluster" top className={`-left-10 -top-6 ${CORNER_ROSE_SIZE} opacity-90`} duration={9} delay={-3} />
      <CornerRose sym="cluster" top mirrored className={`-right-10 -top-6 ${CORNER_ROSE_SIZE} opacity-90`} duration={10} delay={-5} />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-5 px-6 text-center">
        {title ? (
          <p className="text-[11px] uppercase tracking-[.46em]" style={{ color: "rgba(243,212,118,.85)" }}>
            {title}
          </p>
        ) : null}
        <HeartRings className="h-14 w-16 opacity-80 shrink-0" />
        <blockquote
          className="leading-relaxed"
          style={{ fontFamily: SERIF, fontSize: "1.18rem", fontStyle: "italic", color: RW.cream }}
        >
          &ldquo;{text}&rdquo;
        </blockquote>
        {source ? (
          <p className="text-[11px] font-medium uppercase tracking-[.3em]" style={{ color: "rgba(243,212,118,.85)" }}>
            {source}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai — dua kartu squircle (ponsel stack, laptop sebelah)          */
/* ------------------------------------------------------------------ */

function PersonCard({
  nick,
  name,
  photo,
  parentName,
  childOf,
}: {
  nick: string;
  name?: string;
  photo?: string;
  parentName?: string;
  childOf?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {/* Progress report: nama di atas kartu? Desain: pill di bawah kartu */}
      <div className="relative mb-5 w-[45vw] max-w-[198px] sm:w-[300px] lg:w-[286px]">
        {/* bingkai putih offset ala desain */}
        <div
          aria-hidden="true"
          className="absolute -inset-[9px]"
          style={{ border: `3px solid rgba(236,236,214,.92)`, borderRadius: "44px", opacity: .95 }}
        />
        <div
          className="relative aspect-square overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,.65)]"
          style={{ borderRadius: "38px", backgroundColor: RW.wine }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`Potret ${nick}`} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center" style={{ backgroundColor: `${RW.rose}22` }}>
              <Heart className="h-10 w-10" style={{ color: RW.rose }} />
            </div>
          )}
        </div>
      </div>

      {/* name chap dari desain: pill krem, teks maroon Poppins */}
      <span
        className="rounded-full px-7 py-2.5 text-[15px] font-bold sm:text-[17px]"
        style={{ backgroundColor: "rgba(236,236,214,.96)", color: RW.maroonText, fontFamily: SANS }}
      >
        {name || nick}
      </span>
      {childOf && <p className="text-sm leading-relaxed" style={{ color: RW.creamSoft }}>{childOf}</p>}
      {parentName && (
        <p className="text-sm leading-relaxed" style={{ color: RW.creamSoft }}>
          Putra/Putri dari <b className="font-normal" style={{ color: RW.cream }}>{parentName}</b>
        </p>
      )}
    </div>
  );
}

function Mempelai({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section id="mempelai" className="relative overflow-hidden py-12 md:py-16">
      {/* Roset 4 sudut ukuran persis desain (mempelai.svg): atas ke-2 dan
          bawah ter-flip vertikal — goyangan angin */}
      <CornerRose sym="cluster" top className={`-left-[2.35%] top-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={8.6} />
      <CornerRose sym="cluster" top mirrored className={`-right-[2.35%] top-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={9.8} delay={-2.2} />
      <CornerRose sym="cluster" top={false} className={`-left-[2.35%] bottom-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={10.4} delay={-4.5} />
      <CornerRose sym="cluster" top={false} mirrored className={`-right-[2.35%] bottom-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={9} delay={-6.4} />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="text-center">
          <p
            className="text-[clamp(2rem,7vw,2.6rem)] leading-[1.2]"
            style={{ fontFamily: SCRIPT, color: RW.cream }}
          >
            The Wedding Of
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-center justify-items-center gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6">
          <PersonCard
            nick={groom?.nickname ?? groom?.name ?? "Pria"}
            name={groom?.name}
            photo={groom?.photoUrl}
            parentName={groom?.parentName}
            childOf={groom?.childOf ?? groom?.bio}
          />
          <p
            className="hidden text-[64px] leading-none lg:block"
            style={{ fontFamily: SCRIPT, color: RW.goldHi }}
          >
            &amp;
          </p>
          <PersonCard
            nick={bride?.nickname ?? bride?.name ?? "Wanita"}
            name={bride?.name}
            photo={bride?.photoUrl}
            parentName={bride?.parentName}
            childOf={bride?.childOf ?? bride?.bio}
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Countdown — angka emas besar                                        */
/* ------------------------------------------------------------------ */

const COUNT_LABELS: { key: "days" | "hours" | "minutes" | "seconds"; label: string }[] = [
  { key: "days", label: "Hari" },
  { key: "hours", label: "Jam" },
  { key: "minutes", label: "Menit" },
  { key: "seconds", label: "Detik" },
];

function Countdown({ eventDate }: { eventDate: string }) {
  const t = useCountdown(eventDate);
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      {/* Desain tidak memakai arch di halaman lain — hanya roset sudut */}
      <CornerRose sym="cluster" top className={`-left-[2.35%] top-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={9.2} />
      <CornerRose sym="cluster" top mirrored className={`-right-[2.35%] top-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={10.8} delay={-2.6} />
      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <p className="text-[11px] uppercase tracking-[.46em]" style={{ color: "rgba(243,212,118,.85)" }}>
          Menuju Hari Bahagia
        </p>
        <p className="mt-2 text-3xl" style={{ fontFamily: SCRIPT, color: RW.rose }}>
          Menghitung Hari
        </p>
        <div className="mt-9 grid grid-cols-4 gap-2">
          {COUNT_LABELS.map((u) => (
            <div key={u.key} className="flex flex-col items-center">
              <span
                className="text-gold-shimmer text-[clamp(1.7rem,6.5vw,2.9rem)] font-semibold leading-none"
                style={{ fontFamily: SERIF, fontWeight: 600 }}
              >
                {String(t[u.key]).padStart(2, "0")}
              </span>
              <span
                className="mt-1.5 text-[10px] uppercase tracking-[.26em]"
                style={{ color: RW.creamSoft }}
              >
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara — kartu Akad & Resepsi; splitAgenda; Map & Calendar            */
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
    <section id="acara" className="relative overflow-hidden py-12 md:py-16">
      <CornerRose sym="cluster" top className={`-left-8 -top-5 ${CORNER_ROSE_SIZE} opacity-85`} duration={9.4} />
      <CornerRose sym="cluster" top mirrored className={`-right-8 -top-5 ${CORNER_ROSE_SIZE} opacity-85`} duration={8.4} delay={-3} />
      <CornerRose sym="cluster" top={false} className={`-bottom-6 -left-9 ${CORNER_ROSE_SIZE} opacity-85`} duration={10.2} delay={-5} />
      <CornerRose sym="cluster" top={false} mirrored className={`-bottom-6 -right-9 ${CORNER_ROSE_SIZE} opacity-85`} duration={9.6} delay={-2} />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <p
          className="inline-block rounded-2xl px-6 py-2.5 text-[clamp(1.5rem,5.5vw,1.9rem)] leading-tight"
          style={{ fontFamily: SCRIPT, color: RW.goldHi }}
        >
          Our Wedding Events
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm" style={{ color: RW.creamSoft }}>
          Kami bermaksud untuk mengundang saudara/i dalam acara pernikahan kami:
        </p>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2px_1fr] lg:items-start lg:gap-x-10">
          {cards.length >= 2 ? (
            <>
              {cards.map((e, idx) => (
                <div key={e.id} style={{ display: "contents" }}>
                  <EventBlock title={e.title} date={e.date} time={e.time} venue={e.venue} mapUrl={e.mapUrl} />
                  {idx === 0 && (
                    <span aria-hidden="true" className="mx-auto hidden h-full min-h-[220px] w-px lg:block" style={{ backgroundColor: "rgba(243,212,118,.28)" }} />
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

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
          {(cards[0]?.mapUrl ?? locationMap) && (
            <a
              href={cards[0]?.mapUrl ?? locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="rw-btn"
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
              className="rw-btn"
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
      <h3
        className="text-[clamp(2rem,6vw,2.5rem)] leading-tight"
        style={{ fontFamily: SCRIPT, color: RW.rose }}
      >
        {title}
      </h3>
      {time && (
        <p className="text-lg leading-tight sm:text-xl" style={{ fontFamily: SERIF, color: "rgba(243,212,118,.92)" }}>
          {time}
        </p>
      )}
      {date && (
        <p
          className="text-[12px] font-semibold uppercase tracking-[.24em]"
          style={{ color: RW.cream, fontFamily: SANS }}
        >
          {formatDate(date)}
        </p>
      )}
      {venue && (
        <p
          className="mt-2 max-w-xs leading-snug sm:max-w-sm sm:text-lg"
          style={{ fontFamily: SERIF, color: RW.cream, fontStyle: "italic" }}
        >
          {venue}
        </p>
      )}
      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[11px] uppercase tracking-[.24em] underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: "rgba(243,212,118,.92)", fontFamily: SANS }}
        >
          Lihat Lokasi
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kisah — timeline vertikal                                            */
/* ------------------------------------------------------------------ */

function yearLabel(date?: string): string {
  if (!date) return "Momen";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return String(d.getFullYear());
}

function Kisah({ story }: { story: NonNullable<TemplateProps["data"]["story"]> }) {
  return (
    <section id="kisah" className="relative overflow-hidden py-12 md:py-16">
      <CornerRose sym="cluster" top className={`-left-9 -top-5 ${CORNER_ROSE_SIZE} opacity-80`} duration={9.6} delay={-2} />
      <CornerRose sym="cluster" top mirrored className={`-right-9 -top-5 ${CORNER_ROSE_SIZE} opacity-80`} duration={8.8} delay={-4.4} />
      <CornerRose sym="cluster" top={false} className={`-bottom-6 -left-8 ${CORNER_ROSE_SIZE} opacity-80`} duration={10} delay={-3} />
      <CornerRose sym="cluster" top={false} mirrored className={`-bottom-6 -right-8 ${CORNER_ROSE_SIZE} opacity-80`} duration={9} delay={-5.6} />
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-3xl" style={{ fontFamily: SCRIPT, color: RW.rose }}>
            Perjalanan kami
          </p>
          <h2 className="rw-h2 mt-2">Kisah Kami</h2>
        </div>
        <div className="relative mt-14">
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-[11px] top-2 w-px lg:left-1/2"
            style={{ backgroundColor: "rgba(243,212,118,.28)" }}
          />
          <ol className="space-y-12">
            {story.map((s) => (
              <li key={s.id} className="relative grid grid-cols-[24px_1fr] gap-x-5 lg:grid-cols-[1fr_56px_1fr] lg:items-center lg:gap-x-0">
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1 grid h-5 w-5 place-items-center rounded-full lg:col-start-2 lg:row-start-1 lg:mx-auto lg:mt-0"
                  style={{ backgroundColor: RW.bg }}
                >
                  <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: RW.goldHi, boxShadow: "0 0 9px rgba(243,212,118,.65)" }} />
                </span>
                <div
                  className={`col-start-2 lg:row-start-1 ${
                    story.indexOf(s) % 2 === 0 ? "lg:col-start-3 lg:pl-9" : "lg:col-start-1 lg:pr-9 lg:text-right"
                  }`}
                >
                  <time
                    className="text-[11px] font-semibold uppercase tracking-[.34em]"
                    style={{ color: "rgba(243,212,118,.9)", fontFamily: SANS }}
                  >
                    {yearLabel(s.date)}
                  </time>
                  <h3
                    className="mt-1.5 text-xl uppercase tracking-[.12em] sm:text-2xl"
                    style={{ fontFamily: SERIF, fontWeight: 500, color: RW.cream }}
                  >
                    {s.title ?? "Momen"}
                  </h3>
                  {s.description && (
                    <p
                      className="mt-2 max-w-md text-sm leading-relaxed"
                      style={{ color: RW.creamSoft, ...(!(story.indexOf(s) % 2 === 0) ? { marginLeft: "auto" } : {}) }}
                    >
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
/* Galeri — SLIDER FOTO OTOMATIS sesuai anotasi desain                  */
/* ------------------------------------------------------------------ */

const SLIDE_MS = 4000;

function Galeri({ gallery }: { gallery: NonNullable<TemplateProps["data"]["gallery"]> }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = gallery.length;
  const activeIndex = total > 0 ? Math.min(index, total - 1) : 0;

  // OTOMATIS next — "otomatis next photo" sesuai desain mockup.
  useEffect(() => {
    if (total < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [total, paused]);

  const go = useCallback((dir: 1 | -1) => {
    if (total < 1) return;
    setIndex((i) => (i + dir + total) % total);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 9000);
  }, [total]);

  return (
    <section id="galeri" className="relative overflow-hidden pt-24 pb-36 md:py-16">
      {/* Roset 4 sudut ukuran persis desain (galeri.svg) — tanpa arch */}
      <CornerRose sym="cluster-lg" top className={`-left-[2.35%] top-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={9.2} />
      <CornerRose sym="cluster-lg" top mirrored className={`-right-[2.35%] top-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={10.4} delay={-3.2} />
      <CornerRose sym="cluster-lg" top={false} className={`-left-[2.35%] bottom-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={10} delay={-5} />
      <CornerRose sym="cluster-lg" top={false} mirrored className={`-right-[2.35%] bottom-0 ${CORNER_ROSE_LARGE_SIZE}`} duration={8.8} delay={-2.4} />

      <div className="relative z-10 mx-auto max-w-2xl px-6">
        <div className="flex justify-center">
          <span
            className="rounded-full px-10 py-3.5 text-[13px] font-bold uppercase tracking-[.3em] sm:text-[15px]"
            style={{ backgroundColor: "rgba(236,236,214,.95)", color: RW.maroonText, fontFamily: SANS }}
          >
            Galeri Foto
          </span>
        </div>

        {/* Frame foto besar (rounded tebal, sesuai mockup) + slider otomatis */}
        <div
          className="group relative mt-28 aspect-[7/5] w-full overflow-hidden"
          style={{
            borderRadius: "42px",
            border: "2px solid rgba(236,236,214,.2)",
            backgroundColor: RW.wine,
            boxShadow: "0 40px 80px -34px rgba(0,0,0,.7)",
          }}
        >
          {gallery.map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={g.id}
              src={g.url}
              alt={g.caption ?? "Foto galeri"}
              className="absolute inset-0 h-full w-full object-cover transition-all duration-[1100ms] ease-out"
              style={{
                opacity: i === activeIndex ? 1 : 0,
                transform: i === activeIndex ? "scale(1)" : "scale(1.06) translateX(2.5%)",
              }}
            />
          ))}

          {/* indikator counter */}
          <span
            className="absolute left-4 top-4 rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-[.22em]"
            style={{ backgroundColor: "rgba(28,2,12,.55)", color: RW.cream, fontFamily: SANS, backdropFilter: "blur(6px)" }}
          >
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          {/* tombol manual (pause autoplay sementara) */}
          <button
            type="button"
            aria-label="Foto sebelumnya"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/25 opacity-0 transition group-hover:opacity-100"
            style={{ color: RW.cream, backdropFilter: "blur(6px)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/25 opacity-0 transition group-hover:opacity-100"
            style={{ color: RW.cream, backdropFilter: "blur(6px)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* titik indikator slide */}
        <div className="mt-7 flex items-center justify-center gap-2.5">
          {gallery.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setPaused(true);
                window.setTimeout(() => setPaused(false), 9000);
              }}
              aria-label={`Lihat foto ${i + 1}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                i === activeIndex ? "w-7" : "w-2.5"
              }`}
              style={{ backgroundColor: i === activeIndex ? RW.goldHi : "rgba(236,236,214,.3)" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP — modal ala Ruby                                                */
/* ------------------------------------------------------------------ */

function Rsvp({
  invitationId,
  guestName,
  gifts,
}: {
  invitationId: string;
  guestName?: string;
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <section id="rsvp" className="relative overflow-hidden py-16 md:py-20">
      <CornerRose sym="cluster" top className={`-left-10 -top-6 ${CORNER_ROSE_SIZE} opacity-80`} duration={9.8} />
      <CornerRose sym="cluster" top mirrored className={`-right-10 -top-6 ${CORNER_ROSE_SIZE} opacity-80`} duration={8.8} delay={-4} />
      <div className="relative z-10 mx-auto max-w-xl px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <h2 className="rw-h2">RSVP</h2>
          <p className="text-[11px] uppercase tracking-[.46em]" style={{ color: "rgba(243,212,118,.85)" }}>
            Konfirmasi Kehadiran
          </p>
          <p className="text-sm" style={{ color: RW.creamSoft }}>
            Kehadiran dan doa Anda adalah hadiah terbaik bagi kami.
          </p>
          <button type="button" className="rw-btn rw-btn-solid mt-6" onClick={() => setIsOpen(true)}>
            Konfirmasi Kehadiran
          </button>
        </div>
        {gifts.length > 0 && <Kado gifts={gifts} />}
      </div>
      {isOpen && (
        <RubyModal title="Konfirmasi" onClose={closeModal}>
          <p className="mb-6 text-center text-sm text-[#5E1121]">Mohon isi data kehadiran Anda.</p>
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass="text-[#5E1121] bg-[#F3D476] hover:bg-[#EAC853]"
            borderClass="border-[rgba(201,151,31,.4)] bg-white focus:border-[#C9971F] focus:ring-[#F3D476]/50"
          />
        </RubyModal>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado                                                                 */
/* ------------------------------------------------------------------ */

function Kado({ gifts }: { gifts: NonNullable<TemplateProps["data"]["gifts"]> }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <div id="kado" className="mt-16 flex flex-col items-center gap-4 border-t border-[rgba(243,212,118,.24)] pt-12">
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-4 px-6 text-center">
        <p className="text-3xl" style={{ fontFamily: SCRIPT, color: RW.rose }}>
          Tanda kasih
        </p>
        <h2 className="rw-h2">Kado</h2>
        <p className="text-sm" style={{ color: RW.creamSoft }}>
          Doa restu Anda sudah cukup bagi kami. Bila ingin memberi tanda kasih,
          kami berterima kasih dengan tulus.
        </p>
        <button type="button" className="rw-btn rw-btn-solid mt-6" onClick={() => setIsOpen(true)}>
          Kirim Kado
        </button>
      </div>
      {isOpen && (
        <RubyModal title="Kado Cashless" onClose={closeModal}>
          <p className="mb-5 text-center text-sm text-[#5E1121]">Anda dapat mengirimkan kado cashless.</p>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {gifts.map((g, i) => (
              <div
                key={g.id}
                className="rounded-2xl border p-5 text-left shadow-sm"
                style={{
                  borderColor: "rgba(201,151,31,.4)",
                  backgroundColor: i % 2 === 0 ? "rgba(255,255,255,.9)" : "rgba(243,212,118,.16)",
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-base"
                    style={{ backgroundColor: RW.gold, color: "#5E1121", fontFamily: SERIF, fontWeight: 600 }}
                    aria-hidden="true"
                  >
                    {g.provider.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-lg" style={{ fontFamily: SERIF, fontWeight: 500, color: "#5E1121" }}>
                      {g.provider}
                    </p>
                    {g.name && <p className="text-xs opacity-70 text-[#5E1121]">{g.name}</p>}
                  </div>
                </div>
                <p
                  className="select-all text-sm tracking-[.14em]"
                  style={{ color: "#5E1121", fontFamily: SANS, fontWeight: 600 }}
                >
                  {g.accountNumber}
                </p>
                {g.holderName && <p className="mt-0.5 text-xs opacity-70 text-[#5E1121]">a.n. {g.holderName}</p>}
                <div className="mt-3">
                  <div className="inline-flex">
                    <CopyButton text={g.accountNumber} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RubyModal>
      )}
    </div>
  );
}

function RubyModal({
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
      aria-label={title}
      className="rw-modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="rw-sheet">
        <CornerRose sym="cluster" top className="-left-5 -top-4 w-24 opacity-90" duration={8} />
        <button ref={closeButtonRef} type="button" className="rw-close" onClick={onClose} aria-label="Tutup">
          ×
        </button>
        <h3 id="rw-modal-title">{title}</h3>
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
    <section id="ucapan" className="relative overflow-hidden py-12 md:py-16">
      <CornerRose sym="cluster" top className={`-left-10 -top-6 ${CORNER_ROSE_SIZE} opacity-85`} duration={9.2} />
      <CornerRose sym="cluster" top mirrored className={`-right-10 -top-6 ${CORNER_ROSE_SIZE} opacity-85`} duration={10.6} delay={-3.8} />
      <CornerRose sym="cluster" top={false} className={`-bottom-7 -left-10 ${CORNER_ROSE_SIZE} opacity-85`} duration={8.6} delay={-5} />
      <CornerRose sym="cluster" top={false} mirrored className={`-bottom-7 -right-10 ${CORNER_ROSE_SIZE} opacity-85`} duration={9.8} delay={-1.6} />
      <div className="relative z-10 mx-auto max-w-lg px-6">
        <h2 className="rw-h2 text-center">Ucapan &amp; Doa</h2>
        <div
          className="mt-10 rounded-3xl p-5 text-left"
          style={{ backgroundColor: "rgba(236,236,214,.96)", boxShadow: "0 24px 54px -26px rgba(0,0,0,.6)" }}
        >
          <WishForm
            invitationId={invitationId}
            accentClass="text-[#5E1121] bg-[#C9971F] hover:bg-[#B58918]"
            borderClass="border-[rgba(201,151,31,.4)] bg-white focus:border-[#C9971F] focus:ring-[#F3D476]/50"
          />
        </div>
        <div className="mt-10">
          <WishList
            wishes={wishes ?? []}
            cardClass="border-[rgba(243,212,118,.32)] bg-[rgba(67,16,31,.55)] backdrop-blur-md"
            nameClass="text-[#F3D476]"
            avatarClass="bg-[#C9971F] text-[#5E1121]"
            emptyClass="opacity-60"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Penutup — bed bunga magenta (angin) + nama; petal jatuh pelan        */
/* ------------------------------------------------------------------ */

const PETALS: [number, number, number, number][] = [
  [6, 16, 2, 34],
  [22, 19, -5, -52],
  [38, 15, 8, 28],
  [54, 21, -12, -44],
  [68, 17, 4, 36],
  [82, 18, -8, -30],
  [94, 15, 1, 42],
  [14, 20, -14, -38],
  [47, 17, 11, 30],
  [73, 19, -3, -46],
  [88, 14, 6, 24],
  [31, 22, -10, -34],
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
    <section
      className="relative grid min-h-[620px] place-items-center overflow-hidden py-24"
      style={{ color: RW.cream }}
    >
      {/* Foto latar tersamar + petal emas gelayangan */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo ?? GATE_FALLBACK}
          alt=""
          className="h-full w-full object-cover"
          style={{ opacity: .16, WebkitMaskImage: "linear-gradient(transparent, #000 18%)", maskImage: "linear-gradient(transparent, #000 18%)" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 50% 4%, rgba(67,16,31,.6) 0%, transparent 60%), linear-gradient(rgba(23,1,7,.15), rgba(23,1,7,.5))",
          }}
        />
      </div>

      <div aria-hidden="true">
        {PETALS.map(([left, dur, dl, sx], i) => (
          <span
            key={i}
            className="rw-petal"
            style={{
              left: `${left}%`,
              "--dur": `${dur}s`,
              "--dl": `${dl}s`,
              "--sx": `${sx}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <CornerRose sym="cluster" top className={`-left-12 -top-8 ${CORNER_ROSE_SIZE} opacity-85`} duration={9.6} />
      <CornerRose sym="cluster" top mirrored className={`-right-12 -top-8 ${CORNER_ROSE_SIZE} opacity-85`} duration={10.8} delay={-4.2} />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-4 px-6 pb-24 text-center">
        <p className="text-[clamp(2rem,7vw,2.6rem)] leading-[1.25]" style={{ fontFamily: SCRIPT, color: RW.goldHi }}>
          Terima Kasih
        </p>
        <p className="text-sm leading-loose" style={{ color: RW.creamSoft }}>
          Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila
          Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.
        </p>
        <p className="mt-5 text-[11px] uppercase tracking-[.4em]" style={{ color: "rgba(243,212,118,.9)" }}>
          Hormat Kami
        </p>
        <div className="mt-2">
          <NamesTitle brideNick={brideNick} groomNick={groomNick} size="medium" />
        </div>
      </div>

      {/* Bed bunga magenta di dasar penutup */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[34%] w-full opacity-95">
        <div
          className="rw-sway h-full w-full"
          style={{ transformOrigin: "50% 100%", animationName: "rwSwayB", animationDuration: "10.5s" }}
        >
          <RoseSVG sym="bed" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gaya khusus Ruby — satu blok <style> di root                         */
/* ------------------------------------------------------------------ */

const RUBY_KINETICS = `
${SWAY_KEYFRAMES}

.rw-nav{
  position:fixed; z-index:60; left:50%;
  bottom:calc(14px + env(safe-area-inset-bottom,0px));
  width:min(440px,calc(100% - 28px));
  display:flex; justify-content:space-between; padding:7px 8px;
  border:1px solid rgba(243,212,118,.3); border-radius:999px;
  background:rgba(28,2,12,.8); backdrop-filter:blur(16px) saturate(1.2);
  -webkit-backdrop-filter:blur(16px) saturate(1.2);
  box-shadow:0 16px 40px -16px rgba(0,0,0,.75);
  visibility:hidden; pointer-events:none;
  transform:translate(-50%,150%); transition:transform .9s cubic-bezier(.2,.7,.2,1);
}
.rw-nav.is-visible{visibility:visible;pointer-events:auto;transform:translate(-50%,0)}
.rw-nav a{
  flex:1; min-width:0; display:flex; flex-direction:column; align-items:center;
  gap:3px; padding:6px 2px; border-radius:999px; color:rgba(236,236,214,.66);
  font:600 7px/1.3 Poppins,Inter,Arial,sans-serif;
  letter-spacing:.08em; text-transform:uppercase; text-decoration:none;
  transition:color .3s,background .3s;
}
.rw-nav a svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.4}
.rw-nav a.is-active{color:#F3D476;background:rgba(201,151,31,.22)}
.rw-footer{
  padding:34px 24px calc(96px + env(safe-area-inset-bottom,0px));
  background:#180208; color:rgba(236,236,214,.55); text-align:center;
  font:400 11px/2 Poppins,Inter,Arial,sans-serif;
  letter-spacing:.18em; text-transform:uppercase;
}
.rw-footer p{margin:0}
.rw-footer svg{width:11px;height:11px;fill:#C9971F;stroke:#C9971F;vertical-align:-1px}
.rw-h2{
  font-family: Poppins,Inter,Arial,sans-serif;
  font-weight:700; font-size:clamp(20px,6.4vw,26px);
  letter-spacing:.3em; text-transform:uppercase; color:#ECECD6;
  margin:0; line-height:1.15;
}
/* heading pill besar seperti "GALERI FOTO" di desain */
.rw-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:.55rem;
  padding:12px 22px; border:1px solid rgba(243,212,118,.55); border-radius:999px;
  background:transparent; color:#F3D476;
  font:600 10.5px/1 Poppins,Inter,Arial,sans-serif;
  letter-spacing:.22em; text-transform:uppercase;
  text-decoration:none; transition:background .35s, color .35s, transform .45s;
}
.rw-btn-solid{
  background:#ECECD6;border-color:#ECECD6;color:#5E1121;
  scroll-margin-block:120px;
}
.rw-btn-solid:hover{background:#FFFFFF}
.rw-btn:hover{background:rgba(243,212,118,.12)}
.rw-modal{
  position:fixed; inset:0; z-index:80; display:grid; place-items:center;
  padding:16px; background:rgba(24,1,8,.6); backdrop-filter:blur(7px);
  -webkit-backdrop-filter:blur(7px);
}
.rw-sheet{
  position:relative; width:min(100%,420px); max-height:calc(100% - 20px);
  overflow:auto; border-radius:26px; padding:44px 28px 30px;
  background:#F6F3E8; box-shadow:0 34px 80px -24px rgba(0,0,0,.7);
}
.rw-sheet h3{
  margin:0; color:#5E1121; text-align:center;
  font:700 20px/1.15 Poppins,Inter,Arial,sans-serif;
  letter-spacing:.3em; text-transform:uppercase;
}
.rw-close{
  position:absolute; z-index:2; top:12px; right:12px; display:grid;
  width:34px; height:34px; place-items:center; border:1px solid rgba(201,151,31,.45);
  border-radius:50%; background:transparent; color:#5E1121; font-size:22px; line-height:1;
}
.rw-scroll-line{
  width:1px; height:42px;
  background:linear-gradient(#F3D476, transparent);
  transform-origin:top; animation:rwCue 2.4s ease-in-out infinite;
}
@keyframes rwCue{
  0%{transform:scaleY(0)} 50%{transform:scaleY(1)}
  100%{transform:scaleY(1); opacity:0}
}
.rw-petal{
  position:absolute; top:-30px; width:10px; height:14px;
  border-radius:70% 0 70% 0; background:#F3D476; opacity:0; z-index:1;
  animation:rwFall var(--dur,17s) linear var(--dl,0s) infinite;
}
@keyframes rwFall{
  0%{transform:translate(0,-30px) rotate(0); opacity:0}
  10%{opacity:.45} 90%{opacity:.35}
  100%{transform:translate(var(--sx,40px), 700px) rotate(420deg); opacity:0}
}
@media (prefers-reduced-motion:reduce){
  .rw-scroll-line,.rw-petal{animation:none}
  .rw-nav{transition:none}
  [style*="animation"]{animation:none !important}
}
`;
