"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  Landmark,
  ExternalLink,
  ChevronDown,
  AtSign,
} from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import {
  formatDate,
  formatTime,
  splitAgenda,
  type TemplateProps,
  type CouplePerson,
  type EventItem,
  type StoryItem,
  type GalleryItem,
  type GiftItem,
  type WishItem,
} from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

const ACCENT = "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-600/25";
const BORDER = "border-emerald-200 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-100";

/* Kicker kecil ber-tracking lebar — dipakai semua section biar konsisten */
const KICKER = "text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-700/90";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function ClassicTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl, props.data.musicStart, props.data.musicEnd);
  return (
    <ClassicShell
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

function ClassicShell({
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

  // Prioritas background: pilihan user > admin (template) > bawaan template
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  // Prioritas foto gerbang: user > admin (dekorasi) > mempelai > galeri[0]
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: data?.groom?.photoUrl,
    bridePhotoUrl: data?.bride?.photoUrl,
    firstGalleryUrl: data?.gallery?.[0]?.url,
  });

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

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#f7f4ea] font-[family-name:var(--font-serif-elegant)] text-zinc-900">
      {/* Nuansa emas & zamrud lembut di latar */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,63,0.14),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,61,46,0.08),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(176,141,63,0.07),transparent_45%)]" />

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

      <Reveal>
        <section className="mx-auto w-full max-w-3xl px-6 py-20">
          <MainEvent
            eventDate={agenda.main.date}
            eventTime={agenda.main.time}
            venueName={data.venueName}
            location={data.location}
            locationMap={agenda.main.mapUrl}
          />
        </section>
      </Reveal>

      {story.length > 0 ? (
        <Reveal>
          <StorySection story={story} />
        </Reveal>
      ) : null}

      {gallery.length > 0 ? (
        <Reveal>
          <GallerySection gallery={gallery} />
        </Reveal>
      ) : null}

      {events.length > 0 ? <AdditionalEvents events={events} /> : null}

      {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

      <RsvpSection
        invitationId={invitationId}
        guestName={guestName}
        accentClass={ACCENT}
        borderClass={BORDER}
      />

      {data.customMessage ? (
        <MessageSection text={data.customMessage} />
      ) : null}

      {data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="bg-emerald-900 text-amber-200 border border-amber-300/40"
          playingIconClassName="h-5 w-5 animate-pulse text-amber-300"
          pausedIconClassName="h-5 w-5 opacity-70"
        />
      ) : null}

      <Wishes
        invitationId={invitationId}
        accentClass={ACCENT}
        borderClass={BORDER}
        wishes={wishes ?? []}
      />

      <Footer
        groomName={groom?.name}
        brideName={bride?.name}
      />
    </div>
  );
}

function DraftNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
      <p className="text-lg font-medium text-zinc-800">Undangan belum dipublikasikan</p>
      <p className="text-sm text-zinc-500">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/**
 * Reveal: konten muncul halus saat pertama masuk viewport (scroll-driven).
 * prefers-reduced-motion ditangani via CSS (motion-reduce:…), bukan effect,
 * supaya effect body tidak memanggil setState sinkron (aturan react-hooks).
 */
function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Fallback browser lama tanpa IntersectionObserver: tampilkan langsung
    // (dijadwalkan agar effect body tidak memanggil setState sinkron).
    if (!el || typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      /* kelas meduta-reveal: penanda untuk mode ?shot=1 (thumbnail) agar
         konten dipaksa terlihat tanpa bergantung IntersectionObserver */
      className={`meduta-reveal w-full ${className ?? ""} transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none`}
    >
      {children}
    </div>
  );
}

