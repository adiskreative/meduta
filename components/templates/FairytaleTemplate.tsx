"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Heart,
  Landmark,
  ExternalLink,
  AtSign,
  Gift,
  Sparkles,
  ChevronDown,
  ArrowUp,
  PartyPopper,
  BookOpen,
  X,
} from "lucide-react";
import FairytaleGate from "./FairytaleGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown, googleCalendarUrl } from "./SharedWidgets";
import {
  formatDate,
  formatTime,
  splitAgenda,
  type TemplateProps,
} from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Fairytale Dream — adopsi 1:1 dari referensi
 * "colorful_floral_fairytale_wedding_invitation.tsx" (dongeng bunga
 * penuh warna), diubah menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic) — bukan WebAudio engine referensi
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan di DB
 * - Background berlapis: pilihan user > admin (template) > bawaan gradasi
 * - Tanpa AI Gemini & galeri hardcode referensi (risiko keamanan) —
 *   diganti galeri & kado dari data user, lightbox tetap dipertahankan
 * Khas template ini: partikel ajaib (kelopak + kunang-kunang), kupu-kupu
 * animasi, fairytale card glassmorphism, teks gradasi pink-purple-teal.
 */

/* ------------------------------------------------------------------ */
/* CSS khusus template (prefix ft- = fairytale)                        */
/* ------------------------------------------------------------------ */
const FT_STYLES = `
  .ft-card {
    background: linear-gradient(160deg, #fffdfd 0%, #fff4f9 50%, #f2fefc 100%);
    border: 2px solid rgba(251, 207, 232, 0.9);
    box-shadow: 0 18px 40px rgba(219,39,119,0.14), inset 0 0 0 1px rgba(255,255,255,0.85);
  }
  .ft-glow-text {
    text-shadow: 0 0 18px rgba(255,20,147,0.35);
  }
  .ft-spin-slow { animation: ftSpin 18s linear infinite; transform-origin: center; }
  @keyframes ftSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes ftFlapL {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(0.25); }
  }
  .ft-wing-l {
    animation: ftFlapL 0.45s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: right center;
  }
  .ft-wing-r {
    animation: ftFlapR 0.45s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: left center;
  }
  @keyframes ftFlapR {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(0.25); }
  }
  @keyframes ftFloatPath {
    0% { transform: translate(0, 0) rotate(0deg); }
    20% { transform: translate(12px, -16px) rotate(8deg); }
    40% { transform: translate(-10px, -10px) rotate(-8deg); }
    60% { transform: translate(10px, -20px) rotate(5deg); }
    80% { transform: translate(-8px, -6px) rotate(-5deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  .ft-float { animation: ftFloatPath 6s ease-in-out infinite; }
  @keyframes ftCloudDrift {
    0%, 100% { transform: translateX(-20px); }
    50% { transform: translateX(20px); }
  }
  .ft-cloud { animation: ftCloudDrift 12s ease-in-out infinite; }
  @keyframes ftScrollBounce {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(8px); opacity: 0.6; }
  }
  .ft-scroll-hint { animation: ftScrollBounce 1.8s ease-in-out infinite; }
`;

