"use client";

import { useEffect, useRef, useState } from "react";
import {
  Moon,
  Sparkles,
  Star,
  CalendarDays,
  Clock,
  MapPin,
  Navigation,
  X,
  Maximize2,
  Heart,
  Landmark,
  ArrowDown,
} from "lucide-react";
import CelestialGate from "./CelestialGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { Countdown, SaveToCalendarButton } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Celestial Night — "Two Stars, One Constellation"
 * Adopsi dari desain referensi celestial (navy #050814, teks emas berkilau,
 * aksen ungu, canvas bintang berkelap-kelip + meteor, glass card), diubah
 * total menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic) — bukan MP3 hardcoded referensi
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan di DB
 * - Background berlapis: pilihan user > admin (template) > bawaan
 * - Tanpa Gemini AI & embed map iframe referensi (risiko keamanan/kompatibilitas)
 * Khas template ini: langit canvas bintang + meteor, teks gradasi emas,
 * glass card bercahaya, timeline konstelasi, galeri lightbox.
 */

/* Palet celestial (konsisten dengan desain referensi) */
const CEL = {
  bg: "#050814",
  gold: "#E6C875",
  goldSoft: "#F3E5AB",
  purple: "#C084FC",
  ink: "#0B1120",
  line: "rgba(230, 200, 117, 0.25)",
} as const;

/* Kelas CSS khusus template (prefix cel- agar tidak bentrok global) */
const CEL_STYLES = `
  .cel-gold-text {
    background: linear-gradient(135deg, #FFF6D6 0%, #E6C875 50%, #B8860B 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
  .cel-silver-text {
    background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 50%, #94A3B8 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
  .cel-glass {
    /* Solid gradient — TANPA backdrop-blur agar teks selalu tajam */
    background: linear-gradient(165deg, rgba(13, 19, 36, 0.99) 0%, rgba(9, 13, 25, 0.99) 55%, rgba(16, 10, 32, 0.99) 100%);
  }
  .cel-border-glow {
    border: 1px solid ${CEL.line};
    box-shadow: 0 0 20px rgba(192, 132, 252, 0.08), inset 0 0 15px rgba(243, 229, 171, 0.05);
  }
  @keyframes celFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes celGlow {
    0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 15px rgba(230, 200, 117, 0.3)); }
    50% { opacity: 0.8; filter: drop-shadow(0 0 25px rgba(192, 132, 252, 0.6)); }
  }
  .cel-float { animation: celFloat 6s ease-in-out infinite; }
  .cel-glow { animation: celGlow 4s ease-in-out infinite; }
`;

/* ------------------------------------------------------------------ */
/* Canvas langit: bintang berkelap-kelip + meteor (khas template ini)  */
/* ------------------------------------------------------------------ */

function CelestialCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let frame = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const starCount = Math.min(320, Math.floor((width * height) / 4200));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.015 + 0.005,
      color:
        Math.random() > 0.8
          ? CEL.purple
          : Math.random() > 0.6
            ? CEL.goldSoft
            : "#FFFFFF",
    }));

    type Meteor = { x: number; y: number; length: number; speed: number; alpha: number };
    const meteors: Meteor[] = [];
    const ANGLE = Math.PI / 4;
    let timer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) star.speed = -star.speed;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.fill();
      }

      timer++;
      if (timer % 180 === 0 && Math.random() > 0.4) {
        meteors.push({
          x: Math.random() * width * 1.2,
          y: Math.random() * height * 0.4,
          length: Math.random() * 80 + 40,
          speed: Math.random() * 4 + 3,
          alpha: 1,
        });
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x -= Math.cos(ANGLE) * m.speed;
        m.y += Math.sin(ANGLE) * m.speed;
        m.alpha -= 0.012;
        if (m.alpha <= 0) {
          meteors.splice(i, 1);
          continue;
        }
        const gradient = ctx.createLinearGradient(
          m.x,
          m.y,
          m.x + Math.cos(ANGLE) * m.length,
          m.y - Math.sin(ANGLE) * m.length,
        );
        gradient.addColorStop(0, `rgba(243, 229, 171, ${m.alpha})`);
        gradient.addColorStop(1, "rgba(243, 229, 171, 0)");
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x + Math.cos(ANGLE) * m.length, m.y - Math.sin(ANGLE) * m.length);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function CelestialTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <CelestialShell
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

