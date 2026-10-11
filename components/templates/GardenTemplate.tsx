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
 * Garden Royale — "Royal Garden Stationery"
 * Identitas visual: taman kerajaan pada kertas ivory champagne.
 * Bingkai bunga asli (bukan CSS): arch karangan DECOR-4 menggantung di cover,
 * wreath mawar DECOR-10 membingkai foto mempelai, ampersand mawar DECOR-12,
 * gazebo DECOR-5 di lokasi, line-art daun sebagai pembatas section,
 * merpati & cincin emas (dekor16) menutup undangan di footer.
 * Palet: ivory champagne · hijau botani · rose · emas.
 */

const SB = "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates";

// Aset galeri admin (dipetakan dari contact sheet)
const A = {
  flowerArch: `${SB}/decor/8c13ef4c-df36-40f8-80a8-ea81de914625.png`, // DECOR 4 — karangan arch pink
  wreathRose: `${SB}/decor/e245bc91-8328-44ad-95a2-004f2e3cdef2.png`, // DECOR 10 — wreath mawar bulat
  ampersand: `${SB}/decor/92828518-7cdc-42dd-a263-1ea2efc241e9.png`, // DECOR 12 — & mawar pink
  goldenArch: `${SB}/decor/2d8dc214-4ac8-4272-9cae-443094fabb7a.png`, // DECOR 7 — arch emas
  gazebo: `${SB}/decor/f1bf932b-7cba-46ce-83e4-7120e8fd0fed.png`, // DECOR 5 — gazebo lentera
  doves: `${SB}/image/d3bb621e-dc81-4956-bfcb-145bc8f5189b.png`, // dekor16 — merpati + cincin emas
  leafLine: `${SB}/decor/6022e994-726a-4530-978f-474acfc54369.png`, // DECOR 6 — line-art daun emas
  monstera: `${SB}/decor/bbeb0c77-ce4f-4ff7-aa42-492c0b13361e.png`, // DECOR 13 — monstera hijau
  theWeddingOf: `${SB}/image/977edb69-b554-4cb7-81ec-92edf71122e9.png`, // dekor3 — lettering "THE WEDDING OF"
  lavender: `${SB}/decor/8c13ef4c-df36-40f8-80a8-ea81de914625.png`, // cadangan
  purpleBg: `${SB}/background/45d062d5-746e-4476-8891-862c0d6ae302.jpg`, // foto bunga ungu
  leavesGreen: `${SB}/decor/22dd1e42-c9e8-4065-8983-386f39e947c5.png`, // DECOR 14 — ranting daun hijau
  goldWreath: `${SB}/decor/47f5cbf3-3bdf-4e4d-90d6-f67619be7da0.png`, // DECOR 11 — wreath emas tipis
  happyBanner: `${SB}/image/6c7dd5a1-e24f-4ab5-adb2-43c22bf49ff3.png`, // dekor17 — pita happy wedding
} as const;

const ACCENT =
  "bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 shadow-lg shadow-emerald-700/25";
const BORDER =
  "border-emerald-200 bg-white/70 focus:border-emerald-600 focus:ring-emerald-100";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function GardenTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <GardenShell
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

function GardenShell({
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

  // Prioritas background: pilihan user > admin (template) > bawaan (bunga ungu)
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
    <div className="relative flex min-h-screen flex-col items-center bg-[#faf6ee] font-[family-name:var(--font-serif-elegant)] text-zinc-800">
      {/* Nuansa taman: gradasi hijau-rose sangat lembut */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_10%_5%,rgba(16,94,66,0.06),transparent_45%),radial-gradient(ellipse_at_90%_90%,rgba(190,24,93,0.05),transparent_45%)]" />

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
          buttonClassName="bg-emerald-800 text-amber-100 border border-amber-300/50"
          playingIconClassName="h-5 w-5 animate-pulse text-amber-300"
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf6ee] px-6 text-center">
      <RingIcon className="h-8 w-8 text-emerald-700" />
      <p className="text-lg font-medium text-zinc-800">Undangan belum dipublikasikan</p>
      <p className="text-sm text-zinc-500">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