/* ------------------------------------------------------------------ */
/* Kupu-kupu animasi (CSS murni pengganti framer-motion referensi)     */
/* ------------------------------------------------------------------ */
function Butterfly({
  style,
  color = "#ec4899",
  duration = 6,
  delay = 0,
}: {
  style?: React.CSSProperties;
  color?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      aria-hidden
      className="ft-float pointer-events-none absolute z-20"
      style={{ ...style, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
        <g className="ft-wing-l">
          <path
            d="M 50 50 C 20 20, 0 40, 20 70 C 40 90, 50 60, 50 50 Z"
            fill={color}
            opacity="0.85"
          />
        </g>
        <g className="ft-wing-r">
          <path
            d="M 50 50 C 80 20, 100 40, 80 70 C 60 90, 50 60, 50 50 Z"
            fill={color}
            opacity="0.85"
          />
        </g>
        <circle cx="50" cy="50" r="4" fill="#fbbf24" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wreath bunga watercolor (dari referensi) — membingkai foto pasangan */
/* ------------------------------------------------------------------ */
function WatercolorFlowerFrame({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={`h-full w-full ${className}`}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="ftGoldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="250" cy="250" r="210" stroke="url(#ftGoldFrame)" strokeWidth="8" strokeDasharray="24 18" className="ft-spin-slow opacity-70" />
      <circle cx="250" cy="250" r="228" stroke="#f472b6" strokeWidth="4" opacity="0.4" />
      {[0, 90, 180, 270].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 250 250)`}>
          <path d="M 250 20 C 270 5, 290 20, 280 40 C 270 60, 230 60, 220 40 C 210 20, 230 5, 250 20 Z" fill="#ff1493" opacity="0.85" />
          <path d="M 250 15 C 265 0, 280 15, 270 30 C 260 45, 240 45, 230 30 C 220 15, 235 0, 250 15 Z" fill="#ffb6c1" opacity="0.9" />
          <circle cx="250" cy="25" r="14" fill="#fbbf24" />
          <path d="M 220 35 C 190 20, 180 50, 210 55 Z" fill="#34d399" opacity="0.8" />
          <path d="M 280 35 C 310 20, 320 50, 290 55 Z" fill="#2dd4bf" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas partikel ajaib: kelopak watercolor + kunang-kunang berkilau  */
/* ------------------------------------------------------------------ */
function MagicalParticleCanvas({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let raf = 0;

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Warna partikel: pink, magenta, lavender, turquoise, peach, emas
    const COLORS = [
      "rgba(255, 105, 180, ",
      "rgba(219, 39, 119, ",
      "rgba(168, 85, 247, ",
      "rgba(45, 212, 191, ",
      "rgba(251, 146, 60, ",
      "rgba(250, 204, 21, ",
    ];

    type Particle = {
      x: number; y: number; size: number; speedX: number; speedY: number;
      rotation: number; rotationSpeed: number; color: string;
      opacity: number; type: "petal" | "firefly";
    };
    const makeParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 3,
      speedX: Math.random() * 1.5 - 0.75,
      speedY: Math.random() * 1.2 + 0.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.7 + 0.3,
      type: Math.random() > 0.4 ? "petal" : "firefly",
    });
    const particles: Particle[] = Array.from({ length: 55 }, makeParticle);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.5;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === "petal") {
          // Kelopak watercolor organik
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(p.size, -p.size * 1.5, p.size * 2, p.size, 0, p.size * 2);
          ctx.bezierCurveTo(-p.size * 2, p.size, -p.size, -p.size * 1.5, 0, 0);
          ctx.fillStyle = `${p.color}${p.opacity})`;
          ctx.fill();
        } else {
          // Kunang-kunang berkilau emas
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 opacity-75"
      aria-hidden
    />
  );
}

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function FairytaleTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <FairytaleShell
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

function FairytaleShell({
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
  // Acara: entri "Akad" pada Rangkaian Acara digabung ke Acara Utama agar
  // tidak tampil dobel (lihat splitAgenda).
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

  // Prioritas background: pilihan user > admin (template) > bawaan gradasi
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
      className="relative min-h-screen overflow-x-hidden font-sans text-slate-800"
      style={
        bgUrl
          ? undefined
          : {
              background:
                "linear-gradient(135deg, #fce7f3 0%, #f3e8ff 35%, #fffbeb 65%, #f0fdfa 100%)",
              backgroundAttachment: "fixed",
            }
      }
    >
      <style>{FT_STYLES}</style>

      {/* Background kustom user/admin sebagai lapisan penuh */}
      {bgUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgUrl}
            alt=""
            className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          />
          {/* Lapisan pengapit agar teks tetap terbaca di atas foto */}
          <div className="pointer-events-none fixed inset-0 z-0 bg-white/45" />
        </>
      ) : null}

      {/* Partikel ajaib — hanya setelah gerbang dibuka */}
      <MagicalParticleCanvas active={gateOpen} />

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

      <CountdownSection eventDate={agenda.main.date} eventName={data.eventName} />

      {groom?.name || bride?.name ? (
        <Couple groom={groom} bride={bride} />
      ) : null}

      {story.length > 0 ? <StorySection story={story} /> : null}

      <EventsSection main={agenda.main} events={events} />

      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      <RsvpSection invitationId={invitationId} guestName={guestName} />

      <Wishes invitationId={invitationId} wishes={wishes} />

      {data.customMessage ? <MessageSection text={data.customMessage} /> : null}

      <Footer groomName={groom?.name} brideName={bride?.name} />

      {/* FAB musik + tombol kembali ke atas */}
      {data.musicUrl && music ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            positionClassName="relative z-50"
            buttonClassName="border-2 border-white bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 text-white"
            playingIconClassName="h-5 w-5 text-pink-100"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Kembali ke atas"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ec4899 0%, #a855f7 50%, #14b8a6 100%)",
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white shadow-lg transition-all duration-300 hover:scale-110"
        >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-slate-800"
      style={{ background: "linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #f0fdfa 100%)" }}
    >
      <BookOpen className="h-8 w-8 text-pink-500" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-slate-500">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heading section ala referensi: script warna + judul serif royal     */
/* ------------------------------------------------------------------ */
function SectionHeading({
  script,
  scriptColor = "text-pink-600",
  title,
  desc,
}: {
  script: string;
  scriptColor?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-14 text-center">
      <span
        className={`text-4xl ${scriptColor}`}
        style={{ fontFamily: "var(--font-script)" }}
      >
        {script}
      </span>
      <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-slate-800 sm:text-4xl">
        {title}
      </h2>
      {desc ? (
        <p className="mt-2 font-[family-name:var(--font-serif-elegant)] text-sm italic text-slate-600">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. HERO + GERBANG STORYBOOK                                         */
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
  const cover = (
    <header className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-20 text-center">
      {/* Kupu-kupu melayang (dari referensi) */}
      <Butterfly style={{ top: "15%", left: "8%" }} color="#f43f5e" duration={7} />
      <Butterfly style={{ top: "65%", right: "10%" }} color="#a855f7" duration={8} delay={0.8} />
      <Butterfly style={{ bottom: "18%", left: "15%" }} color="#14b8a6" duration={6} delay={1.4} />

      {/* Awan dongeng melayang */}
      <div className="ft-cloud pointer-events-none absolute left-0 right-0 top-10 text-center font-[family-name:var(--font-serif-elegant)] text-xs uppercase tracking-widest text-pink-400/60">
        ☁️ Welcome to Our Storybook Realm ☁️
      </div>

      {/* Bingkai wreath watercolor mengelilingi foto pasangan */}
      <div className="relative mx-auto my-6 h-64 w-64 sm:h-80 sm:w-80">
        <WatercolorFlowerFrame className="pointer-events-none absolute -inset-8 z-10" />
        <div className="relative z-0 h-full w-full overflow-hidden rounded-full border-4 border-white shadow-2xl">
          {gatePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gatePhoto}
              alt="Foto pasangan"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 to-teal-100">
              <Heart className="h-16 w-16 fill-current text-pink-400" />
            </div>
          )}
        </div>
      </div>

      <span className="inline-block rounded-full border border-purple-200 bg-white/80 px-5 py-1.5 text-sm font-semibold uppercase tracking-widest text-purple-700 shadow-sm">
        {eventName}
      </span>

      <h1
        className="ft-glow-text my-4 text-5xl font-bold leading-tight sm:text-7xl"
        style={{
          fontFamily: "var(--font-script)",
          backgroundImage:
            "linear-gradient(to right, #db2777, #e11d48, #9333ea, #0d9488)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
      </h1>

      <p className="mx-auto max-w-xl font-[family-name:var(--font-serif-elegant)] text-lg italic text-slate-700 md:text-xl">
        &ldquo;Sama seperti kelopak bunga yang mekar di musim semi, cinta kami
        tumbuh menjadi keabadian.&rdquo;
      </p>

      {/* Pill tanggal & lokasi (dari referensi) — kartu solid agar teks tajam */}
      {(eventDate || venue) && (
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border-2 border-pink-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-lg md:text-base">
          {eventDate ? (
            <>
              <CalendarDays className="h-5 w-5 text-pink-600" />
              <span>{formatDate(eventDate)}</span>
            </>
          ) : null}
          {eventDate && venue ? <span className="text-pink-400">|</span> : null}
          {venue ? (
            <>
              <MapPin className="h-5 w-5 text-teal-600" />
              <span>{venue}</span>
            </>
          ) : null}
        </div>
      )}

      {/* Indikator gulir */}
      <div className="mt-10 flex flex-col items-center">
        <span className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-600">
          Gulir Ke Bawah
        </span>
        <span className="ft-scroll-hint flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-pink-500 shadow-md">
          <ChevronDown className="h-6 w-6" />
        </span>
      </div>
    </header>
  );

  // Saat gerbang tertutup: FairytaleGate fullscreen (kartu storybook)
  if (locked) {
    return (
      <FairytaleGate
        eventName={eventName === "Undangan Pernikahan" ? "The Fairytale Wedding Invitation" : eventName}
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
/* 2. COUNTDOWN: kartu ornamen jam bunga                               */
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
    { label: "Hari", value: days, color: "from-pink-500 to-rose-400" },
    { label: "Jam", value: hours, color: "from-purple-500 to-indigo-400" },
    { label: "Menit", value: minutes, color: "from-teal-500 to-emerald-400" },
    { label: "Detik", value: seconds, color: "from-amber-500 to-orange-400" },
  ];
  const calUrl = googleCalendarUrl({
    title: eventName ?? "Pernikahan",
    date: eventDate,
  });
  return (
    <section className="relative px-4 py-16 text-center">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pink-100 p-2 text-pink-600">
          <Clock className="h-6 w-6" />
        </div>
        <h2 className="mb-2 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-slate-800 md:text-4xl">
          Hitung Mundur Hari Bahagia
        </h2>
        <p className="mb-10 font-[family-name:var(--font-serif-elegant)] italic text-slate-600">
          Menghitung detik menuju pengikatan janji suci
        </p>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="ft-card group relative overflow-hidden rounded-3xl border-2 border-pink-200 p-6 text-center shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`absolute left-0 right-0 top-0 h-2 bg-gradient-to-r ${item.color}`} />
              <span className="block font-[family-name:var(--font-serif-elegant)] text-4xl font-bold tabular-nums text-slate-800 transition-colors group-hover:text-pink-600 md:text-5xl">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {eventDate ? (
          <div className="mt-10">
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-pink-200 bg-white/90 px-6 py-3 font-bold text-pink-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-pink-500 hover:text-white"
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
/* 3. MEMPELAI: kartu fairytale besar dengan foto bulat                */
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
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          script="Pasangan Mempelai"
          title="Mempelai Pria & Wanita"
          desc="Dengan memohon rahmat dan ridho Allah SWT, kami menyatukan dua insan"
        />

        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8">
          <PersonCard
            person={groom}
            role="Mempelai Pria"
            nameColor="text-teal-700"
            roleColor="text-teal-600"
            borderColor="border-teal-200"
            ringColor="border-teal-400"
          />
          <PersonCard
            person={bride}
            role="Mempelai Wanita"
            nameColor="text-pink-700"
            roleColor="text-pink-600"
            borderColor="border-pink-200"
            ringColor="border-pink-400"
          />
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  nameColor,
  roleColor,
  borderColor,
  ringColor,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  nameColor: string;
  roleColor: string;
  borderColor: string;
  ringColor: string;
}) {
  return (
    <div
      className={`ft-card relative rounded-[35px] border-4 p-8 text-center shadow-2xl ${borderColor}`}
    >
      <div className={`relative mx-auto mb-6 h-48 w-48 overflow-hidden rounded-full border-4 shadow-lg ${ringColor}`}>
        {person?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt={person.name ?? role}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/80">
            <Heart className="h-12 w-12 fill-current text-pink-400" />
          </div>
        )}
      </div>

      <h3
        className={`text-3xl font-bold ${nameColor}`}
        style={{ fontFamily: "var(--font-script)" }}
      >
        {person?.name ?? "-"}
      </h3>
      <p className={`mt-1 text-xs font-semibold uppercase tracking-widest ${roleColor}`}>
        {role}
      </p>

      {person?.parentName && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {person.childOf ?? "Putra/Putri dari"} <br />
          <span className="font-bold text-slate-800">{person.parentName}</span>
        </p>
      )}
      {person?.bio && (
        <p className="mt-3 text-xs italic leading-relaxed text-slate-500">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}

      {person?.instagram && (
        <div className="mt-6">
          <a
            href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-pink-100/70 px-4 py-2 text-xs font-bold text-pink-700 transition-all hover:bg-pink-500 hover:text-white"
          >
            <AtSign className="h-4 w-4" />
            <span>{person.instagram}</span>
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. KISAH CINTA: "Bab demi bab cerita dongeng" (dari referensi)      */
/* ------------------------------------------------------------------ */
function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  const CHAPTERS = ["Bab I", "Bab II", "Bab III", "Bab IV", "Bab V"];
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          script="Kisah Cinta Kami"
          scriptColor="text-purple-600"
          title="Bab Demi Bab Cerita Dongeng"
        />

        <div className="space-y-8">
          {story.map((item, index) => (
            <div
              key={item.id}
              className="ft-card relative rounded-3xl border-2 border-pink-200 p-6 shadow-lg md:p-8"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                {item.date ? (
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700">
                    {formatDate(item.date)}
                  </span>
                ) : null}
                <h4 className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                  {CHAPTERS[index % CHAPTERS.length]}
                  {item.title ? `: ${item.title}` : ""}
                </h4>
              </div>
              {item.description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
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
/* 5. ACARA: kartu Akad + Resepsi ala referensi + acara tambahan       */
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
          script="Waktu & Tempat"
          scriptColor="text-teal-600"
          title="Rangkaian Acara Pernikahan"
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Kartu Akad */}
          <EventCard
            icon={<Heart className="h-8 w-8" />}
            iconClass="bg-pink-100 text-pink-600"
            title="Akad Nikah"
            date={main.date}
            time={main.time}
            venue={main.venue}
            mapUrl={main.mapUrl}
            borderColor="border-pink-300"
            buttonClass="from-pink-500 to-rose-500"
            iconRowColor="text-pink-500"
          />

          {/* Kartu Resepsi: ambil entri "Resepsi" dari Rangkaian Acara bila ada */}
          {events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? (
            <EventCard
              icon={<PartyPopper className="h-8 w-8" />}
              iconClass="bg-purple-100 text-purple-600"
              title={events[0].title ?? "Resepsi"}
              date={events[0].date}
              time={events[0].time}
              venue={events[0].location}
              mapUrl={events[0].locationMap}
              borderColor="border-purple-300"
              buttonClass="from-purple-500 to-indigo-500"
              iconRowColor="text-purple-500"
            />
          ) : null}
        </div>

        {/* Acara tambahan lainnya */}
        {events.length > (events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? 1 : 0) ? (
          <div className="mx-auto mt-8 max-w-2xl space-y-5">
            {events
              .slice(events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? 1 : 0)
              .map((e) => (
                <div
                  key={e.id}
                  className="ft-card rounded-3xl p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="inline-block rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {formatDate(e.date)}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-slate-800">
                    {e.title ?? "Acara"}
                  </h3>
                  {e.time && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <Clock className="h-4 w-4 text-pink-500" /> {formatTime(e.time)}
                    </p>
                  )}
                  {e.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-teal-500" /> {e.location}
                    </p>
                  )}
                  {e.locationMap && (
                    <a
                      href={e.locationMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-pink-600 hover:underline"
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
  iconClass,
  title,
  date,
  time,
  venue,
  mapUrl,
  borderColor,
  buttonClass,
  iconRowColor,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
  borderColor: string;
  buttonClass: string;
  iconRowColor: string;
}) {
  return (
    <div
      className={`ft-card relative overflow-hidden rounded-[35px] border-4 p-8 shadow-2xl ${borderColor}`}
    >
      <div className={`mb-4 inline-block rounded-2xl p-3 ${iconClass}`}>{icon}</div>
      <h3 className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-slate-800">
        {title}
      </h3>
      {date ? <p className={`mt-1 text-sm font-semibold ${iconRowColor}`}>{formatDate(date)}</p> : null}

      <div className="my-6 space-y-3 text-sm text-slate-700">
        {time && (
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 ${iconRowColor}`} />
            <span>{formatTime(time)}</span>
          </div>
        )}
        {venue && (
          <div className="flex items-start gap-3">
            <MapPin className={`h-5 w-5 shrink-0 ${iconRowColor}`} />
            <span>{venue}</span>
          </div>
        )}
      </div>

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 ${buttonClass}`}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Petunjuk Lokasi Google Maps</span>
        </a>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. GALERI: grid rotasi playfull + lightbox (dari referensi)         */
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
          script="Galeri Foto"
          title="Momen Indah Berdua"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {gallery.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected({ url: item.url, caption: item.caption })}
              className={`ft-card group relative h-80 overflow-hidden rounded-3xl border-4 border-pink-200/80 shadow-xl transition-transform duration-500 hover:rotate-2 hover:scale-105 ${
                index % 2 === 0 ? "hover:rotate-2" : "hover:-rotate-2"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-pink-900/70 via-transparent to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-lg font-bold text-white font-[family-name:var(--font-serif-elegant)]">
                  {item.caption ?? ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal (dari referensi) */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Lihat foto"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption ?? "Foto galeri"}
              className="max-h-[85vh] max-w-full rounded-3xl border-4 border-white object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup"
              className="absolute -top-12 right-0 rounded-full bg-white p-3 text-slate-800 transition-colors hover:bg-pink-500 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. KADO DIGITAL (kartu putih ala referensi)                         */
/* ------------------------------------------------------------------ */
function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  const ACCENTS = ["border-pink-200", "border-teal-200", "border-purple-200", "border-amber-200"];
  return (
    <section className="relative px-4 py-20 text-center">
      <div className="mx-auto max-w-4xl">
        <div className="ft-card relative overflow-hidden rounded-[40px] border-4 border-amber-300 p-8 text-left shadow-2xl md:p-12">
          <div className="mb-4 text-center">
            <div className="mb-4 inline-block rounded-3xl bg-amber-100 p-4 text-amber-600">
              <Gift className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-slate-800 md:text-4xl">
              Hadiah Digital Pernikahan
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-[family-name:var(--font-serif-elegant)] text-sm italic text-slate-600">
              Doa restu Anda merupakan hadiah terindah bagi kami. Namun jika Anda
              ingin memberi tanda kasih, dapat mengirimkan melalui:
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {gifts.map((g, i) => (
              <div
                key={g.id}
                className={`relative rounded-3xl border-2 bg-white/90 p-6 shadow-md ${ACCENTS[i % ACCENTS.length]}`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {g.provider}
                </span>
                <h4 className="my-1 font-mono text-2xl font-bold text-slate-800">
                  {g.accountNumber}
                </h4>
                {g.holderName ? (
                  <p className="text-sm font-semibold text-slate-600">a.n. {g.holderName}</p>
                ) : null}
                <div className="mt-4">
                  <CopyButton text={g.accountNumber} />
                </div>
              </div>
            ))}
          </div>
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
      <div className="ft-card mx-auto max-w-2xl rounded-[40px] border-4 border-pink-300 p-8 shadow-2xl md:p-12">
        <div className="mb-8 text-center">
          <span
            className="text-4xl text-pink-600"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Konfirmasi Kehadiran
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-slate-800">
            RSVP Undangan Dongeng
          </h2>
        </div>
        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 shadow-lg shadow-pink-500/30 hover:shadow-xl"
          borderClass="border-pink-200 bg-white/90 focus:border-pink-500 focus:ring-pink-100"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. WISHES: papan ucapan grid (dari referensi)                       */
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
        <div className="mb-12 text-center">
          <span
            className="text-4xl text-purple-600"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Papan Ucapan
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-slate-800 md:text-4xl">
            Doa &amp; Harapan Para Tamu
          </h2>
        </div>

        {/* Feed ucapan (tersimpan DB, grid 2 kolom ala referensi) */}
        <div className="mb-12 grid max-h-[520px] grid-cols-1 gap-6 overflow-y-auto pr-2 md:grid-cols-2">
          <WishList
            wishes={wishes ?? []}
            cardClass="ft-card rounded-3xl border-2 border-pink-200 shadow-lg"
            nameClass="text-slate-800"
            avatarClass="bg-gradient-to-br from-pink-400 to-purple-500 text-white"
            emptyClass="text-slate-400"
          />
        </div>

        <div className="ft-card rounded-3xl border-2 border-pink-200 p-6 shadow-xl md:p-8">
          <WishForm
            invitationId={invitationId}
            accentClass="bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 shadow-lg shadow-pink-500/30 hover:shadow-xl"
            borderClass="border-pink-200 bg-white/90 focus:border-purple-500 focus:ring-purple-100"
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
      <div className="ft-card mx-auto max-w-lg rounded-[40px] border-4 border-teal-200 p-8 shadow-2xl">
        <Sparkles className="mx-auto mb-4 h-6 w-6 text-amber-400" />
        <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-slate-800">
          {text}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. FOOTER                                                          */
/* ------------------------------------------------------------------ */
function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="relative border-t border-pink-200/60 bg-white/40 px-4 py-12 text-center backdrop-blur-md">
      <h3
        className="text-3xl font-bold text-pink-600"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {groomName ?? "Pria"} &amp; {brideName ?? "Wanita"}
      </h3>
      <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-xs italic text-slate-500">
        &ldquo;Sampai jumpa di hari bahagia pernikahan dongeng kami!&rdquo;
      </p>
      <p className="mt-6 text-[10px] uppercase tracking-widest text-slate-400">
        © {new Date().getFullYear()} MEDUTA
      </p>
    </footer>
  );
}