function CelestialShell({
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
  // Kartu "Akad Nikah" dirender dari Acara Utama — entri "Akad" pada
  // Rangkaian Acara digabung ke sana agar tidak dobel (detail akad menang).
  const agenda = splitAgenda(
    data.events,
    {
      date: data.eventDate,
      time: data.eventTime,
      venue: [data.venueName, data.location].filter(Boolean).join(", ") || undefined,
      mapUrl: data.locationMap,
    },
    { akadWins: true },
  );
  const events = agenda.additional;
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  // Prioritas background: pilihan user > admin (template) > bawaan
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  // Prioritas foto gerbang: user > admin (dekorasi) > mempelai > galeri[0]
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: groom?.photoUrl,
    bridePhotoUrl: bride?.photoUrl,
    firstGalleryUrl: gallery[0]?.url,
  });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-[family-name:var(--font-sans)] text-slate-100"
      style={{ backgroundColor: CEL.bg }}
    >
      <style>{CEL_STYLES}</style>

      {/* Langit bintang di seluruh halaman */}
      <CelestialCanvas />

      {gateOpen && (
        <main className="relative z-10 space-y-24 pb-20 md:space-y-36">
          <HeroSection
            groomNick={groom?.nickname ?? groom?.name}
            brideNick={bride?.nickname ?? bride?.name}
            eventDate={data.eventDate}
            eventName={data.eventName}
            photo={gatePhoto}
          />

          {data.eventDate ? (
            <CountdownSection
              eventDate={data.eventDate}
              groomNick={groom?.nickname ?? groom?.name}
              brideNick={bride?.nickname ?? bride?.name}
            />
          ) : null}

          {groom?.name || bride?.name ? <CoupleSection groom={groom} bride={bride} /> : null}

          {story.length > 0 ? <LoveStorySection story={story} /> : null}

          <EventsSection
            eventDate={agenda.main.date}
            eventTime={agenda.main.time}
            venueName={data.venueName}
            location={data.location}
            locationMap={agenda.main.mapUrl}
            customMessage={data.customMessage}
            events={events}
          />

          {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

          <RsvpSection invitationId={invitationId} guestName={guestName} />

          {gifts.length > 0 ? <GiftSection gifts={gifts} /> : null}

          <WishesSection invitationId={invitationId} wishes={wishes} />

          <ClosingSection
            groomName={groom?.name}
            brideName={bride?.name}
            groomNick={groom?.nickname ?? groom?.name}
            brideNick={bride?.nickname ?? bride?.name}
          />
        </main>
      )}

      {/* Gerbang undangan khusus celestial (di atas canvas & konten) */}
      {!gateOpen && (
        <CelestialGate
          eventName={data.eventName ?? "The Celestial Wedding Of"}
          groomNick={groom?.nickname ?? groom?.name}
          brideNick={bride?.nickname ?? bride?.name}
          guestName={guestName}
          tagline={data.customMessage}
          onOpen={onGateOpen}
          backgroundUrl={bgUrl}
          photoUrl={gatePhoto}
        />
      )}

      {/* FAB musik latar user */}
      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="cel-glass border border-amber-300/30 text-amber-200 shadow-lg shadow-purple-950/40 hover:scale-110"
          playingIconClassName="h-5 w-5 animate-pulse text-amber-300"
          pausedIconClassName="h-5 w-5 opacity-60"
        />
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: CEL.bg, color: "#E2E8F0" }}
    >
      <Moon className="cel-glow h-12 w-12 text-amber-300" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm opacity-60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — badge konstelasi, nama emas, foto arch bercahaya             */
/* ------------------------------------------------------------------ */