function OrnamentDivider({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${light ? "text-amber-200/90" : "text-amber-500/80"}`}>
      <span className={`h-px w-16 ${light ? "bg-gradient-to-r from-transparent to-amber-200/70" : "bg-gradient-to-r from-transparent to-amber-500/60"}`} />
      <RingIcon className="h-4 w-4" />
      <span className={`h-px w-16 ${light ? "bg-gradient-to-l from-transparent to-amber-200/70" : "bg-gradient-to-l from-transparent to-amber-500/60"}`} />
    </div>
  );
}

/** Kop section seragam: kicker bergaris, judul display, ornamen emas */
function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <p className={`flex items-center justify-center gap-3 ${KICKER}`}>
        <span className="h-px w-9 bg-gradient-to-r from-transparent to-amber-400/70" aria-hidden />
        {kicker}
        <span className="h-px w-9 bg-gradient-to-l from-transparent to-amber-400/70" aria-hidden />
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-zinc-900 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>
    </div>
  );
}

/* Empat sudut emas untuk frame cover — gaya kartu undangan klasik */
function GoldCorners() {
  const base = "pointer-events-none absolute h-10 w-10 border-amber-300/80";
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <span className={`${base} left-5 top-5 rounded-tl-xl border-l-2 border-t-2`} aria-hidden />
      <span className={`${base} right-5 top-5 rounded-tr-xl border-r-2 border-t-2`} aria-hidden />
      <span className={`${base} bottom-5 left-5 rounded-bl-xl border-b-2 border-l-2`} aria-hidden />
      <span className={`${base} bottom-5 right-5 rounded-br-xl border-b-2 border-r-2`} aria-hidden />
    </div>
  );
}

/* Elemen bunga watercolor khusus template Classic (aset transparan).
   Crest peonies untuk hiasan tengah, spray palm emas untuk pojok,
   buket sage untuk backdrop lembut di belakang kop section. */
function FlowerCrest({
  className,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/design/classic/classic-peonies.webp"
      alt=""
      aria-hidden
      className={`pointer-events-none ${flipX ? "-scale-x-100 " : ""}${flipY ? "-scale-y-100 " : ""}${className ?? ""}`}
    />
  );
}

function FlowerBouquet({
  className,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/design/classic/classic-sage-bouquet.webp"
      alt=""
      aria-hidden
      className={`pointer-events-none ${flipX ? "-scale-x-100 " : ""}${flipY ? "-scale-y-100 " : ""}${className ?? ""}`}
    />
  );
}

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
    <header
      className="relative mx-auto flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center px-6 py-24 text-center text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(4,30,23,0.45), rgba(6,42,32,0.66) 55%, rgba(3,22,17,0.88)), url(${bgUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70"})`,
      }}
    >
      {/* Vignette emas lembut di tengah */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,214,150,0.08),transparent_65%)]" />

      {/* Bingkai ganda + sudut emas + bunga mengikuti kolom konten (max-w-3xl)
          agar tetap proporsional dan tidak melebar ke tepi layar saat
          pratinjau desktop. Di mobile kolom ini = lebar layar penuh. */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-3xl -translate-x-1/2">
        <div className="absolute inset-3 rounded-[2rem] border border-amber-200/40" aria-hidden />
        <div className="absolute inset-5 rounded-[1.7rem] border border-amber-100/20" aria-hidden />
        <GoldCorners />

        {/* Crest peonies di sudut kiri atas cover — ukuran mobile & desktop disetel terpisah */}
        <FlowerCrest className="absolute -left-25 -top-15 z-20 w-70 drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] sm:-left-14 sm:-top-8 sm:w-48" />
      </div>

      {/* Nama mempelai — vertikal, serif tegas, ampersand script di tengah */}
      <p className="animate-fade-up-delay-1 mb-8 text-[11px] uppercase tracking-[0.5em] text-amber-200/90">
        The Wedding Of
      </p>

      <h1 className="animate-fade-up-delay-2">
        <span className="block font-[family-name:var(--font-display)] text-4xl font-semibold uppercase tracking-[0.08em] leading-tight sm:text-5xl">
          {groomNick ?? "Pria"}
        </span>
        <span className="text-gold-shimmer mx-2 my-1 block font-[family-name:var(--font-script)] text-4xl leading-none font-normal sm:text-5xl">
          &amp;
        </span>
        <span className="block font-[family-name:var(--font-display)] text-4xl font-semibold uppercase tracking-[0.08em] leading-tight sm:text-5xl">
          {brideNick ?? "Wanita"}
        </span>
      </h1>

      {eventDate && (
        <>
          <div className="animate-fade-up-delay-3 mt-8">
            <OrnamentDivider light />
          </div>
          <p className="animate-fade-up-delay-3 mt-5 font-[family-name:var(--font-serif-elegant)] text-base leading-relaxed tracking-[0.25em] text-amber-50/90">
            {formatDate(eventDate)}
          </p>
        </>
      )}

      {guestName && (
        <div className="animate-fade-up-delay-4 mt-10 rounded-2xl border border-amber-200/35 bg-white/10 px-8 py-4 shadow-lg backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-100/85">
            Kepada Yth.
          </p>
          <p className="mt-1.5 font-[family-name:var(--font-script)] text-3xl leading-snug text-white">
            {guestName}
          </p>
        </div>
      )}

      <p className="animate-fade-up-delay-4 mt-6 font-[family-name:var(--font-serif-elegant)] text-sm italic tracking-widest text-emerald-50/75">
        {eventName}
      </p>

      {/* Penunjuk gulir */}
      <div className="animate-fade-up-delay-4 mt-12 flex flex-col items-center gap-1.5 text-amber-100/80">
        <ChevronDown className="h-5 w-5 animate-bounce" />
        <span className="text-[10px] uppercase tracking-[0.3em]">Gulir untuk mulai</span>
      </div>
    </header>
  );

  // Saat gerbang tertutup: konten dikunci + overlay "Buka Undangan" fullscreen
  if (locked) {
    return (
      <InvitationGate
        theme="classic"
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

  return cover;
}

/* Tanggal terurai jadi bagian (hari/tgl/bulan/tahun) untuk layout kartu acara */
function dateParts(date?: string) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  const acc: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(value)) {
    acc[part.type] = part.value;
  }
  return acc;
}

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
  const parts = dateParts(eventDate);
  const hasDate = !!eventDate;
  const hasTime = !!eventTime;
  const hasVenue = !!(venueName || location);
  const colCount = [hasDate, hasTime, hasVenue].filter(Boolean).length;

  return (
    <div className="text-center">
      <SectionHeader kicker="Akad & Resepsi" title="Merupakan Suatu Kehormatan" />
      <p className="mx-auto mt-5 max-w-md font-[family-name:var(--font-serif-elegant)] text-base leading-relaxed text-zinc-600 italic">
        Bagi kami, kehadiran dan doa restu Anda adalah kebahagiaan yang tak ternilai.
      </p>

      {(hasDate || hasTime || hasVenue) && (
        <div className="relative mx-auto mt-10 max-w-2xl rounded-[1.75rem] border border-amber-200/70 bg-white/80 shadow-xl shadow-emerald-900/5 backdrop-blur-sm sm:shadow-2xl sm:shadow-emerald-900/10">
          {/* Garis emas tipis di dalam kartu */}
          <div className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-amber-100" aria-hidden />

          <div
            className={`relative grid divide-y divide-amber-100 ${
              colCount === 3 ? "sm:grid-cols-3" : colCount === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1"
            } sm:divide-y-0 sm:divide-x`}
          >
            {hasDate && parts ? (
              <div className="flex flex-col items-center gap-2.5 px-6 py-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
                  <CalendarDays className="h-4.5 w-4.5" />
                </span>
                <span className={`${KICKER} tracking-[0.3em]`}>{parts.weekday ?? ""}</span>
                <span className="font-[family-name:var(--font-display)] text-2xl leading-none text-zinc-900">
                  {parts.day} <span className="mx-1 text-amber-500">•</span> {parts.year}
                </span>
                <span className="font-[family-name:var(--font-serif-elegant)] text-sm tracking-[0.2em] text-zinc-500 uppercase">
                  {parts.month}
                </span>
              </div>
            ) : hasDate ? (
              <div className="flex flex-col items-center gap-2.5 px-6 py-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
                  <CalendarDays className="h-4.5 w-4.5" />
                </span>
                <span className={KICKER}>{formatDate(eventDate)}</span>
              </div>
            ) : null}

            {hasTime && (
              <div className="flex flex-col items-center gap-2.5 px-6 py-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
                  <Clock className="h-4.5 w-4.5" />
                </span>
                <span className={KICKER}>Waktu</span>
                <span className="font-[family-name:var(--font-display)] text-2xl text-zinc-900">
                  {formatTime(eventTime)}
                </span>
              </div>
            )}

            {hasVenue && (
              <div className="flex flex-col items-center gap-2.5 px-6 py-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
                  <MapPin className="h-4.5 w-4.5" />
                </span>
                <span className={KICKER}>Lokasi</span>
                <span className="font-[family-name:var(--font-serif-elegant)] text-base font-medium leading-snug text-zinc-700">
                  {[venueName, location].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {locationMap && (
        <a
          href={locationMap}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-9 inline-flex items-center gap-2.5 rounded-full border border-amber-300 bg-white px-8 py-3 font-[family-name:var(--font-serif-elegant)] text-sm font-semibold tracking-wide text-emerald-900 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-900 hover:text-amber-100 hover:shadow-xl hover:shadow-emerald-900/20"
        >
          <MapPin className="h-4 w-4" />
          Lihat Lokasi di Peta
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
      )}
    </div>
  );
}

function Couple({
  groom,
  bride,
  eventName,
  quoteTitle,
  quoteText,
  quoteSource,
  quoteHidden,
}: {
  groom?: CouplePerson;
  bride?: CouplePerson;
  eventName: string;
  quoteTitle?: string;
  quoteText?: string;
  quoteSource?: string;
  quoteHidden?: boolean;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-20">
      <Reveal>
        {/* Buket peonies sage sebagai hiasan lembut di belakang kop "Mempelai" */}
        <div className="relative">
          <FlowerBouquet
            className="pointer-events-none absolute left-1/2 top-0 z-0 w-40 -translate-x-1/2 opacity-50 sm:w-52"
            flipY
          />
          <div className="relative z-10">
            <SectionHeader kicker={eventName} title="Mempelai" />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-6">
          <PersonCard person={groom} role="Mempelai Pria" />
          <PersonCard person={bride} role="Mempelai Wanita" />
        </div>

        {!quoteHidden && (
          <blockquote className="relative mx-auto mt-14 max-w-xl rounded-[1.75rem] border border-amber-200/70 bg-white/85 p-8 shadow-xl shadow-emerald-900/5 backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-amber-100" aria-hidden />
            <div className="relative text-center">
              <span className="font-[family-name:var(--font-display)] text-5xl leading-none text-amber-300/80 select-none" aria-hidden>
                &ldquo;
              </span>
              {quoteTitle?.trim() ? (
                <p className={`mt-1 ${KICKER}`}>{quoteTitle}</p>
              ) : null}
              <p className="mt-3 font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-zinc-700">
                &ldquo;
                {quoteText?.trim() ||
                  "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri..."}
                &rdquo;
              </p>
              <p className={`mt-4 ${KICKER} tracking-[0.25em]`}>
                {quoteSource?.trim() || "(QS Ar-Rum: 21)"}
              </p>
            </div>
          </blockquote>
        )}
      </Reveal>
    </section>
  );
}

/* Sudut kartu ornamen emas kecil */
function CardAccent() {
  return (
    <span
      className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-amber-100/90 to-transparent transition-transform duration-500 group-hover:scale-150"
      aria-hidden
    />
  );
}

function PersonCard({
  person,
  role,
}: {
  person?: CouplePerson;
  role: string;
}) {
  const ig = person?.instagram?.trim();
  const igUrl = ig && !/^https?:/i.test(ig) ? `https://instagram.com/${ig.replace(/^@/, "")}` : ig;

  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-amber-200/70 bg-white/90 p-8 pb-9 text-center shadow-xl shadow-emerald-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-2xl hover:shadow-emerald-900/10">
      <CardAccent />

      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={person.name ?? role}
          className="relative mx-auto mb-6 aspect-[3/4] w-full max-w-[220px] rounded-t-[7rem] rounded-b-2xl object-cover ring-1 ring-amber-200 transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-amber-300 sm:w-56"
        />
      ) : (
        <div className="relative mx-auto mb-6 flex aspect-[3/4] w-full max-w-[220px] items-center justify-center rounded-t-[7rem] rounded-b-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 text-emerald-300 ring-1 ring-amber-200 sm:w-56">
          <Heart className="h-12 w-12" />
        </div>
      )}
      <p className="relative text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-600">{role}</p>
      <h3 className="relative mt-2 font-[family-name:var(--font-display)] text-2xl leading-snug text-zinc-900">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="relative mt-2 font-[family-name:var(--font-serif-elegant)] text-sm text-zinc-500">
          Putra/Putri dari {person.parentName}
        </p>
      )}
      {person?.bio && (
        <p className="relative mt-3 border-t border-amber-100 pt-3 font-[family-name:var(--font-serif-elegant)] text-sm italic leading-relaxed text-zinc-600">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}
      {ig && igUrl ? (
        <a
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-emerald-800 transition hover:bg-amber-100"
        >
          <AtSign className="h-3.5 w-3.5" />
          {ig}
        </a>
      ) : null}
    </div>
  );
}

