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
  Flower2,
  Sparkles,
  ChevronDown,
  ArrowUp,
  HeartHandshake,
  CalendarPlus,
} from "lucide-react";
import FlowerGate from "./FlowerGate";
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
 * Enchanted Flower Garden — adopsi 1:1 dari referensi
 * "digital_wedding_invitation.html" (taman bunga penuh warna), diubah
 * menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic) — bukan MP3 hardcoded referensi
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan di DB
 * - Background berlapis: pilihan user > admin (template) > bawaan gradasi
 * - Tanpa AI Gemini & embed map iframe referensi (risiko keamanan) —
 *   diganti tombol Google Maps dari data user
 * Khas template ini: pintu gerbang bunga yang membuka, kelopak jatuh
 * canvas, glass card penuh warna, teks gradasi rose-coral-purple.
 */

/* Palet garden (konsisten dengan referensi) */
const GARDEN = {
  rose: "#ff4d8d",
  coral: "#ff7052",
  peach: "#ffb396",
  lavender: "#b185db",
  purple: "#7b2cbf",
  deepPlum: "#3c096c",
} as const;

/* Kelas CSS khusus template (prefix fgr- = flower garden) */
const FGR_STYLES = `
  .fgr-text-gradient {
    background: linear-gradient(135deg, #e60067 0%, #ff5232 40%, #8b008b 80%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
  /* Kartu solid gradient — TANPA backdrop-blur agar teks selalu tajam */
  .fgr-glass {
    background: linear-gradient(160deg, rgba(255, 248, 252, 0.97) 0%, rgba(255, 244, 240, 0.97) 55%, rgba(250, 244, 253, 0.97) 100%);
    border: 1px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 40px rgba(123, 44, 191, 0.12), 0 8px 16px rgba(255, 77, 141, 0.08);
  }
  .fgr-glass-accent {
    background: linear-gradient(135deg, #fff0f5 0%, #ffffff 60%, #fff5f0 100%);
    border: 2px solid rgba(255, 179, 150, 0.45);
    box-shadow: 0 15px 35px rgba(255, 112, 82, 0.15);
  }
  @keyframes fgrSway {
    0%, 100% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
  }
  @keyframes fgrSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .fgr-spin-slow { animation: fgrSpin 18s linear infinite; }
  .fgr-sway { animation: fgrSway 4s ease-in-out infinite; }
`;

/* ------------------------------------------------------------------ */
/* Canvas kelopak bunga jatuh (dari referensi)                         */
/* ------------------------------------------------------------------ */
function PetalCanvas({ active }: { active: boolean }) {
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

    type Petal = {
      x: number; y: number; size: number; speedY: number; speedX: number;
      rotation: number; rotSpeed: number; color: string; opacity: number;
    };
    const COLORS = ["#ff4d8d", "#ff7052", "#ffb396", "#b185db", "#ffd1dc"];
    const makePetal = (): Petal => ({
      x: Math.random() * width,
      y: -20,
      size: Math.random() * 12 + 8,
      speedY: Math.random() * 1.5 + 0.8,
      speedX: Math.random() - 0.5,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 2 - 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.7 + 0.3,
    });
    const petals: Petal[] = Array.from({ length: 35 }, makePetal);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) + p.speedX;
        p.rotation += p.rotSpeed;
        if (p.y > height + 20) Object.assign(p, makePetal(), { y: -20 });
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size, -p.size, -p.size, p.size, 0, p.size * 1.5);
        ctx.bezierCurveTo(p.size, p.size, p.size, -p.size, 0, 0);
        ctx.fill();
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
      className="pointer-events-none fixed inset-0 z-20 h-screen w-screen"
      aria-hidden
    />
  );
}

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function EnchantedTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <EnchantedShell
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

