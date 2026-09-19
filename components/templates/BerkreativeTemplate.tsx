"use client";

import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  Quote,
  Landmark,
  ExternalLink,
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
} from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Berkreative Royale — karakter paling playful & full-color:
 * - Navy pekat berpola daun (aset brand Meduta) sebagai panggung
 * - Gradasi pink-fuchsia-violet + aksen emas, kartu glassmorphism
 * - Ilustrasi pasangan pink (aset landing) di cover
 * - Bunga melayang dari galeri aset admin (Supabase)
 * Sengaja kontras dengan Classic (krem-emas), Minimal (violet bersih),
 * Floral (rose lembut), dan Rustic (earth tenang).
 */

// Aset brand & galeri admin
const BRAND_BG = "/design/bg-new-opt.jpg"; // navy berpola daun
const BRAND_COUPLE = "/design/ilustrasi.webp"; // ilustrasi pasangan pink
const ASSET_FLOWER_PINK =
  "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates/decor/280fc784-5503-4408-9e39-395cf5ae26dc.png";
const ASSET_FLOWER_BLUE =
  "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates/decor/52708bac-c4fd-4842-9e12-5a26a4e6a16e.png";
const ASSET_WEDDING_LOGO =
  "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates/image/a8123821-7e4c-4115-982e-f7fbcd7aa448.png";

const ACCENT =
  "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 hover:from-fuchsia-500 hover:via-pink-500 hover:to-rose-400 shadow-lg shadow-pink-600/30";
const BORDER =
  "border-fuchsia-200 bg-white/60 focus:border-fuchsia-500 focus:ring-fuchsia-100";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function BerkreativeTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <BerkreativeShell
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

function BerkreativeShell({
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

  // Prioritas background: pilihan user > admin (template) > bawaan (brand navy)
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
      className="relative flex min-h-screen flex-col items-center bg-[#0b1030] font-sans text-white"
      style={{
        backgroundImage: bgUrl ? undefined : `url(${BRAND_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Lapisan warna full-color di atas latar navy */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(217,70,239,0.22),transparent_45%),radial-gradient(ellipse_at_85%_25%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(ellipse_at_50%_90%,rgba(244,63,94,0.16),transparent_50%)]" />

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
        <Couple groom={groom} bride={bride} eventName={data.eventName ?? "Pernikahan"} />
      ) : null}

      <MainEvent
        eventDate={agenda.main.date}
        eventTime={agenda.main.time}
        venueName={data.venueName}
        location={data.location}
        locationMap={agenda.main.mapUrl}
      />

      {story.length > 0 ? <StorySection story={story} /> : null}

      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {events.length > 0 ? <AdditionalEvents events={events} /> : null}

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
          buttonClassName="bg-white/15 text-white border border-white/30 backdrop-blur-md"
          playingIconClassName="h-5 w-5 animate-pulse text-fuchsia-300"
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0b1030] px-6 text-center text-white">
      <RingIcon className="h-8 w-8 text-fuchsia-400" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="text-sm text-white/60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-fuchsia-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
        {title}
      </h2>
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-fuchsia-400/70" />
        <RingIcon className="h-4 w-4 text-amber-300" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-fuchsia-400/70" />
      </div>
    </div>
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
      className="animate-fade-up relative flex min-h-[100svh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden bg-cover bg-center px-6 pb-64 pt-14 text-center text-white"
      style={
        bgUrl
          ? {
              backgroundImage:
                "linear-gradient(to bottom, rgba(11,16,48,0.55), rgba(11,16,48,0.75))",
            }
          : undefined
      }
    >
      {/* Foto background kustom (user/admin) sebagai lapisan terpisah */}
      {bgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* Bunga melayang dari galeri aset admin — di belakang teks (z-0) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSET_FLOWER_PINK}
        alt=""
        className="animate-float-slow pointer-events-none absolute -left-8 top-[10%] z-0 w-20 opacity-80 drop-shadow-[0_8px_24px_rgba(236,72,153,0.45)]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSET_FLOWER_BLUE}
        alt=""
        className="animate-float-slower pointer-events-none absolute -right-6 top-[20%] z-0 w-16 opacity-80 drop-shadow-[0_8px_24px_rgba(59,130,246,0.45)]"
      />

      {/* Logo wedding dari aset admin */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSET_WEDDING_LOGO}
        alt=""
        className="relative z-10 mx-auto mb-4 w-24 drop-shadow-[0_4px_20px_rgba(217,70,239,0.5)]"
      />

      <div className="relative z-10">
        <p className="animate-fade-up-delay-1 mb-3 text-xs font-semibold uppercase tracking-[0.45em] text-fuchsia-200">
          {eventName}
        </p>

        <h1 className="animate-fade-up-delay-2 font-[family-name:var(--font-display)] text-5xl font-semibold leading-tight sm:text-6xl">
          {groomNick ?? "Pria"}
          <span className="text-gold-shimmer mx-3 inline-block font-[family-name:var(--font-script)] text-5xl font-normal sm:text-6xl">
            &amp;
          </span>
          {brideNick ?? "Wanita"}
        </h1>

        <div className="animate-fade-up-delay-3 mt-6 flex items-center justify-center gap-3">
          <span className="hidden h-px w-16 bg-gradient-to-r from-transparent to-amber-300/70 sm:block" />
          <p className="max-w-[260px] text-sm leading-relaxed tracking-[0.25em] text-white/85">
            {formatDate(eventDate)}
          </p>
          <span className="hidden h-px w-16 bg-gradient-to-l from-transparent to-amber-300/70 sm:block" />
        </div>

        {guestName && (
          <div className="animate-fade-up-delay-4 mx-auto mt-10 max-w-sm rounded-3xl border border-white/25 bg-white/10 p-5 shadow-2xl shadow-fuchsia-900/40 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-200">
              Kepada Yth.
            </p>
            <p className="mt-1 font-[family-name:var(--font-script)] text-3xl text-white">
              {guestName}
            </p>
          </div>
        )}
      </div>

      {/* Ilustrasi pasangan (aset brand) menancap di dasar cover — di bawah konten teks */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_COUPLE}
        alt=""
        className="pointer-events-none absolute bottom-0 left-1/2 z-[5] w-56 -translate-x-1/2 drop-shadow-[0_-8px_40px_rgba(217,70,239,0.35)] sm:w-64"
      />
    </header>
  );

  // Saat gerbang tertutup: konten dikunci + overlay "Buka Undangan" fullscreen
  if (locked) {
    return (
      <InvitationGate
        theme="berkreative"
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
    <section className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Akad & Resepsi" title="Rangkaian Bahagia" />
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/70">
        Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami.
      </p>

      <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-3">
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

      {locationMap && (
        <a
          href={locationMap}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ACCENT} mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition`}
        >
          <MapPin className="h-4 w-4" />
          Lihat Lokasi di Peta
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
      )}
    </section>
  );
}

function InfoCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="group rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-lg shadow-fuchsia-900/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300/50 hover:bg-white/[0.12]">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-pink-600/40 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span className="mt-3 block text-sm font-medium leading-snug text-white/90">{label}</span>
    </div>
  );
}

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
    <section className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow={eventName} title="Kedua Mempelai" />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PersonCard person={groom} role="Mempelai Pria" gradient="from-fuchsia-500 to-pink-500" />
        <PersonCard person={bride} role="Mempelai Wanita" gradient="from-violet-500 to-blue-500" />
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-amber-200/25 bg-white/[0.07] p-6 backdrop-blur-md">
        <Quote className="mx-auto mb-3 h-5 w-5 text-amber-300" />
        <p className="text-sm italic leading-relaxed text-white/85">
          “Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
          pasangan hidup dari jenismu sendiri...”
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
          (QS Ar-Rum: 21)
        </p>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  gradient,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300/50 hover:shadow-2xl hover:shadow-fuchsia-900/40">
      {/* Glow sudut */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-25 blur-2xl transition-transform duration-500 group-hover:scale-150`}
      />

      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={person.name ?? role}
          className="relative mx-auto mb-5 h-40 w-40 rounded-full object-cover ring-4 ring-fuchsia-400/50 ring-offset-4 ring-offset-[#0b1030] transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className={`relative mx-auto mb-5 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white shadow-xl`}
        >
          <Heart className="h-12 w-12" />
        </div>
      )}

      <p className={`relative bg-gradient-to-r ${gradient} bg-clip-text text-[11px] font-bold uppercase tracking-[0.3em] text-transparent`}>
        {role}
      </p>
      <h3 className="relative mt-2 font-[family-name:var(--font-display)] text-2xl text-white">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="relative mt-2 text-sm text-white/65">Putra/Putri dari {person.parentName}</p>
      )}
      {person?.bio && (
        <p className="relative mt-3 border-t border-white/10 pt-3 text-sm italic text-white/75">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}
      {person?.instagram && (
        <p className="relative mt-2 flex items-center justify-center gap-1 text-xs text-fuchsia-300">
          <AtSign className="h-3 w-3" /> {person.instagram}
        </p>
      )}
    </div>
  );
}

function AdditionalEvents({
  events,
}: {
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  return (
    <section className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Agenda" title="Rangkaian Acara" />

      <div className="mx-auto mt-10 max-w-xl space-y-5">
        {events.map((e, i) => (
          <div
            key={e.id}
            className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-300/50 hover:shadow-xl hover:shadow-fuchsia-900/30"
          >
            {/* Strip gradasi beda tiap kartu — full color */}
            <div
              className={`absolute inset-y-0 left-0 w-1.5 ${
                i % 2 === 0
                  ? "bg-gradient-to-b from-fuchsia-500 to-pink-500"
                  : "bg-gradient-to-b from-violet-500 to-blue-500"
              }`}
            />
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-transparent blur-xl" />
            <div className="relative pl-3">
              <span className={`${ACCENT} inline-block rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white`}>
                {formatDate(e.date)}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                {e.title ?? "Acara"}
              </h3>
              {e.time && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                  <Clock className="h-4 w-4 text-fuchsia-300" /> {formatTime(e.time)}
                </p>
              )}
              {e.location && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 text-fuchsia-300" /> {e.location}
                </p>
              )}
              {e.locationMap && (
                <a
                  href={e.locationMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200 hover:underline"
                >
                  Lihat Lokasi <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MessageSection({ text }: { text: string }) {
  return (
    <section id="pesan" className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Ucapan & Doa" title="Pesana Kami" />
      <div className="relative mx-auto mt-6 max-w-lg rounded-3xl border border-amber-200/25 bg-white/[0.07] p-8 backdrop-blur-md">
        <Quote className="mx-auto mb-4 h-6 w-6 text-amber-300" />
        <p className="whitespace-pre-line font-[family-name:var(--font-display)] text-lg leading-relaxed text-white/90">
          {text}
        </p>
      </div>
    </section>
  );
}

function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section id="cerita" className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Cerita Kami" title="Perjalanan Cinta" />

      <div className="mx-auto mt-12 max-w-xl space-y-10 text-left">
        {story.map((item, index) => (
          <div key={item.id} className="relative pl-10">
            {index < story.length - 1 && (
              <span className="absolute left-[9px] top-7 h-full w-px bg-gradient-to-b from-fuchsia-400/70 via-pink-400/40 to-transparent" />
            )}
            <span className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-fuchsia-400 bg-[#0b1030]">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">
              {item.date ? formatDate(item.date) : "Momen"}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-white">
              {item.title ?? ""}
            </h3>
            {item.description && (
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/75">
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  return (
    <section id="galeri" className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Galeri Foto" title="Momen Berharga" />

      <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4">
        {gallery.map((item, i) => (
          <figure
            key={item.id}
            className={`group relative overflow-hidden rounded-3xl border border-white/15 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-900/40 ${
              i % 3 === 0 ? "rotate-[-1.5deg]" : i % 3 === 1 ? "rotate-[1.2deg]" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.caption ?? "Foto galeri"}
              className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {item.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 px-4 py-3 text-left text-xs font-medium italic text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section id="kado" className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Tanda Kasih" title="Kado Nikah" />
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/70">
        Doa restu Anda adalah hadiah terbaik. Jika ingin memberi tanda kasih,
        Anda dapat mengirimkannya melalui salah satu rekening berikut.
      </p>

      <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
        {gifts.map((g) => (
          <div
            key={g.id}
            className="rounded-3xl border border-white/15 bg-white/[0.07] p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/50 hover:shadow-xl hover:shadow-amber-900/20"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-600/30">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <p className="font-[family-name:var(--font-display)] font-semibold text-white">
                  {g.provider}
                </p>
                {g.name && <p className="text-xs text-white/60">{g.name}</p>}
              </div>
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-widest text-white/45">
              No. Rekening
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-mono text-lg font-semibold tracking-wide text-white">
                {g.accountNumber}
              </p>
              <CopyButton text={g.accountNumber} />
            </div>
            {g.holderName && <p className="mt-2 text-sm text-white/70">a.n. {g.holderName}</p>}
          </div>
        ))}
      </div>
    </section>
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
    <section id="rsvp" className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Kehadiran" title="Konfirmasi Kehadiran" />
      <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/70">
        Mohon konfirmasi kehadiran Anda agar kami dapat menyiapkan segala sesuatunya.
      </p>
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/15 bg-white/[0.07] p-7 text-left shadow-2xl shadow-fuchsia-900/30 backdrop-blur-md">
        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass={accentClass}
          borderClass={borderClass}
        />
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
    <section id="ucapan" className="w-full max-w-3xl px-6 py-20 text-center">
      <SectionHeading eyebrow="Wedding Wall" title="Kirim Ucapan & Doa" />

      <div className="mx-auto mt-10 max-w-2xl">
        <WishList
          wishes={wishes ?? []}
          cardClass="border-white/15 bg-white/[0.07] backdrop-blur-md"
          nameClass="text-fuchsia-200"
          avatarClass="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white"
          emptyClass="text-white/40"
        />
      </div>

      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/15 bg-white/[0.07] p-7 text-left backdrop-blur-md">
        <WishForm invitationId={invitationId} accentClass={accentClass} borderClass={borderClass} />
      </div>
    </section>
  );
}

function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-[#0b1030] via-[#1a0b2e] to-[#2d0a24] px-6 py-16 text-center text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.2),transparent_60%)]" />
      <div className="relative">
        <div className="mb-6 flex justify-center">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/70" />
          <RingIcon className="mx-3 h-4 w-4 text-amber-300" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300/70" />
        </div>
        <p className="font-[family-name:var(--font-display)] text-3xl text-white">
          {groomName ?? "Pria"}{" "}
          <span className="text-gold-shimmer mx-1 inline-block font-[family-name:var(--font-script)] text-3xl">
            &amp;
          </span>{" "}
          {brideName ?? "Wanita"}
        </p>
        <p className="mt-3 text-sm text-white/70">Terima kasih atas doa &amp; kehadiran Anda</p>
        <p className="mt-8 text-xs tracking-[0.3em] text-fuchsia-300/60">© {new Date().getFullYear()} MEDUTA</p>
      </div>
    </footer>
  );
}