/** Pembatas section: garis emas + line-art daun di tengah */
function LeafDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 py-2" aria-hidden="true">
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-amber-500/60" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={A.leafLine}
        alt=""
        className={`h-9 w-auto ${flip ? "-scale-x-100" : ""}`}
      />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-amber-500/60" />
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">
        {title}
      </h2>
      <LeafDivider />
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
    <header className="animate-fade-up relative mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-24 text-center">
      {/* Latar: foto bunga ungu (bawaan) atau background kustom, dilapisi ivory tipis agar teks terbaca */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgUrl || A.purpleBg})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,246,238,0.82),rgba(250,246,238,0.55)_45%,rgba(250,246,238,0.86))]" />

      {/* Bingkai emas ganda di seluruh cover */}
      <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-amber-500/40" />
      <div className="pointer-events-none absolute inset-5 rounded-[1.7rem] border border-amber-200/50" />

      {/* Garland bunga FULL kiri-kanan — aset di-mirror-extend agar rimbun
          sampai kedua tepi, dipasang dengan rasio asli (h-auto) sehingga
          TIDAK ADA bagian yang terpotong */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/flower-garland-wide.webp"
        alt=""
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-auto w-full drop-shadow-[0_10px_30px_rgba(190,24,93,0.25)]"
      />

      {/* Monstera menyeimbang pojok bawah */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={A.monstera}
        alt=""
        className="pointer-events-none absolute -bottom-4 -left-5 z-0 w-24 rotate-12 opacity-90 sm:w-32"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={A.leavesGreen}
        alt=""
        className="pointer-events-none absolute -right-5 bottom-8 z-0 w-20 -scale-x-100 opacity-90 sm:w-28"
      />

      {/* Lettering "The Wedding Of" (aset) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={A.theWeddingOf}
        alt="The Wedding Of"
        className="relative z-10 mx-auto mb-2 w-40 mix-blend-multiply sm:w-48"
      />

      {/* Nama mempelai dengan ampersand mawar */}
      <h1 className="relative z-10 mt-2 font-[family-name:var(--font-display)] text-5xl font-semibold leading-tight text-zinc-900 sm:text-6xl">
        {groomNick ?? "Pria"}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={A.ampersand}
          alt="&"
          className="mx-2 inline-block h-14 w-auto align-middle drop-shadow-[0_4px_14px_rgba(190,24,93,0.35)] sm:h-16"
        />
        {brideNick ?? "Wanita"}
      </h1>

      {eventDate && (
        <p className="relative z-10 mt-5 max-w-[260px] text-sm font-medium leading-relaxed tracking-[0.25em] text-emerald-800">
          {formatDate(eventDate)}
        </p>
      )}

      {guestName && (
        <div className="relative z-10 mx-auto mt-9 max-w-sm rounded-3xl border border-amber-500/30 bg-white/75 p-5 shadow-xl shadow-emerald-900/10 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-700">
            Kepada Yth.
          </p>
          <p className="mt-1 font-[family-name:var(--font-script)] text-3xl text-zinc-900">
            {guestName}
          </p>
        </div>
      )}
    </header>
  );

  if (locked) {
    return (
      <InvitationGate
        theme="garden"
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

      {/* Gazebo lentera sebagai ilustrasi pembuka section */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={A.gazebo}
        alt=""
        className="mx-auto mt-8 w-44 drop-shadow-[0_10px_25px_rgba(16,94,66,0.18)] sm:w-52"
      />

      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
        Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami.
      </p>

      <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-3">
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
    <div className="group flex flex-col items-center gap-3 rounded-2xl border border-amber-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-700/10">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700 transition-colors group-hover:from-emerald-700 group-hover:to-emerald-600 group-hover:text-white">
        {icon}
      </span>
      <span className="text-sm font-medium leading-snug text-zinc-700">{label}</span>
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

      <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-6">
        <PersonCard person={groom} role="Mempelai Pria" />
        <PersonCard person={bride} role="Mempelai Wanita" />
      </div>

      <div className="relative mx-auto mt-12 max-w-xl">
        {/* Wreath emas tipis membingkai kutipan */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={A.goldWreath}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 opacity-60"
        />
        <div className="relative m-8 rounded-2xl bg-transparent p-6">
          <Quote className="mx-auto mb-3 h-5 w-5 text-amber-600" />
          <p className="text-sm italic leading-relaxed text-zinc-600">
            “Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
            pasangan hidup dari jenismu sendiri...”
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-700">
            (QS Ar-Rum: 21)
          </p>
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
    <div className="group relative">
      {/* Foto bulat dengan cincin emas ganda — bersih, wajah sepenuhnya terlihat */}
      <div className="relative mx-auto h-48 w-48 rounded-full bg-gradient-to-br from-amber-300 via-amber-100 to-amber-300 p-[3px] shadow-lg shadow-amber-600/20 transition-transform duration-300 group-hover:scale-[1.03]">
        <div className="h-full w-full rounded-full bg-white p-1.5">
          {person?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={person.name ?? role}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-rose-50 text-emerald-300">
              <Heart className="h-12 w-12" />
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
        {role}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-zinc-900">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="mt-2 text-sm text-zinc-500">Putra/Putri dari {person.parentName}</p>
      )}
      {person?.bio && (
        <p className="mx-auto mt-3 max-w-xs border-t border-amber-100 pt-3 text-sm italic text-zinc-600">
          &ldquo;{person.bio}&rdquo;
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

      <div className="mx-auto mt-10 max-w-xl space-y-8">
        {events.map((e) => (
          <div
            key={e.id}
            className="group relative overflow-hidden rounded-3xl border border-amber-200/70 bg-white/85 p-7 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-700/10"
          >
            {/* Aksen garis emas-botani di tepi atas kartu — bersih tanpa ornamen mengganggu */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400/70 via-emerald-500/50 to-amber-400/70" />
            <div className="relative text-center">
              <span className="inline-block rounded-full bg-gradient-to-r from-emerald-700 to-emerald-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                {formatDate(e.date)}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-900">
                {e.title ?? "Acara"}
              </h3>
              {e.time && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-zinc-600">
                  <Clock className="h-4 w-4 text-amber-600" /> {formatTime(e.time)}
                </p>
              )}
              {e.location && (
                <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-zinc-600">
                  <MapPin className="h-4 w-4 text-amber-600" /> {e.location}
                </p>
              )}
              {e.locationMap && (
                <a
                  href={e.locationMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
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
      <div className="relative mx-auto mt-6 max-w-lg rounded-3xl border border-amber-200/70 bg-white/85 p-8 shadow-sm backdrop-blur-sm">
        <Quote className="mx-auto mb-4 h-6 w-6 text-amber-600" />
        <p className="whitespace-pre-line font-[family-name:var(--font-display)] text-lg leading-relaxed text-zinc-700">
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
          <div key={item.id} className="relative pl-12">
            {index < story.length - 1 && (
              <span className="absolute left-[11px] top-7 h-full w-px bg-gradient-to-b from-amber-500/60 via-emerald-400/40 to-transparent" />
            )}
            {/* Marker daun line-art kecil */}
            <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={A.leafLine} alt="" className="h-6 w-auto" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-600">
              {item.date ? formatDate(item.date) : "Momen"}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-900">
              {item.title ?? ""}
            </h3>
            {item.description && (
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
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

      <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-5">
        {gallery.map((item) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border-[3px] border-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-800/15"
            style={{ boxShadow: "0 0 0 1px rgba(245,158,11,0.45), 0 8px 24px rgba(6,78,59,0.10)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.caption ?? "Foto galeri"}
              className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {item.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950/70 to-transparent px-4 py-3 text-left text-xs font-medium italic text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
        Doa restu Anda adalah hadiah terbaik. Jika ingin memberi tanda kasih,
        Anda dapat mengirimkannya melalui salah satu rekening berikut.
      </p>

      <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
        {gifts.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl border border-amber-200/70 bg-white/85 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-700/10"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <p className="font-[family-name:var(--font-display)] font-semibold text-zinc-900">
                  {g.provider}
                </p>
                {g.name && <p className="text-xs text-zinc-500">{g.name}</p>}
              </div>
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-widest text-zinc-400">
              No. Rekening
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-mono text-lg font-semibold tracking-wide text-zinc-900">
                {g.accountNumber}
              </p>
              <CopyButton text={g.accountNumber} />
            </div>
            {g.holderName && <p className="mt-2 text-sm text-zinc-600">a.n. {g.holderName}</p>}
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
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
        Mohon konfirmasi kehadiran Anda agar kami dapat menyiapkan segala sesuatunya.
      </p>
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-amber-200/70 bg-white/85 p-7 text-left shadow-lg shadow-emerald-700/5 backdrop-blur-sm">
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
          cardClass="border-amber-200/70 bg-white/85"
          nameClass="text-emerald-800"
          avatarClass="bg-gradient-to-br from-emerald-700 to-emerald-600 text-amber-50"
          emptyClass="text-zinc-400"
        />
      </div>

      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-amber-200/70 bg-white/85 p-7 text-left shadow-sm backdrop-blur-sm">
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
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-emerald-900 to-[#043527] px-6 pb-44 pt-20 text-center text-emerald-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15),transparent_55%)]" />

      {/* Garland penutup — cermin vertikal dari garland cover, menutup
          undangan secara simetris (atas: menggantung, bawah: tumbuh naik).
          Rasio asli (h-auto) sehingga tidak ada bagian terpotong. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design/flower-garland-wide.webp"
        alt=""
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto h-auto w-full max-w-3xl -scale-y-100 drop-shadow-[0_-10px_30px_rgba(190,24,93,0.3)]"
      />

      <div className="relative">
        {/* Merpati & cincin emas (aset) — penutup romantis */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={A.doves}
          alt=""
          className="mx-auto mb-3 w-44 drop-shadow-[0_10px_30px_rgba(245,158,11,0.35)] sm:w-52"
        />

        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-14 bg-gradient-to-r from-transparent to-amber-300/70" />
          <RingIcon className="h-4 w-4 text-amber-300" />
          <span className="h-px w-14 bg-gradient-to-l from-transparent to-amber-300/70" />
        </div>

        <p className="mt-4 font-[family-name:var(--font-display)] text-3xl text-amber-100">
          {groomName ?? "Pria"}{" "}
          <span className="mx-1 inline-block font-[family-name:var(--font-script)] text-3xl text-amber-300">
            &amp;
          </span>{" "}
          {brideName ?? "Wanita"}
        </p>
        <p className="mt-3 text-sm text-emerald-100/80">
          Terima kasih atas doa &amp; kehadiran Anda
        </p>
        <p className="mt-8 text-xs tracking-[0.3em] text-emerald-200/50">
          © {new Date().getFullYear()} MEDUTA
        </p>
      </div>
    </footer>
  );
}