function EnchantedShell({
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
    <div className="relative min-h-screen font-sans text-[#3a153d]" style={bgUrl ? undefined : { background: "linear-gradient(135deg, #fff0f5 0%, #fff7ed 20%, #f3e8ff 40%, #e0f2fe 60%, #f0fdf4 80%, #fff0f5 100%)", backgroundAttachment: "fixed" }}>
      <style>{FGR_STYLES}</style>

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
          <div className="pointer-events-none fixed inset-0 z-0 bg-white/55" />
        </>
      ) : null}

      {/* Kelopak bunga jatuh — hanya setelah gerbang dibuka */}
      <PetalCanvas active={gateOpen} />

      <Cover
        eventName={data.eventName ?? "Undangan Pernikahan"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data.eventDate}
        guestName={guestName}
        locked={!gateOpen}
        onOpen={onGateOpen}
        bgUrl={bgUrl}
        gatePhoto={gatePhoto}
      />

      <CountdownSection eventDate={agenda.main.date} eventName={data.eventName} />

      {groom?.name || bride?.name ? (
        <Couple
          groom={groom}
          bride={bride}
          eventName={data.eventName ?? "Pernikahan"}
          quoteTitle={data.quoteTitle}
          quoteText={data.quoteText}
          quoteSource={data.quoteSource}
          quoteHidden={data.quoteHidden}
        />
      ) : null}

      {story.length > 0 ? <StorySection story={story} /> : null}

      <EventsSection
        main={agenda.main}
        events={events}
      />

      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      <RsvpSection
        invitationId={invitationId}
        guestName={guestName}
      />

      <Wishes invitationId={invitationId} wishes={wishes} />

      {data.customMessage ? <MessageSection text={data.customMessage} /> : null}

      <Footer groomName={groom?.name} brideName={bride?.name} />

      {/* FAB musik + tombol kembali ke atas */}
      {data.musicUrl && music ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            buttonClassName="border-2 border-white bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            playingIconClassName="h-5 w-5 text-pink-100"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            className="fgr-glass flex h-12 w-12 items-center justify-center rounded-full text-[#3c096c] shadow-lg transition-all duration-300 hover:scale-110 hover:bg-rose-500 hover:text-white"
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-br from-rose-50 via-white to-purple-50 px-6 text-center text-[#3c096c]">
      <Flower2 className="h-8 w-8 text-rose-500" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-gray-500">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heading section ala referensi: script gradasi + garis gradasi       */
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
    <div className="mb-14 text-center">
      <span
        className="text-4xl text-rose-500"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {script}
      </span>
      <h2 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#3c096c] sm:text-4xl">
        {title}
      </h2>
      {desc ? <p className="mt-2 text-xs text-gray-600">{desc}</p> : null}
      <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-purple-600" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. HERO + GERBANG                                                   */
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
  const cover = (
    <header className="animate-fade-up relative z-10 mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      {/* Ornamen floral SVG melayang (dari referensi) */}
      <div className="animate-float-slow pointer-events-none absolute left-4 top-8 w-32 opacity-80 sm:w-56">
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full text-rose-500">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
          <path d="M100 20 C120 60 180 100 100 180 C20 100 80 60 100 20 Z" fill="rgba(255,112,82,0.15)" stroke="currentColor" />
        </svg>
      </div>
      <div className="fgr-sway pointer-events-none absolute bottom-10 right-4 w-36 opacity-80 sm:w-64">
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full text-purple-400">
          <path d="M30 100 Q100 20 170 100 Q100 180 30 100 Z" fill="rgba(177,133,219,0.2)" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className="fgr-glass relative w-full max-w-2xl rounded-3xl border-2 border-white/90 p-6 shadow-2xl sm:p-12">
        {/* Aksen bunga sudut */}
        <Flower2 className="pointer-events-none absolute -left-5 -top-5 h-16 w-16 animate-bounce text-rose-400" />
        <Sparkles className="fgr-sway pointer-events-none absolute -bottom-5 -right-5 h-16 w-16 text-purple-500" />

        <div className="mb-4 inline-block rounded-full border border-rose-300/40 bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-orange-300/20 px-6 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3c096c]">
            {eventName}
          </span>
        </div>

        {/* Foto pasangan dalam bingkai arch bunga berputar */}
        <div className="group relative mx-auto my-6 h-52 w-52 rounded-full bg-gradient-to-tr from-rose-500 via-amber-300 to-purple-600 p-3 shadow-2xl sm:h-64 sm:w-64">
          <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white">
            {gatePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gatePhoto}
                alt={gatePhoto ? "Foto pasangan" : ""}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-purple-100">
                <Heart className="h-16 w-16 fill-current text-rose-400" />
              </div>
            )}
          </div>
          {/* Ring bunga berputar di luar foto */}
          <div className="fgr-spin-slow pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-orange-400" />
        </div>

        <h1
          className="fgr-text-gradient my-2 text-6xl font-bold leading-tight tracking-wide sm:text-7xl"
          style={{ fontFamily: "var(--font-script)" }}
        >
          {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
        </h1>

        <p className="mt-2 font-[family-name:var(--font-serif-elegant)] text-lg font-semibold tracking-wide text-[#3c096c] sm:text-2xl">
          {formatDate(eventDate)}
        </p>

        {/* Indikator gulir */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <span className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-700">
            Gulir Ke Bawah
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-rose-500 shadow-md animate-bounce">
            <ChevronDown className="h-6 w-6" />
          </span>
        </div>
      </div>
    </header>
  );

  // Saat gerbang tertutup: FlowerGate fullscreen dengan pintu bunga
  if (locked) {
    return (
      <FlowerGate
        eventName={eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        eventDate={eventDate}
        guestName={guestName}
        onOpen={onOpen}
      />
    );
  }

  return cover;
}

/* ------------------------------------------------------------------ */
/* 2. COUNTDOWN                                                        */
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
    { label: "Hari", value: days, color: "text-rose-500" },
    { label: "Jam", value: hours, color: "text-purple-600" },
    { label: "Menit", value: minutes, color: "text-orange-500" },
    { label: "Detik", value: seconds, color: "text-pink-600" },
  ];
  const calUrl = googleCalendarUrl({
    title: eventName ?? "Pernikahan",
    date: eventDate,
  });
  return (
    <section className="relative z-10 px-4 py-20 text-center">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-200/30 px-4 py-1.5">
          <Clock className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Menghitung Hari Bahagia
          </span>
        </div>

        <h2 className="mb-4 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#3c096c] md:text-5xl">
          Menuju Hari Akad &amp; Resepsi
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-sm text-gray-600">
          Momen yang dinantikan untuk menyatukan dua cinta dalam ikatan suci di
          taman bunga abadi.
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="fgr-glass-accent rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2"
            >
              <span
                className={`block font-[family-name:var(--font-serif-elegant)] text-4xl font-extrabold tabular-nums md:text-6xl ${item.color}`}
              >
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-xs font-bold uppercase tracking-widest text-gray-600">
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
              className="inline-flex items-center gap-2 rounded-full border border-purple-300/60 bg-white px-6 py-3 font-bold text-[#3c096c] shadow-lg transition-all duration-300 hover:bg-rose-500 hover:text-white"
            >
              <CalendarPlus className="h-5 w-5" />
              <span>Simpan Tanggal ke Google Calendar</span>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. MEMPELAI                                                         */
/* ------------------------------------------------------------------ */
function Couple({
  groom,
  bride,
  eventName,
  quoteTitle,
  quoteText,
  quoteSource,
  quoteHidden,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
  eventName: string;
  // Kutipan (judul/isi/sumber) — bisa diganti user/admin sesuai kepercayaan.
  // Prioritas: user → admin → bawaan (Ar-Rum 21).
  quoteTitle?: string;
  quoteText?: string;
  quoteSource?: string;
  // Set true untuk menyembunyikan seluruh bagian kutipan.
  quoteHidden?: boolean;
}) {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading script="Pasangan Mempelai" title="Mempelai Pria & Wanita" />

        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <PersonCard person={groom} role="Mempelai Pria" roleColor="text-purple-700" ringColor="from-sky-400 via-emerald-300 to-purple-500" badge="text-purple-600" borderColor="border-sky-300/50" />
          <PersonCard person={bride} role="Mempelai Wanita" roleColor="text-rose-600" ringColor="from-rose-500 via-orange-300 to-amber-300" badge="text-rose-500" borderColor="border-orange-300/50" flower />
        </div>          {/* Kutipan — bisa diganti user/admin sesuai kepercayaan,
              atau disembunyikan sepenuhnya */}
          {!quoteHidden && (
          <div className="fgr-glass mx-auto mt-14 max-w-xl rounded-3xl p-6 text-center">
            <Heart className="mx-auto mb-3 h-5 w-5 fill-current text-rose-500" />
            {quoteTitle?.trim() ? (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-purple-700">
                {quoteTitle}
              </p>
            ) : null}
          <p className="text-sm italic leading-relaxed text-gray-700">
            &ldquo;{
              quoteText?.trim() ||
              "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya..."
            }&rdquo;
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.25em] text-purple-700">
            {quoteSource?.trim() || "(QS Ar-Rum: 21)"}
          </p>
          </div>
          )}
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  roleColor,
  ringColor,
  badge,
  borderColor,
  flower = false,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  roleColor: string;
  ringColor: string;
  badge: string;
  borderColor: string;
  flower?: boolean;
}) {
  return (
    <div
      className={`fgr-glass group relative rounded-3xl border-2 p-8 text-center shadow-xl transition-all duration-500 hover:border-rose-400 ${borderColor}`}
    >
      <div
        className={`relative mx-auto mb-6 h-48 w-48 rounded-full bg-gradient-to-tr p-2 ${ringColor}`}
      >
        {person?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt={person.name ?? role}
            className="h-full w-full rounded-full border-4 border-white object-cover shadow-md"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-white/80">
            <Heart className="h-12 w-12 fill-current text-rose-400" />
          </div>
        )}
        {/* Badge sudut: hati (pria) / bunga (wanita) */}
        <div className={`absolute -bottom-2 bg-white p-3 shadow-lg ${flower ? "-left-2 rounded-full text-rose-500" : "-right-2 rounded-full text-purple-600"}`}>
          {flower ? (
            <Flower2 className="h-6 w-6 fill-current" />
          ) : (
            <Heart className="h-6 w-6 fill-current" />
          )}
        </div>
      </div>

      <h3 className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#3c096c]">
        {person?.name ?? "-"}
      </h3>
      <p className={`mt-1 text-sm font-semibold ${roleColor}`}>{role}</p>

      {person?.parentName && (
        <p className="mt-4 text-xs leading-relaxed text-gray-600">
          Putra/Putri dari <br />
          <span className="font-bold text-gray-800">{person.parentName}</span>
        </p>
      )}
      {person?.bio && (
        <p className="mt-3 text-xs italic leading-relaxed text-gray-500">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}

      {person?.instagram && (
        <div className="mt-6">
          <a
            href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-rose-100/60 px-4 py-2 text-xs font-bold text-[#3c096c] transition-all hover:bg-rose-500 hover:text-white"
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
/* 4. KISAH CINTA (timeline vertikal ala referensi)                    */
/* ------------------------------------------------------------------ */
function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  const DOTS = ["bg-rose-500", "bg-purple-600", "bg-orange-500"];
  const BARS = ["border-rose-500", "border-purple-600", "border-orange-500"];
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          script="Kisah Perjalanan"
          title="Cerita Cinta Kami"
          desc="Bagaimana benih cinta tumbuh di taman kenangan kami"
        />

        <div className="relative ml-4 space-y-12 border-l-4 border-orange-300/60 md:ml-24">
          {story.map((item, index) => (
            <div key={item.id} className="relative pl-8">
              <div
                className={`absolute -left-[13px] top-0 h-6 w-6 rounded-full border-4 border-white shadow-md ${DOTS[index % DOTS.length]}`}
              />
              <div
                className={`fgr-glass rounded-2xl border-l-4 p-6 shadow-lg ${BARS[index % BARS.length]}`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${index % 3 === 0 ? "text-rose-500" : index % 3 === 1 ? "text-purple-600" : "text-orange-500"}`}
                >
                  {item.date ? formatDate(item.date) : "Momen"}
                </span>
                <h4 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-[#3c096c]">
                  {item.title ?? ""}
                </h4>
                {item.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
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
/* 5. ACARA: kartu Akad + Resepsi (ala referensi) + acara tambahan     */
/* ------------------------------------------------------------------ */
function EventsSection({
  main,
  events,
}: {
  main: { date?: string; time?: string; venue?: string; mapUrl?: string };
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading script="Rangkaian Acara" title="Waktu & Tempat Pelaksanaan" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Kartu Akad */}
          <EventCard
            icon={<HeartHandshake className="h-8 w-8" />}
            iconClass="bg-rose-500/20 text-rose-500"
            title="Akad Nikah"
            tag="Sakral & Khidmat"
            tagClass="text-rose-500"
            iconColor="text-rose-400"
            date={main.date}
            time={main.time}
            venue={main.venue}
            mapUrl={main.mapUrl}
            dressNote={null}
            borderColor="border-rose-400/40"
          />

          {/* Kartu Resepsi: ambil entri "Resepsi" dari Rangkaian Acara bila ada */}
          {events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? (
            <EventCard
              icon={<Sparkles className="h-8 w-8" />}
              iconClass="bg-purple-500/20 text-purple-600"
              title={events[0].title ?? "Resepsi"}
              tag="Pesta Taman Bunga"
              tagClass="text-purple-600"
              iconColor="text-purple-400"
              date={events[0].date}
              time={events[0].time}
              venue={events[0].location}
              mapUrl={events[0].locationMap}
              dressNote={null}
              borderColor="border-purple-400/40"
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
                  className="fgr-glass rounded-3xl p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-purple-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {formatDate(e.date)}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-[#3c096c]">
                    {e.title ?? "Acara"}
                  </h3>
                  {e.time && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-orange-400" /> {formatTime(e.time)}
                    </p>
                  )}
                  {e.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-orange-400" /> {e.location}
                    </p>
                  )}
                  {e.locationMap && (
                    <a
                      href={e.locationMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-rose-500 hover:underline"
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
  tag,
  tagClass,
  iconColor,
  date,
  time,
  venue,
  mapUrl,
  borderColor,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  tag: string;
  tagClass: string;
  iconColor: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
  dressNote?: string | null;
  borderColor: string;
}) {
  return (
    <div
      className={`fgr-glass relative overflow-hidden rounded-3xl border-2 p-8 text-center shadow-xl ${borderColor}`}
    >
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#3c096c]">
        {title}
      </h3>
      <p className={`mt-1 text-xs font-bold uppercase tracking-widest ${tagClass}`}>
        {tag}
      </p>

      <div className="my-6 space-y-3 text-sm text-gray-700">
        {date && (
          <div className="flex items-center justify-center gap-2">
            <CalendarDays className={`h-4 w-4 ${iconColor}`} />
            <span>{formatDate(date)}</span>
          </div>
        )}
        {time && (
          <div className="flex items-center justify-center gap-2">
            <Clock className={`h-4 w-4 ${iconColor}`} />
            <span>{formatTime(time)}</span>
          </div>
        )}
        {venue && (
          <div className="flex items-center justify-center gap-2">
            <MapPin className={`h-4 w-4 ${iconColor}`} />
            <span>{venue}</span>
          </div>
        )}
      </div>

      {mapUrl ? (
        <div className="border-t border-gray-200/60 pt-4">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
          >
            <MapPin className="h-4 w-4" />
            Lihat Lokasi
          </a>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. GALERI                                                           */
/* ------------------------------------------------------------------ */
function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          script="Galeri Momen"
          title="Potret Kebahagiaan"
          desc="Kenangan indah di antara mekarnya bunga-bunga"
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="group fgr-glass relative overflow-hidden rounded-3xl p-2 shadow-lg transition-all hover:shadow-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
                className="h-56 w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105 md:h-72"
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left text-xs font-medium italic text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.caption}
                </figcaption>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. KADO DIGITAL                                                     */
/* ------------------------------------------------------------------ */
function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="relative z-10 px-4 py-20 text-center">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          script="Tanda Kasih"
          title="Hadiah Digital"
          desc="Doa restu Anda merupakan hadiah terindah. Namun jika Anda ingin memberikan tanda kasih, dapat melalui rekening berikut:"
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {gifts.map((g, i) => (
            <div
              key={g.id}
              className={`fgr-glass relative overflow-hidden rounded-3xl border-2 p-8 text-left shadow-xl ${
                i % 2 === 0 ? "border-rose-400/40" : "border-purple-400/40"
              }`}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xl font-bold tracking-wider text-[#3c096c]">
                  {g.provider}
                </span>
                <Landmark className={`h-8 w-8 ${i % 2 === 0 ? "text-rose-500" : "text-purple-600"}`} />
              </div>
              <p className="mb-1 text-xs text-gray-500">Nomor Rekening:</p>
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-orange-200/60 bg-white/80 p-4">
                <span className="font-mono text-lg font-bold text-[#3c096c]">
                  {g.accountNumber}
                </span>
                <CopyButton text={g.accountNumber} />
              </div>
              {g.holderName && (
                <p className="text-xs font-semibold text-gray-700">
                  a.n. {g.holderName}
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
/* 9. RSVP                                                             */
/* ------------------------------------------------------------------ */
function RsvpSection({
  invitationId,
  guestName,
}: {
  invitationId: string;
  guestName?: string;
}) {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="fgr-glass mx-auto max-w-2xl rounded-3xl border-2 border-white p-8 shadow-2xl md:p-12">
        <div className="mb-8 text-center">
          <span
            className="text-4xl text-rose-500"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Konfirmasi Kehadiran
          </span>
          <h2 className="font-[family-name:var(--font-serif-elegant)] text-3xl font-bold text-[#3c096c]">
            RSVP Online
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Mohon konfirmasi kehadiran Anda demi kelancaran acara kami
          </p>
        </div>
        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="bg-gradient-to-r from-rose-500 via-orange-500 to-purple-600 shadow-lg shadow-rose-500/30 hover:shadow-xl"
          borderClass="border-orange-200 bg-white/80 focus:border-rose-500 focus:ring-rose-100"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. WISHES                                                          */
/* ------------------------------------------------------------------ */
function Wishes({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <span
            className="text-4xl text-purple-600"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Doa &amp; Restu
          </span>
          <h2 className="font-[family-name:var(--font-serif-elegant)] text-4xl font-bold text-[#3c096c]">
            Buku Tamu Digital
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Tuliskan pesan ucapan dan doa terbaik untuk kedua mempelai
          </p>
        </div>

        {/* Feed ucapan (tersimpan DB, ala wishes feed referensi) */}
        <div className="mb-12 max-h-[500px] space-y-4 overflow-y-auto pr-2">
          <WishList
            wishes={wishes ?? []}
            cardClass="fgr-glass rounded-2xl shadow-md"
            nameClass="text-[#3c096c]"
            avatarClass="bg-gradient-to-br from-rose-500 to-purple-600 text-white"
            emptyClass="text-gray-400"
          />
        </div>

        <div className="fgr-glass rounded-3xl border-2 border-white p-6 shadow-xl md:p-8">
          <WishForm
            invitationId={invitationId}
            accentClass="bg-gradient-to-r from-rose-500 via-orange-500 to-purple-600 shadow-lg shadow-rose-500/30 hover:shadow-xl"
            borderClass="border-orange-200 bg-white/90 focus:border-purple-500 focus:ring-purple-100"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. PESAN PENUTUP                                                   */
/* ------------------------------------------------------------------ */
function MessageSection({ text }: { text: string }) {
  return (
    <section className="relative z-10 px-4 py-20 text-center">
      <div className="fgr-glass mx-auto max-w-lg rounded-3xl p-8">
        <Sparkles className="mx-auto mb-4 h-6 w-6 text-orange-400" />
        <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-[#3c096c]">
          {text}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 12. FOOTER                                                          */
/* ------------------------------------------------------------------ */
function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="relative z-10 border-t border-orange-300/30 px-4 py-20 text-center">
      <div className="mx-auto max-w-2xl space-y-6">
        <Flower2 className="fgr-spin-slow mx-auto h-12 w-12 text-rose-500" />

        <h2
          className="fgr-text-gradient text-5xl font-bold"
          style={{ fontFamily: "var(--font-script)" }}
        >
          Terima Kasih
        </h2>

        <p className="text-sm italic leading-relaxed text-gray-600">
          &ldquo;Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
          Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada
          kami.&rdquo;
        </p>

        <div className="pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#3c096c]">
            Kami Yang Berbahagia
          </p>
          <h3
            className="mt-2 text-4xl font-bold text-purple-700"
            style={{ fontFamily: "var(--font-script)" }}
          >
            {groomName ?? "Pria"} &amp; {brideName ?? "Wanita"}
          </h3>
          <p className="mt-1 text-xs text-gray-500">Beserta Keluarga Besar</p>
        </div>

        <p className="pt-6 text-xs tracking-[0.3em] text-purple-400/60">
          © {new Date().getFullYear()} MEDUTA
        </p>
      </div>
    </footer>
  );
}