function HeroSection({
  groomNick,
  brideNick,
  eventDate,
  eventName,
  photo,
}: {
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  eventName?: string;
  photo?: string;
}) {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        {/* Badge konstelasi */}
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1.5 text-xs uppercase tracking-widest text-purple-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>{eventName ?? "Save The Cosmic Date"}</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
        </div>

        {/* Nama pasangan */}
        <div className="space-y-4">
          <h1 className="cel-gold-text font-[family-name:var(--font-display)] text-5xl font-extrabold leading-tight tracking-wide md:text-7xl">
            {groomNick ?? "Pria"}
            <span className="cel-silver-text my-1 block font-[family-name:var(--font-serif-elegant)] text-3xl font-normal italic md:text-5xl">
              &amp;
            </span>
            {brideNick ?? "Wanita"}
          </h1>
          <div className="mx-auto h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
          {eventDate && (
            <p className="font-[family-name:var(--font-serif-elegant)] text-xl uppercase tracking-widest text-slate-300 md:text-2xl">
              {formatDate(eventDate)}
            </p>
          )}
        </div>

        {/* Foto arch bercahaya */}
        <div className="relative mx-auto mt-8 h-80 w-64 md:h-96 md:w-72">
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr from-amber-400/20 via-purple-600/30 to-slate-900 blur-xl" />
          <div className="cel-glass relative h-full w-full overflow-hidden rounded-t-full border-2 border-amber-300/40 p-2 shadow-2xl">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt="Mempelai"
                className="h-full w-full rounded-t-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-t-full bg-purple-950/40">
                <Heart className="h-12 w-12 text-amber-300" />
              </div>
            )}
          </div>
        </div>

        {/* Simpan ke Google Calendar */}
        {eventDate && (
          <div className="pt-4">
            <SaveToCalendarButton
              title={`Pernikahan ${groomNick ?? ""} & ${brideNick ?? ""}`.trim()}
              date={eventDate}
              location={eventName}
              className="cel-glass inline-flex items-center gap-2 rounded-full border border-amber-300/40 px-6 py-3 font-[family-name:var(--font-display)] text-xs uppercase tracking-widest text-amber-200 transition-colors duration-300 hover:bg-amber-300/10"
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
          <span>Scroll</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Countdown — celestial clock dengan dial berputar                    */
/* ------------------------------------------------------------------ */

function CountdownSection({
  eventDate,
  groomNick,
  brideNick,
}: {
  eventDate: string;
  groomNick?: string;
  brideNick?: string;
}) {
  return (
    <section className="relative mx-auto max-w-5xl px-4 text-center">
      <div className="cel-glass cel-border-glow relative overflow-hidden rounded-3xl p-8 md:p-14">
        {/* Dial celestial berputar */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 animate-[spin_60s_linear_infinite] rounded-full border border-amber-300/10">
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-300/40" />
          <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-purple-400/40" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-amber-300">
              Celestial Clock
            </h2>
            <h3 className="cel-silver-text font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Hitung Mundur Acara
            </h3>
            <p className="font-[family-name:var(--font-serif-elegant)] text-lg text-slate-400">
              Menghitung waktu menuju penyatuan takdir {groomNick ?? ""} &amp;{" "}
              {brideNick ?? ""}
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Countdown
              target={eventDate}
              valueClass="cel-gold-text font-[family-name:var(--font-display)] text-3xl md:text-4xl"
              labelClass="text-[10px] uppercase tracking-widest text-slate-400"
              boxClass="rounded-2xl border border-amber-300/20 bg-[#0d1324]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai — kartu glass dengan foto arch                             */
/* ------------------------------------------------------------------ */

function CoupleSection({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section className="relative mx-auto max-w-5xl px-4">
      <SectionHeading
        eyebrow="The Two Stars"
        title="Mempelai Pengantin"
        titleGold
        desc="Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Dengan memohon rahmat dan ridho-Nya, kami bermaksud melangsungkan pernikahan."
      />

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <PersonCard
          person={groom}
          role="The Groom"
          starColor={CEL.gold}
        />
        <PersonCard
          person={bride}
          role="The Bride"
          starColor={CEL.purple}
        />
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  starColor,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  starColor: string;
}) {
  const handle = person?.instagram?.replace(/^@/, "").trim();
  return (
    <div className="cel-glass cel-border-glow group relative space-y-6 overflow-hidden rounded-3xl p-8 text-center transition-all duration-500 hover:border-amber-300/60">
      <div className="relative mx-auto h-56 w-44 overflow-hidden rounded-t-full border border-amber-300/30 p-1.5">
        {person?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt={person?.name ?? "Mempelai"}
            className="h-full w-full rounded-t-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-t-full bg-purple-950/40">
            <Heart className="h-10 w-10 text-amber-300" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-amber-300/80">
          <Star className="h-3 w-3" style={{ color: starColor }} />
          {role}
          <Star className="h-3 w-3" style={{ color: starColor }} />
        </p>
        <h4 className="cel-gold-text font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
          {person?.name ?? "-"}
        </h4>
        {person?.parentName && (
          <p className="font-[family-name:var(--font-serif-elegant)] text-base italic text-slate-300">
            Putra/Putri dari {person.parentName}
          </p>
        )}
        {person?.bio && (
          <p className="font-[family-name:var(--font-serif-elegant)] text-sm leading-relaxed text-slate-400">
            {person.bio}
          </p>
        )}
      </div>
      {handle && (
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-xs uppercase tracking-widest text-amber-300 transition-colors hover:text-amber-200"
        >
          <span>{person?.instagram}</span>
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kisah cinta — timeline konstelasi                                   */
/* ------------------------------------------------------------------ */

function LoveStorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section className="relative mx-auto max-w-4xl px-4">
      <SectionHeading
        eyebrow="Constellation Journey"
        title="Kisah Cinta Kami"
        desc="Setiap langkah yang kami tempuh telah terukir di antara garis konstelasi malam"
      />

      <div className="relative ml-4 space-y-12 border-l-2 border-amber-300/20 md:ml-32">
        {story.map((item, index) => {
          const year = item.date && !Number.isNaN(new Date(item.date).getTime())
            ? String(new Date(item.date).getFullYear())
            : null;
          return (
            <div key={item.id} className="group relative pl-8 md:pl-12">
              {/* Node bintang bercahaya */}
              <div className="absolute -left-[11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-300 bg-slate-900 transition-transform duration-300 group-hover:scale-125">
                <div
                  className={`h-2 w-2 rounded-full bg-amber-300 ${index === 0 ? "animate-ping" : ""}`}
                />
              </div>

              <div className="cel-glass space-y-2 rounded-2xl border border-amber-300/20 p-6 transition-colors hover:border-amber-300/40">
                {year && (
                  <span className="inline-block rounded-full border border-purple-400/30 bg-purple-950/50 px-3 py-1 font-[family-name:var(--font-display)] text-xs font-bold text-amber-300">
                    {year}
                  </span>
                )}
                <h4 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  <span className="cel-gold-text">{item.title ?? "Momen"}</span>
                </h4>
                {item.date && (
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {formatDate(item.date)}
                  </p>
                )}
                {item.description && (
                  <p className="whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-base leading-relaxed text-slate-300">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Rangkaian acara — kartu glass + countdown + gcal + maps             */
/* ------------------------------------------------------------------ */

function EventsSection({
  eventDate,
  eventTime,
  venueName,
  location,
  locationMap,
  customMessage,
  events,
}: {
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  locationMap?: string;
  customMessage?: string;
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  return (
    <section id="acara" className="relative mx-auto max-w-5xl px-4">
      <SectionHeading
        eyebrow="Wedding Events"
        title="Rangkaian Acara"
        desc={
          customMessage ??
          "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir"
        }
      />

      <div className="grid gap-8 md:grid-cols-2">
        <EventCard
          icon={<Sparkles className="h-4 w-4" />}
          title="Akad Nikah"
          date={eventDate}
          time={eventTime}
          venue={[venueName, location].filter(Boolean).join(", ") || undefined}
          mapUrl={locationMap}
        />
        {events.map((e, i) => (
          <EventCard
            key={e.id}
            icon={i % 2 === 0 ? <Moon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            title={e.title ?? "Acara"}
            date={e.date}
            time={e.time}
            venue={e.location}
            mapUrl={e.locationMap}
          />
        ))}
      </div>

      {/* Lokasi utama */}
      {(venueName || location) && (
        <div className="cel-glass cel-border-glow mt-12 space-y-6 rounded-3xl p-8 md:p-12">
          <div className="space-y-3 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-amber-300">
              Celestial Location
            </h3>
            <p className="cel-silver-text font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
              {venueName ?? "Lokasi Acara"}
            </p>
            {location && (
              <p className="mx-auto max-w-xl text-sm text-slate-300">{location}</p>
            )}
          </div>
          {locationMap && (
            <div className="flex justify-center">
              <a
                href={locationMap}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Navigation className="h-4 w-4" />
                Buka Google Maps
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EventCard({
  icon,
  title,
  date,
  time,
  venue,
  mapUrl,
}: {
  icon: React.ReactNode;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
}) {
  return (
    <div className="cel-glass cel-border-glow group relative flex flex-col justify-between space-y-6 overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:border-amber-300/60">
      {/* Watermark bintang */}
      <Star className="absolute right-4 top-4 h-8 w-8 text-amber-300/10" />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 font-[family-name:var(--font-display)] text-xs uppercase text-amber-200">
          {icon}
          <span>{title}</span>
        </div>

        {date && (
          <h4 className="cel-gold-text font-[family-name:var(--font-display)] text-2xl font-bold">
            {formatDate(date)}
          </h4>
        )}

        <div className="space-y-3 pt-2 text-sm text-slate-300">
          {time && (
            <p className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-amber-300" />
              <span>{formatTime(time)}</span>
            </p>
          )}
          {venue && (
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <span>{venue}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
        {date && (
          <SaveToCalendarButton
            title={title}
            date={date}
            time={time}
            location={venue}
            className="cel-glass inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/40 px-4 py-2.5 text-[11px] uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-300/10"
          />
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <MapPin className="h-3.5 w-3.5" />
            Lihat Lokasi
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri — grid starlight + lightbox                                  */
/* ------------------------------------------------------------------ */

function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<{ url: string; caption?: string } | null>(null);

  return (
    <section className="relative mx-auto max-w-6xl px-4">
      <SectionHeading
        eyebrow="Starlight Gallery"
        title="Galeri Foto"
        titleGold
        desc="Momen-momen indah yang terabadikan dalam kehangatan malam"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {gallery.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelected({ url: img.url, caption: img.caption })}
            className="cel-glass group relative h-64 cursor-pointer overflow-hidden rounded-2xl border border-amber-300/20 md:h-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption ?? "Foto galeri"}
              className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950/90 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex w-full items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-xs tracking-wider text-amber-200">
                  {img.caption ?? ""}
                </span>
                <Maximize2 className="h-4 w-4 text-amber-300" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="cel-glass relative max-h-[90vh] max-w-4xl rounded-2xl border border-amber-300/30 p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute -right-2 -top-2 rounded-full border border-amber-300/40 bg-slate-900 p-2 text-amber-200 transition-colors hover:bg-slate-800"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption ?? "Foto diperbesar"}
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
            {selected.caption && (
              <p className="mt-3 text-center font-[family-name:var(--font-display)] text-sm tracking-widest text-amber-200">
                {selected.caption}
              </p>
            )}
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
    <section className="relative mx-auto max-w-3xl px-4">
      <div className="cel-glass cel-border-glow space-y-8 rounded-3xl p-8 md:p-12">
        <div className="space-y-3 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-amber-300">
            Celestial Confirmation
          </h2>
          <h3 className="cel-silver-text font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Konfirmasi Kehadiran
          </h3>
          <p className="font-[family-name:var(--font-serif-elegant)] text-lg text-slate-300">
            Mohon isi konfirmasi kehadiran Anda di bawah ini
          </p>
        </div>

        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400"
          borderClass="border-slate-700/60 focus:border-amber-300 focus:ring-amber-300/20"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado digital                                                        */
/* ------------------------------------------------------------------ */

function GiftSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="relative mx-auto max-w-4xl px-4">
      <div className="cel-glass cel-border-glow space-y-8 rounded-3xl p-8 md:p-12">
        <div className="space-y-3 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-amber-300">
            Celestial Blessing
          </h2>
          <h3 className="cel-gold-text font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Tanda Kasih
          </h3>
          <p className="mx-auto max-w-lg font-[family-name:var(--font-serif-elegant)] text-lg text-slate-300">
            Doa restu Anda merupakan hadiah terindah bagi kami. Namun jika ingin
            memberi tanda kasih, dapat disalurkan melalui:
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="space-y-4 rounded-2xl border border-amber-300/20 bg-slate-900/80 p-6 text-center transition-colors hover:border-amber-300/50"
            >
              <Landmark className="mx-auto h-6 w-6 text-amber-300" />
              <div className="space-y-1">
                <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-wider text-slate-400">
                  {gift.provider}
                </p>
                <p className="font-mono text-xl font-bold tracking-wider text-amber-200">
                  {gift.accountNumber}
                </p>
                <p className="text-xs text-slate-300">a.n {gift.holderName}</p>
              </div>
              <CopyButton text={gift.accountNumber} />
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

function WishesSection({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section className="relative mx-auto max-w-4xl px-4">
      <div className="cel-glass cel-border-glow space-y-8 rounded-3xl p-8 md:p-12">
        <div className="space-y-3 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-amber-300">
            Celestial Guestbook
          </h2>
          <h3 className="cel-silver-text font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Doa &amp; Ucapan Tamu
          </h3>
          <p className="font-[family-name:var(--font-serif-elegant)] text-lg text-slate-300">
            Tinggalkan doa indah Anda untuk perjalanan cinta kami
          </p>
        </div>

        <WishList
          wishes={wishes ?? []}
          cardClass="border-slate-800 bg-slate-900/60"
          nameClass="text-amber-200"
          avatarClass="bg-purple-900/60 text-amber-200"
          emptyClass="text-slate-500"
        />

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300">
            <Sparkles className="h-4 w-4" />
            Kirim Ucapan
          </div>
          <WishForm
            invitationId={invitationId}
            accentClass="bg-gradient-to-r from-purple-600 via-amber-400 to-amber-500 text-slate-950 hover:opacity-90"
            borderClass="border-slate-700/60 focus:border-amber-300 focus:ring-amber-300/20"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Penutup                                                             */
/* ------------------------------------------------------------------ */

function ClosingSection({
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
    <section className="relative mx-auto max-w-3xl space-y-8 px-4 pt-8 text-center">
      <div className="cel-glass cel-border-glow mx-auto flex h-16 w-16 items-center justify-center rounded-full">
        <Moon className="cel-glow h-8 w-8 text-amber-300" />
      </div>

      <div className="space-y-4">
        <h3 className="cel-silver-text font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
          Terima Kasih
        </h3>
        <p className="mx-auto max-w-xl font-[family-name:var(--font-serif-elegant)] text-lg leading-relaxed text-slate-300 md:text-xl">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
          Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.
        </p>
      </div>

      <div className="space-y-2 pt-4">
        <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-widest text-amber-300">
          Kami yang berbahagia
        </p>
        <h4 className="cel-gold-text font-[family-name:var(--font-display)] text-3xl font-bold">
          {groomNick ?? ""} &amp; {brideNick ?? ""}
        </h4>
        {(groomName || brideName) && (
          <p className="text-xs text-slate-500">
            {groomName ?? ""} {brideName ? `& ${brideName}` : ""}
          </p>
        )}
        <p className="pt-6 font-mono text-[11px] text-slate-600">
          © {new Date().getFullYear()} Celestial Night — Dibuat dengan Meduta
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Heading bersama                                                     */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  desc,
  titleGold = false,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  titleGold?: boolean;
}) {
  return (
    <div className="mb-16 space-y-4 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-amber-300">
        {eyebrow}
      </h2>
      <h3
        className={`font-[family-name:var(--font-display)] text-3xl font-bold md:text-5xl ${
          titleGold ? "cel-gold-text" : "cel-silver-text"
        }`}
      >
        {title}
      </h3>
      {desc && (
        <p className="mx-auto max-w-xl font-[family-name:var(--font-serif-elegant)] text-lg text-slate-300">
          {desc}
        </p>
      )}
    </div>
  );
}