function AdditionalEvents({
  events,
}: {
  events: EventItem[];
}) {
  return (
    <Reveal className="block">
      <section className="mx-auto w-full max-w-3xl px-6 pb-8 pt-4">
        <SectionHeader kicker="Agenda" title="Rangkaian Acara" />

      <div className="mx-auto mt-12 max-w-xl space-y-5">
        {events.map((e) => (
          <div
            key={e.id}
            className="group relative overflow-hidden rounded-[1.5rem] border border-amber-200/70 bg-white/90 p-7 shadow-xl shadow-emerald-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-2xl hover:shadow-emerald-900/10"
          >
            <div className="pointer-events-none absolute inset-2 rounded-[1.1rem] border border-amber-100/80" aria-hidden />
            <div className="relative sm:flex sm:items-start sm:gap-5">
              {/* Tanggal di kolom kiri */}
              <div className="mb-4 sm:mb-0 sm:shrink-0 sm:border-r sm:border-amber-100 sm:pr-5 sm:text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-600">
                  {formatDate(e.date) || "—"}
                </p>
                {e.time && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm text-zinc-700">
                    <Clock className="h-4 w-4 text-amber-600" /> {formatTime(e.time)}
                  </p>
                )}
              </div>

              <div className="text-left">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-900">
                  {e.title ?? "Acara"}
                </h3>
                {e.location && (
                  <p className="mt-2 flex items-start gap-1.5 font-[family-name:var(--font-serif-elegant)] text-sm leading-snug text-zinc-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {e.location}
                  </p>
                )}
                {e.locationMap && (
                  <a
                    href={e.locationMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 font-[family-name:var(--font-serif-elegant)] text-sm font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline underline-offset-4"
                  >
                    Lihat Lokasi <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
    </Reveal>
  );
}

function MessageSection({ text }: { text: string }) {
  return (
    <Reveal className="block">
      <section id="pesan" className="mx-auto w-full max-w-3xl px-6 py-16">
        <SectionHeader kicker="Pesan Mempelai" title="Ucapan & Doa" />
        <blockquote className="relative mx-auto mt-8 max-w-lg rounded-[1.75rem] border border-amber-200/70 bg-white/90 p-9 shadow-xl shadow-emerald-900/5 backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-amber-100" aria-hidden />
          <div className="relative text-center">
            <span className="font-[family-name:var(--font-display)] text-5xl leading-none text-amber-300/80 select-none" aria-hidden>
              &ldquo;
            </span>
            <p className="mt-4 whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-lg leading-relaxed text-zinc-700 italic">
              {text}
            </p>
          </div>
        </blockquote>
      </section>
    </Reveal>
  );
}

function StorySection({
  story,
}: {
  story: StoryItem[];
}) {
  return (
    <Reveal className="block">
      <section id="cerita" className="mx-auto w-full max-w-3xl px-6 py-16">
        <SectionHeader kicker="Cerita Kami" title="Perjalanan Cinta" />

        <ol className="mx-auto mt-12 max-w-xl space-y-10 text-left">
          {story.map((item, index) => (
            <li key={item.id} className="relative pl-10">
              {index < story.length - 1 && (
                <span
                  className="absolute left-[9px] top-7 h-full w-px bg-gradient-to-b from-amber-400/80 via-amber-300/50 to-transparent"
                  aria-hidden
                />
              )}
              {/* Penanda wajik emas */}
              <span className="absolute left-0.5 top-1 flex h-5 w-5 -rotate-45 items-center justify-center rounded-[0.35rem] border border-amber-300/90 bg-white shadow-sm" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-[0.15rem] bg-gradient-to-br from-emerald-600 to-emerald-400" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600">
                {item.date ? formatDate(item.date) : "Momen"}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold leading-snug text-zinc-900">
                {item.title ?? ""}
              </h3>
              {item.description && (
                <p className="mt-2 whitespace-pre-line font-[family-name:var(--font-serif-elegant)] text-base leading-relaxed text-zinc-600">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </Reveal>
  );
}

function GallerySection({
  gallery,
}: {
  gallery: GalleryItem[];
}) {
  return (
    <Reveal className="block">
      <section id="galeri" className="relative mx-auto w-full max-w-3xl overflow-hidden bg-gradient-to-b from-[#eee8d6] to-[#f7f4ea] px-6 pb-16 pt-32 sm:pt-40">
        {/* Crest peonies memayungi band galeri — konten di atasnya */}
        <FlowerCrest className="absolute left-1/2 top-0 z-0 w-32 -translate-x-1/2 -translate-y-4 opacity-95 sm:w-40" />
        <div className="relative z-10">
        <SectionHeader kicker="Galeri Foto" title="Momen Berharga" />

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:gap-5">
          {gallery.map((item) => (
            <figure
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-amber-200/70 bg-white p-2 shadow-lg shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/15"
            >
              <div className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? "Foto galeri"}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {item.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-3 pt-8 font-[family-name:var(--font-serif-elegant)] text-sm italic text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {item.caption}
                  </figcaption>
                )}
              </div>
            </figure>
          ))}
        </div>
        </div>
      </section>
    </Reveal>
  );
}

function GiftsSection({
  gifts,
}: {
  gifts: GiftItem[];
}) {
  return (
    <Reveal className="block">
      <section id="kado" className="mx-auto w-full max-w-3xl px-6 py-16">
        <SectionHeader kicker="Tanda Kasih" title="Kado Nikah" />
        <p className="mx-auto mt-5 max-w-md text-center font-[family-name:var(--font-serif-elegant)] text-base leading-relaxed text-zinc-600 italic">
          Doa restu Anda adalah hadiah terbaik. Jika ingin memberi tanda kasih, Anda dapat
          mengirimkannya melalui salah satu rekening berikut.
        </p>

        <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
          {gifts.map((g) => (
            <div
              key={g.id}
              className="rounded-[1.5rem] border border-amber-200/70 bg-white/90 p-7 text-left shadow-xl shadow-emerald-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-2xl hover:shadow-emerald-900/10"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
                  <Landmark className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-[family-name:var(--font-display)] font-semibold text-zinc-900">{g.provider}</p>
                  {g.name && <p className="text-xs text-zinc-500">{g.name}</p>}
                </div>
              </div>
              <div className="mt-5 border-t border-dashed border-amber-200/80 pt-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">No. Rekening</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-lg font-semibold tracking-wide text-emerald-900">
                    {g.accountNumber}
                  </p>
                  <CopyButton text={g.accountNumber} />
                </div>
                {g.holderName && (
                  <p className="mt-2 font-[family-name:var(--font-serif-elegant)] text-sm text-zinc-600">
                    a.n. {g.holderName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

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
    <Reveal className="block">
      <section id="rsvp" className="relative mx-auto w-full max-w-3xl overflow-hidden bg-gradient-to-b from-[#eee8d6] to-[#f7f4ea] px-6 pb-16 pt-32 sm:pt-40">
        {/* Crest peonies memayungi band RSVP — konten di atasnya */}
        <FlowerCrest className="absolute left-1/2 top-0 z-0 w-32 -translate-x-1/2 -translate-y-4 opacity-95 sm:w-40" />
        <div className="relative z-10">
        <SectionHeader kicker="Kehadiran" title="Konfirmasi Kehadiran" />
        <p className="mx-auto mt-5 max-w-sm text-center font-[family-name:var(--font-serif-elegant)] text-base leading-relaxed text-zinc-600 italic">
          Mohon konfirmasi kehadiran Anda agar kami dapat menyiapkan segala sesuatunya.
        </p>
        <div className="mx-auto mt-10 max-w-md rounded-[1.75rem] border border-amber-200/70 bg-white/85 p-2 shadow-xl shadow-emerald-900/5 backdrop-blur-sm">
          <div className="rounded-[1.4rem] border border-amber-100 p-6 sm:p-7 text-left">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={accentClass}
              borderClass={borderClass}
            />
          </div>
        </div>
        </div>
      </section>
    </Reveal>
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
  wishes: WishItem[];
}) {
  return (
    <Reveal className="block">
      <section id="ucapan" className="mx-auto w-full max-w-3xl px-6 py-16">
        <SectionHeader kicker="Wedding Wall" title="Kirim Ucapan & Doa" />

        <div className="mx-auto mt-10 max-w-2xl">
          <WishList
            wishes={wishes}
            cardClass="border-amber-200/60 bg-white/90"
            nameClass="text-emerald-800"
            avatarClass="bg-gradient-to-br from-emerald-600 to-emerald-500 text-amber-50"
            emptyClass="text-zinc-400"
          />
        </div>

        <div className="mx-auto mt-10 max-w-md rounded-[1.75rem] border border-amber-200/70 bg-white/85 p-2 shadow-xl shadow-emerald-900/5 backdrop-blur-sm">
          <div className="rounded-[1.4rem] border border-amber-100 p-6 sm:p-7 text-left">
            <WishForm invitationId={invitationId} accentClass={accentClass} borderClass={borderClass} />
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  const initial = (s?: string) => (s?.trim() ? s.trim().charAt(0).toUpperCase() : "&");
  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-[#0f3d2e] to-[#082a20] px-6 pb-16 pt-40 text-center text-emerald-50 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,63,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(176,141,63,0.08),transparent_55%)]" />
      {/* Rangkaian peonies di tengah tepi atas footer */}
      <FlowerCrest className="absolute left-1/2 top-0 z-10 w-36 -translate-x-1/2 -translate-y-8 opacity-90 drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] sm:w-44" />
      <div className="relative">
        {/* Monogram pasangan dalam medali emas */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/70 shadow-[0_0_0_5px_rgba(176,141,63,0.15)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/50 bg-white/5 font-[family-name:var(--font-display)] text-lg text-amber-200">
            {initial(groomName)}&amp;{initial(brideName)}
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <OrnamentDivider light />
        </div>

        <p className="mt-4 font-[family-name:var(--font-script)] text-3xl leading-snug text-amber-100">
          {groomName ?? "Pria"} <span className="mx-1 text-amber-300">&amp;</span> {brideName ?? "Wanita"}
        </p>
        <p className="mt-3 font-[family-name:var(--font-serif-elegant)] text-sm italic text-emerald-100/80">
          Terima kasih atas doa &amp; kehadiran Anda
        </p>
        <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-emerald-200/50">
          © {new Date().getFullYear()} MEDUTA
        </p>
      </div>
    </footer>
  );
}
