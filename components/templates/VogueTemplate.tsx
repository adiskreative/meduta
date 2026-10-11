"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  MapPin,
  X,
  Landmark,
} from "lucide-react";
import { googleCalendarUrl } from "./SharedWidgets";
import InvitationGate from "./InvitationGate";
import VogueGate from "./VogueGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { Countdown } from "./SharedWidgets";
import { formatDate, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Vogue Editorial — "Special Wedding Issue"
 * Adopsi dari desain referensi majalah fashion (cream #F9F8F3, charcoal #111111,
 * warm-gray #66635F; Bodoni-esque display, Cormorant italic, Montserrat sans),
 * diubah total menjadi data-driven sesuai arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic) — bukan osilator Web Audio sintetis
 * - RSVP & ucapan lewat server action (RsvpForm/WishForm), tersimpan di DB
 * - Background berlapis: pilihan user > admin (template) > bawaan
 * - Tanpa API eksternal (AI wish formatter referensi dihapus — risiko bocor kunci)
 * - Tanpa framer-motion & confetti — animasi CSS yang sudah tersedia di project
 * Khas template ini: masthead editorial, foto grayscale "cover story",
 * kartu tanggal offset, countdown, galeri lookbook dengan lightbox.
 */

/* Palet editorial (konsisten dengan desain referensi) */
const VOGUE = {
  cream: "#F9F8F3",
  creamDark: "#EFECE6",
  creamMuted: "#E4DFD5",
  charcoal: "#111111",
  warmGray: "#66635F",
} as const;

const GRAY =
  "grayscale contrast-125 transition-transform duration-700 group-hover:scale-[1.03] group-hover:grayscale-0";

/* ------------------------------------------------------------------ */
/* Komponen utama                                                      */
/* ------------------------------------------------------------------ */

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function VogueTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <VogueShell
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

function VogueShell({
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
  const events = data.events ?? [];
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  // Prioritas background: pilihan user > admin (template) > bawaan (ruang editorial)
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
      className="relative min-h-screen overflow-x-hidden bg-[#F9F8F3] text-[#111111]"
      style={{ fontFamily: "Montserrat, var(--font-sans), sans-serif" }}
    >
      <div className="relative z-10">
        <Cover
          eventName={data.eventName ?? "Undangan Pernikahan"}
          groomNick={groom?.nickname ?? groom?.name}
          brideNick={bride?.nickname ?? bride?.name}
          groomName={groom?.name}
          brideName={bride?.name}
          eventDate={data.eventDate}
          eventTime={data.eventTime}
          venueName={data.venueName}
          location={data.location}
          guestName={guestName}
          locked={!gateOpen}
          onOpen={onGateOpen}
          bgUrl={bgUrl}
          groomPhoto={groom?.photoUrl}
          bridePhoto={bride?.photoUrl}
          photo={gatePhoto}
        />

        {gateOpen && (
          <main className="w-full">
            {/* Hero cover story: judul VOWS raksasa + foto grayscale + kartu tanggal */}
            <HeroSection
              groomNick={groom?.nickname ?? groom?.name}
              brideNick={bride?.nickname ?? bride?.name}
              eventDate={data.eventDate}
              eventTime={data.eventTime}
              venueName={data.venueName}
              location={data.location}
              photo={gatePhoto}
            />

            {/* Kutipan pengantar + pesan resmi */}
            <InvitationSection customMessage={data.customMessage} groomNick={groom?.nickname ?? groom?.name} brideNick={bride?.nickname ?? bride?.name} location={data.location} />

            {groom?.name || bride?.name ? (
              <Couple groom={groom} bride={bride} />
            ) : null}

            {story.length > 0 ? (
              <StorySection story={story} gallery={gallery} />
            ) : null}

            {/* Timetable + countdown */}
            <EventsSection
              eventDate={data.eventDate}
              eventTime={data.eventTime}
              venueName={data.venueName}
              location={data.location}
              locationMap={data.locationMap}
              events={events}
            />

            {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

            {gifts.length > 0 ? <GiftsSection gifts={gifts} /> : null}

            <RsvpSection invitationId={invitationId} guestName={guestName} />

            <Wishes invitationId={invitationId} wishes={wishes} />

            <Footer
              groomNick={groom?.nickname ?? groom?.name}
              brideNick={bride?.nickname ?? bride?.name}
            />
          </main>
        )}
      </div>

      {/* FAB musik latar user */}
      {gateOpen && data.musicUrl && music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="border border-[#111111]/20 bg-[#F9F8F3]/90 text-[#111111] shadow-md backdrop-blur-md hover:border-[#66635F]"
          playingIconClassName="h-4 w-4 animate-pulse"
          pausedIconClassName="h-4 w-4 opacity-50"
        />
      ) : null}
    </div>
  );
}

function DraftNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#111111] px-6 text-center text-[#F9F8F3]">
      <p className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
        Special Editorial Issue
      </p>
      <p className="font-[family-name:var(--font-display)] text-2xl italic">
        Undangan belum dipublikasikan
      </p>
      <p className="max-w-xs text-xs leading-relaxed text-[#66635F]">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Masthead + Cover story                                              */
/* ------------------------------------------------------------------ */

const GATE_FALLBACK_BG =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80";

function Cover({
  eventName,
  groomNick,
  brideNick,
  groomName,
  brideName,
  eventDate,
  eventTime,
  venueName,
  location,
  guestName,
  locked = false,
  onOpen,
  bgUrl,
  groomPhoto,
  bridePhoto,
  photo,
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  groomName?: string;
  brideName?: string;
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  guestName?: string;
  locked?: boolean;
  onOpen?: () => void;
  bgUrl?: string;
  groomPhoto?: string;
  bridePhoto?: string;
  photo?: string;
}) {
  const masthead = (
    <header className="relative flex min-h-screen flex-col overflow-hidden bg-[#111111] text-[#F9F8F3]">
      {/* Latar: pilihan user > admin > bawaan — redup di belakang cover story */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${bgUrl || GATE_FALLBACK_BG})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(17,17,17,0.82), rgba(17,17,17,0.95))",
        }}
      />

      {/* Masthead atas — khas halaman sampul majalah */}
      <div className="relative z-10 flex items-start justify-between border-b border-[#66635F]/30 px-6 py-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
            Special Editorial Issue
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-display)] text-xs">
            {eventDate ? formatDate(eventDate) : "N° 01"}
          </p>
        </div>
        <span className="inline-block border border-[#F9F8F3]/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em]">
          Limited Edition
        </span>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#66635F]">
          {eventName}
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl italic leading-none tracking-tight sm:text-7xl">
          {groomNick ?? "Pria"}
          <span className="mx-3 font-[family-name:var(--font-serif-elegant)] text-3xl font-normal not-italic text-[#DCD8CE] sm:text-5xl">
            &amp;
          </span>
          {brideNick ?? "Wanita"}
        </h1>
        {(groomName || brideName) && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[#66635F]">
            {groomName ?? ""}{brideName ? ` & ${brideName}` : ""}
          </p>
        )}

        {/* Kartu tamu — bingkai atas-bawah editorial */}
        {guestName && (
          <div className="mt-10 border-y border-[#F9F8F3]/30 bg-[#F9F8F3]/5 px-8 py-4 backdrop-blur-sm">
            <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-[#66635F]">
              Exclusively invited for
            </p>
            <p className="font-[family-name:var(--font-serif-elegant)] text-2xl italic tracking-wide">
              {guestName}
            </p>
          </div>
        )}

        {/* Foto pasangan berdampingan — grayscale editorial */}
        <div className="mt-10 flex items-center gap-3">
          {[groomPhoto, bridePhoto].map((p, i) => (
            <div
              key={i}
              className="h-36 w-27 overflow-hidden border border-[#66635F]/40 sm:h-44 sm:w-34"
            >
              {p ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p}
                  alt={i === 0 ? groomNick ?? "Mempelai" : brideNick ?? "Mempelai"}
                  className="h-full w-full object-cover grayscale contrast-125"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F9F8F3]/10">
                  <span className="font-[family-name:var(--font-display)] text-3xl italic text-[#66635F]">
                    {i === 0 ? (groomNick ?? "P").charAt(0) : (brideNick ?? "W").charAt(0)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {!locked && <OpenHint />}
      </div>

      {/* Footer masthead */}
      <div className="relative z-10 flex items-end justify-between border-t border-[#66635F]/30 px-6 py-4 text-[9px] uppercase tracking-[0.2em] text-[#66635F]">
        <div>
          <p>Meduta Editorial</p>
          <p>{location ?? "Indonesia"}</p>
        </div>
        <p className="hidden sm:block">An Ode to Love &amp; Modern Elegance</p>
      </div>
    </header>
  );

  // Gerbang khusus editorial — halaman sampul majalah (bukan gerbang generik)
  if (locked) {
    return (
      <VogueGate
        eventName={eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        eventDate={eventDate}
        guestName={guestName}
        location={location}
        onOpen={onOpen}
        backgroundUrl={bgUrl}
        photoUrl={photo}
      />
    );
  }

  return masthead;
}

function OpenHint() {
  return (
    <div className="mt-10 flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#66635F]">
      <span>Scroll untuk membaca</span>
      <ArrowDown className="h-4 w-4 animate-bounce" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero cover story (setelah gerbang terbuka)                          */
/* ------------------------------------------------------------------ */

function HeroSection({
  groomNick,
  brideNick,
  eventDate,
  eventTime,
  venueName,
  location,
  photo,
}: {
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  photo?: string;
}) {
  return (
    <section className="relative flex min-h-[92vh] flex-col justify-between overflow-hidden bg-[#F9F8F3] px-4 pb-12 pt-20 md:px-12">
      {/* Baris meta atas */}
      <div className="flex items-baseline justify-between border-b border-[#111111]/20 pb-3 text-[11px] uppercase tracking-[0.2em] text-[#66635F]">
        <span>Volume 01</span>
        <span className="hidden md:inline">Editorial Wedding</span>
        <span>{location?.split(",")[0] ?? "Indonesia"}</span>
      </div>

      {/* Judul raksasa dengan overlay nama */}
      <div className="relative my-6 text-center">
        <h1 className="select-none font-[family-name:var(--font-display)] text-7xl font-extrabold uppercase leading-none tracking-tight text-[#111111] sm:text-9xl">
          Vows
        </h1>
        <p className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-serif-elegant)] text-2xl italic tracking-widest text-[#111111]/80 md:text-5xl">
          {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
        </p>
      </div>

      {/* Cover story: foto grayscale + kartu tanggal offset */}
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-12">
        <div className="relative group md:col-span-8">
          <div className="relative aspect-[3/4] overflow-hidden shadow-2xl md:aspect-[4/5]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt="Mempelai"
                className={`h-full w-full object-cover ${GRAY}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#E4DFD5]">
                <span className="font-[family-name:var(--font-display)] text-6xl italic text-[#66635F]/40">
                  {groomNick?.charAt(0) ?? ""}
                  {(brideNick ?? "").charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-[#F9F8F3]">
              <p className="mb-1 text-[10px] uppercase tracking-[0.4em] text-[#F9F8F3]/70">
                Cover Story
              </p>
              <p className="font-[family-name:var(--font-serif-elegant)] text-2xl italic leading-tight md:text-4xl">
                &ldquo;Where Elegance Meets Forever.&rdquo;
              </p>
            </div>
          </div>

          {/* Kartu tanggal offset — khas editorial */}
          <div className="absolute -bottom-6 -right-2 max-w-[180px] border border-[#111111] bg-[#F9F8F3] p-4 shadow-xl sm:-right-4 md:max-w-[220px] md:p-6">
            <p className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[#66635F]">
              Date of Harmony
            </p>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold md:text-2xl">
              {eventDate ? formatDate(eventDate) : "—"}
            </p>
            <p className="mt-1 text-[10px] text-[#66635F]">
              {[venueName, location].filter(Boolean).join(" · ") || (eventTime ?? "")}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-end space-y-4 pt-8 text-left md:col-span-4 md:pt-0 md:text-right">
          <div className="border-t border-[#111111]/20 pt-4">
            <span className="block text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
              Featured
            </span>
            <p className="mt-1 font-[family-name:var(--font-serif-elegant)] text-lg italic leading-tight">
              Perayaan besar akan cinta, seni, dan keanggunan modern.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="#acara"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] underline transition hover:text-[#66635F]"
            >
              Lihat Acara <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[#111111]/20 pt-4 text-[11px] uppercase tracking-[0.2em] text-[#66635F]">
        <span>Scroll untuk membaca</span>
        <ArrowDown className="h-4 w-4 animate-bounce text-[#111111]" />
        <span>Halaman 01</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kutipan + undangan resmi                                            */
/* ------------------------------------------------------------------ */

function InvitationSection({
  customMessage,
  groomNick,
  brideNick,
  location,
}: {
  customMessage?: string;
  groomNick?: string;
  brideNick?: string;
  location?: string;
}) {
  return (
    <section className="border-t border-[#DCD8CE] bg-[#F9F8F3] py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-12 md:px-16">
        <div className="relative md:col-span-5">
          <span className="absolute -left-6 -top-12 select-none font-[family-name:var(--font-display)] text-9xl text-[#111111]/10">
            &ldquo;
          </span>
          <h2 className="relative z-10 mb-6 font-[family-name:var(--font-display)] text-3xl italic leading-tight md:text-5xl">
            Kami mengundang Anda menjadi saksi dimulainya mahakarya kehidupan kami.
          </h2>
          <p className="font-[family-name:var(--font-serif-elegant)] text-xl italic text-[#66635F]">
            — {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
          </p>
        </div>

        <div className="space-y-6 pl-0 text-sm leading-relaxed text-[#111111]/80 md:col-span-7 md:border-l md:border-[#111111]/20 md:pl-8 md:text-base">
          <div className="mb-2 flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-[#66635F]">
            <span className="h-px w-8 bg-[#66635F]" />
            <span>Official Invitation</span>
          </div>

          {customMessage ? (
            <p className="whitespace-pre-line first-letter:float-left first-letter:mr-3 first-letter:font-[family-name:var(--font-display)] first-letter:text-5xl first-letter:leading-none">
              {customMessage}
            </p>
          ) : (
            <p className="first-letter:float-left first-letter:mr-3 first-letter:font-[family-name:var(--font-display)] first-letter:text-5xl first-letter:leading-none">
              Tanpa mengurangi rasa hormat, kami memohon kehadiran
              Bapak/Ibu/Saudara/i pada hari pernikahan kami. Sebuah perayaan janji
              suci yang dikemas dalam keindahan kebersamaan.
            </p>
          )}

          <p className="text-[#66635F]">
            Kehadiran serta doa restu Anda adalah kehormatan tertinggi dan hadiah
            terindah yang menyempurnakan langkah awal petualangan abadi kami.
          </p>

          {location && (
            <div className="grid grid-cols-2 gap-6 border-t border-[#DCD8CE] pt-4 text-xs uppercase tracking-[0.2em]">
              <div>
                <span className="block text-[10px] text-[#66635F]">Lokasi</span>
                <span className="font-bold">{location}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#66635F]">Dress Code</span>
                <span className="font-bold">Monochrome Elegance</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai — section charcoal "Protagonists"                          */
/* ------------------------------------------------------------------ */

function Couple({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section className="overflow-hidden bg-[#111111] py-24 text-[#F9F8F3]">
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-16 flex flex-col justify-between border-b border-[#66635F]/30 pb-6 md:flex-row md:items-end">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
              Protagonists
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl italic md:text-7xl">
              The Groom &amp; The Bride
            </h2>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#66635F] md:mt-0">
            Two Souls / One Vision
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
          <PersonCard person={groom} role="The Groom" />
          <div className="lg:mt-24">
            <PersonCard person={bride} role="The Bride" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
}) {
  return (
    <div className="group space-y-6">
      <div className="relative aspect-[3/4] overflow-hidden border border-[#66635F]/30">
        {person?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt={person.name ?? role}
            className={`h-full w-full object-cover ${GRAY}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F9F8F3]/5">
            <span className="font-[family-name:var(--font-display)] text-6xl italic text-[#66635F]/40">
              {(person?.name ?? role).charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4 border border-[#66635F]/40 bg-[#111111]/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
          {role}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
          {person?.name ?? "-"}
        </h3>
        {person?.parentName && (
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#66635F]">
            Putra/Putri dari {person.parentName}
          </p>
        )}
        {person?.bio && (
          <p className="whitespace-pre-line border-t border-[#66635F]/30 pt-2 font-[family-name:var(--font-serif-elegant)] text-lg italic leading-relaxed text-[#F9F8F3]/80">
            &ldquo;{person.bio}&rdquo;
          </p>
        )}
        {person?.instagram && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#66635F]">
            Instagram: {person.instagram}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cerita — "The Narrative" dua bab bergantian                         */
/* ------------------------------------------------------------------ */

function StorySection({
  story,
  gallery,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  return (
    <section className="border-t border-[#DCD8CE] bg-[#F9F8F3] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-16">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
            Editorial Spread
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic md:text-6xl">
            The Narrative
          </h2>
          <div className="mx-auto mt-4 h-px w-12 bg-[#111111]" />
        </div>        {story.slice(0, 4).map((item, i) => {
          // Foto bab: ambil dari galeri (bergantian) — khas spread majalah
          const photo = gallery[i % Math.max(gallery.length, 1)]?.url;
          return (
            <div
              key={item.id}
              className="mb-16 grid grid-cols-1 items-center gap-8 last:mb-0 md:grid-cols-12"
            >
              {/* Teks: kiri pada bab ganjil, kanan pada bab genap */}
              <div
                className={`space-y-4 md:col-span-5 ${
                  i % 2 === 0 ? "md:order-1" : "md:order-2 md:pl-6"
                }`}
              >
                <span className="font-[family-name:var(--font-display)] text-3xl italic text-[#66635F]">
                  Chapter {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wider md:text-3xl">
                  {item.title ?? "Momen"}
                </h3>
                {item.date && (
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[#66635F]">
                    {formatDate(item.date)}
                  </p>
                )}
                {item.description && (
                  <p className="whitespace-pre-line pt-2 text-sm leading-relaxed text-[#111111]/80">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Foto bab: kanan pada bab ganjil, kiri pada bab genap */}
              <div
                className={`group overflow-hidden border border-[#111111]/20 shadow-xl md:col-span-7 ${
                  i % 2 === 0 ? "md:order-2" : "md:order-1"
                }`}
              >
                <div className="relative aspect-[16/10]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={item.title ?? "Momen"}
                      className={`absolute inset-0 h-full w-full object-cover ${GRAY}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#E4DFD5]">
                      <span className="font-[family-name:var(--font-display)] text-5xl italic text-[#66635F]/30">
                        Ch. {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara — "The Wedding Itinerary" baris tabel editorial               */
/* ------------------------------------------------------------------ */

function EventsSection({
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
  // Entri "Akad" pada Rangkaian Acara digabung ke baris Akad utama agar
  // tidak tampil dobel — detail dari entri akad yang menang (akadWins).
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
  return (
    <section id="acara" className="border-y border-[#DCD8CE] bg-[#EFECE6] py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-16">
        <div className="mb-10 flex flex-col justify-between border-b border-[#111111]/20 pb-6 md:flex-row md:items-end">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
              Timetable
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl italic md:text-6xl">
              The Wedding Itinerary
            </h2>
          </div>
          <span className="mt-2 text-xs uppercase tracking-[0.2em] text-[#66635F] md:mt-0">
            {eventDate ? formatDate(eventDate) : ""}
          </span>
        </div>

        {/* Countdown */}
        {eventDate && (
          <div className="mx-auto mb-16 max-w-xl bg-[#F9F8F3] p-8 shadow-sm">
            <span className="mb-6 block text-center text-[11px] uppercase tracking-[0.3em] text-[#66635F]">
              Hitung Mundur Hari Bahagia
            </span>
            <Countdown
              target={eventDate}
              valueClass="text-2xl md:text-3xl"
              labelClass="text-[9px]"
              boxClass=""
            />
          </div>
        )}

        <div className="space-y-8">
          <EventRow
            time={agenda.main.time}
            label="Sacred Ceremony"
            title="Akad Nikah"
            venue={agenda.main.venue}
            mapUrl={agenda.main.mapUrl}
            date={agenda.main.date}
            tag="All Invited Guests"
          />
          {agenda.additional.map((e, i) => (
            <EventRow
              key={e.id}
              time={e.time}
              label={i % 2 === 0 ? "Celebration" : "Editorial Gathering"}
              title={e.title ?? "Acara"}
              venue={e.location}
              mapUrl={e.locationMap}
              date={e.date}
              tag={i % 2 === 0 ? "Family & Intimate" : "All Invited Guests"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventRow({
  time,
  label,
  title,
  venue,
  mapUrl,
  date,
  tag,
}: {
  time?: string;
  label: string;
  title: string;
  venue?: string;
  mapUrl?: string;
  date?: string;
  tag?: string;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-6 border border-[#111111]/10 bg-[#F9F8F3] p-8 transition-all hover:border-[#111111] md:grid-cols-12">
      <div className="md:col-span-3">
        <span className="font-[family-name:var(--font-display)] text-3xl italic md:text-4xl">
          {time ?? "—"}
        </span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[#66635F]">
          {label}
        </span>
      </div>
      <div className="space-y-2 md:col-span-6">
        <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wider">
          {title}
        </h3>
        {venue && (
          <p className="flex items-start gap-1.5 text-xs text-[#66635F]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {venue}
          </p>
        )}
        {date && (
          <p className="text-xs text-[#111111]/80">{formatDate(date)}</p>
        )}
      </div>
      <div className="flex flex-col items-start gap-3 text-left md:col-span-3 md:items-end md:text-right">
        {tag && (
          <span className="inline-block bg-[#111111] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[#F9F8F3]">
            {tag}
          </span>
        )}
        {date && (
          <a
            href={googleCalendarUrl({ title, date, time, location: venue })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#F9F8F3] transition hover:opacity-80"
            style={{ backgroundColor: VOGUE.charcoal }}
          >
            Simpan di Google Calendar
          </a>
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#111111] transition hover:opacity-70"
            style={{ border: "1px solid #111111" }}
          >
            <MapPin className="h-3.5 w-3.5" />
            Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

/* Tombol gcal bergaya editorial — URL dibangun dari widget bersama */

/* ------------------------------------------------------------------ */
/* Galeri lookbook + lightbox                                          */
/* ------------------------------------------------------------------ */

function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="bg-[#111111] py-24 text-[#F9F8F3]">
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
            Lookbook
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic md:text-7xl">
            Editorial Gallery
          </h2>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#66635F]">
            Captured Moments
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
          {gallery.slice(0, 5).map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.url)}
              className={`group relative cursor-pointer overflow-hidden border border-[#66635F]/30 ${
                i === 0
                  ? "aspect-[4/5] md:col-span-7"
                  : i === 1
                    ? "aspect-[16/10] md:col-span-5"
                    : i === 2
                      ? "aspect-[4/3] md:col-span-5"
                      : i === 3
                        ? "aspect-[3/4] md:col-span-4"
                        : "aspect-[16/9] md:col-span-8"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
                className={`h-full w-full object-cover ${GRAY}`}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="border border-[#F9F8F3] px-4 py-2 text-[11px] uppercase tracking-[0.2em]">
                  View High Res
                </span>
              </div>
              {item.caption && (
                <div className="absolute bottom-3 left-3 bg-[#111111]/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">
                  {item.caption}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111111]/95 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl border border-[#66635F]/40 bg-[#111111] p-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-full border border-[#66635F]/40 bg-[#111111] p-2 text-[#F9F8F3] transition-colors hover:bg-[#F9F8F3] hover:text-[#111111]"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected} alt="Foto diperbesar" className="max-h-[85vh] w-full object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado digital — "Digital Gift Envelope"                              */
/* ------------------------------------------------------------------ */

function GiftsSection({
  gifts,
}: {
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  return (
    <section className="border-t border-[#DCD8CE] bg-[#EFECE6] py-24">
      <div className="mx-auto max-w-5xl px-6 text-center md:px-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
          Wedding Registry
        </span>
        <h2 className="mb-4 mt-1 font-[family-name:var(--font-display)] text-4xl italic md:text-6xl">
          Digital Gift Envelope
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-xs leading-relaxed text-[#66635F]">
          Doa restu Anda adalah karunia terindah. Namun apabila Anda hendak
          memberikan tanda kasih, Anda dapat mengirimkan perhatian melalui
          rekening di bawah ini.
        </p>

        <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-2">
          {gifts.map((g) => (
            <div key={g.id} className="relative space-y-4 border border-[#111111]/20 bg-[#F9F8F3] p-8">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                  <Landmark className="h-5 w-5 text-[#66635F]" />
                  {g.provider}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#66635F]">
                  {g.name || g.provider}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase text-[#66635F]">Nomor Rekening</p>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wider">
                  {g.accountNumber}
                </p>
                {g.holderName && (
                  <p className="mt-1 text-xs text-[#66635F]">a.n. {g.holderName}</p>
                )}
              </div>
              <CopyButton text={g.accountNumber} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP — section charcoal                                             */
/* ------------------------------------------------------------------ */

function RsvpSection({
  invitationId,
  guestName,
}: {
  invitationId: string;
  guestName?: string;
}) {
  return (
    <section className="bg-[#111111] py-24 text-[#F9F8F3]">
      <div className="mx-auto max-w-3xl space-y-8 px-6 text-center">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
            Confirmation
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl italic md:text-6xl">
            RSVP Attendance
          </h2>
          <p className="mt-2 text-xs text-[#66635F]">
            Mohon konfirmasi kehadiran Anda sebelum hari pernikahan.
          </p>
        </div>

        <div className="border border-[#66635F]/30 bg-[#F9F8F3]/5 p-8 text-left">
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass="bg-[#111111] hover:bg-[#66635F] border border-[#F9F8F3]/40"
            borderClass="border-[#66635F]/40 bg-white focus:border-[#111111] focus:ring-[#DCD8CE]"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ucapan — "Editor's Desk / Guestbook"                                */
/* ------------------------------------------------------------------ */

function Wishes({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section className="border-t border-[#DCD8CE] bg-[#F9F8F3] py-24">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-12 md:px-16">
        {/* Kiri: form ucapan */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
              Editor&apos;s Desk
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl italic md:text-5xl">
              Kirim Ucapan &amp; Doa
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#66635F]">
              Tuliskan ucapan dan doa terbaik Anda untuk kedua mempelai — akan
              tampil sebagai kutipan istimewa di buku tamu editorial ini.
            </p>
          </div>

          <div className="border border-[#111111]/20 bg-[#EFECE6] p-6">
            <WishForm
              invitationId={invitationId}
              accentClass="bg-[#111111] text-[#F9F8F3] hover:bg-[#66635F]"
              borderClass="border-[#111111]/20 bg-[#F9F8F3] focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Kanan: daftar ucapan */}
        <div className="space-y-6 lg:col-span-7">
          <div className="flex items-end justify-between border-b border-[#111111]/20 pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
                Guestbook
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl italic">
                Messages &amp; Toasts
              </h3>
            </div>
            <span className="text-xs text-[#66635F]">
              {(wishes?.length ?? 0)} Editorial Quotes
            </span>
          </div>

          <div className="space-y-6">
            <WishList
              wishes={wishes ?? []}
              cardClass="border-[#111111]/20 bg-[#F9F8F3] border-l-2 border-l-[#111111] rounded-none"
              nameClass="text-[#111111]"
              avatarClass="bg-[#111111] text-[#F9F8F3]"
              emptyClass="text-[#66635F]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer — masthead penutup                                           */
/* ------------------------------------------------------------------ */

function Footer({
  groomNick,
  brideNick,
}: {
  groomNick?: string;
  brideNick?: string;
}) {
  return (
    <footer className="space-y-8 border-t border-[#111111]/20 bg-[#F9F8F3] px-6 py-20 text-center text-[#111111]">
      <div className="space-y-2">
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          MEDUTA
        </span>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#66635F]">
          Special Wedding Editorial Issue — {new Date().getFullYear()}
        </p>
      </div>

      <div className="mx-auto max-w-md font-[family-name:var(--font-serif-elegant)] text-2xl italic text-[#66635F]">
        &ldquo;Love is not about looking at each other, but looking together in
        the same direction.&rdquo;
      </div>

      <p className="font-[family-name:var(--font-display)] text-2xl italic">
        {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
      </p>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-[#111111]/10 pt-8 text-[9px] uppercase tracking-[0.2em] text-[#66635F] sm:flex-row">
        <span>© {new Date().getFullYear()} Meduta</span>
        <span>Designed in Haute-Couture Editorial Style</span>
      </div>
    </footer>
  );
}
