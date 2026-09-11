"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Clock, Heart, Quote, Landmark, Sparkles, ExternalLink } from "lucide-react";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import {
  formatDate,
  formatTime,
  type TemplateProps,
} from "./types";

const ACCENT = "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-600/25";
const BORDER = "border-emerald-200 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-100";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function ClassicTemplate(props: TemplateProps) {
  // Wrapper client: kelola status gerbang "Buka Undangan" + musik latar
  const [gateOpen, setGateOpen] = useState(false);
  const music = useBackgroundMusic(props.data.musicUrl);
  return (
    <ClassicShell
      {...props}
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

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#f4f1e8] font-[family-name:var(--font-serif-elegant)] text-zinc-900">
      {/* Nuansa emas lembut di latar */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,140,60,0.10),transparent_55%)]" />

      <Cover
        eventName={data.eventName ?? "Undangan Pernikahan"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data.eventDate}
        guestName={guestName}
        locked={!gateOpen}
        onOpen={onGateOpen}
      />

      {groom?.name || bride?.name ? (
        <Couple
          groom={groom}
          bride={bride}
          eventName={data.eventName ?? "Pernikahan"}
        />
      ) : null}

      <MainEvent
        eventDate={data.eventDate}
        eventTime={data.eventTime}
        venueName={data.venueName}
        location={data.location}
        locationMap={data.locationMap}
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
        wishes={wishes}
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

function OrnamentDivider({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${light ? "text-amber-200/90" : "text-amber-500/80"}`}>
      <span className={`h-px w-14 ${light ? "bg-gradient-to-r from-transparent to-amber-200/70" : "bg-gradient-to-r from-transparent to-amber-500/60"}`} />
      <Sparkles className="h-4 w-4" />
      <span className={`h-px w-14 ${light ? "bg-gradient-to-l from-transparent to-amber-200/70" : "bg-gradient-to-l from-transparent to-amber-500/60"}`} />
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
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  locked?: boolean;
  onOpen?: () => void;
}) {
  const cover = (
    <header
      className="animate-fade-up relative flex min-h-[92vh] w-full max-w-3xl flex-col items-center justify-center bg-cover bg-center px-6 text-center text-white"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(8,52,38,0.55), rgba(6,38,28,0.72)), url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70)",
      }}
    >
      {/* Bingkai emas ganda */}
      <div className="pointer-events-none absolute inset-4 rounded-[2rem] border border-amber-200/40" />
      <div className="pointer-events-none absolute inset-6 rounded-[1.6rem] border border-amber-100/20" />

      <p className="animate-fade-up-delay-1 mb-4 text-xs uppercase tracking-[0.4em] text-amber-200">
        The Wedding Of
      </p>

      <h1 className="animate-fade-up-delay-2 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight sm:text-5xl">
        {groomNick ?? "Pria"} <span className="text-gold-shimmer mx-2 inline-block font-[family-name:var(--font-script)] text-4xl align-middle font-normal sm:text-5xl">&amp;</span>{" "}
        {brideNick ?? "Wanita"}
      </h1>

      <div className="animate-fade-up-delay-3 mt-6">
        <OrnamentDivider light />
      </div>

      {eventDate && (
        <p className="animate-fade-up-delay-3 mt-5 max-w-[260px] text-sm leading-relaxed tracking-[0.2em] text-emerald-50/90">
          {formatDate(eventDate)}
        </p>
      )}

      {guestName && (
        <div className="animate-fade-up-delay-4 mt-10 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-100/80">
            Kepada Yth.
          </p>
          <p className="mt-1 font-[family-name:var(--font-script)] text-3xl text-white">
            {guestName}
          </p>
        </div>
      )}

      <p className="animate-fade-up-delay-4 mt-6 text-sm text-emerald-100/70">{eventName}</p>

      <div className="animate-fade-up-delay-4 mt-8 flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/50 text-amber-200 animate-float-slow">
        <Heart className="h-4 w-4" />
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
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-emerald-700">Akad &amp; Resepsi</p>
      <h2 className="font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">
        Merupakan Suatu <span className="text-gold-shimmer italic">Kehormatan</span>
      </h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
        Bagi kami, kehadiran dan doa restu Anda adalah kebahagiaan yang tak ternilai.
      </p>

      <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-3">
        {eventDate && (
          <InfoCard
            icon={<CalendarDays className="h-5 w-5" />}
            label={formatDate(eventDate)}
          />
        )}
        {eventTime && (
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            label={formatTime(eventTime)}
          />
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
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-emerald-600"
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
    <div className="group flex flex-col items-center gap-3 rounded-2xl border border-amber-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/10">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-700 transition-colors group-hover:from-emerald-600 group-hover:to-emerald-500 group-hover:text-white">
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
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">
        {eventName}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Mempelai</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <PersonCard person={groom} role="Mempelai Pria" />
        <PersonCard person={bride} role="Mempelai Wanita" />
      </div>

      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-amber-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <Quote className="mx-auto mb-3 h-5 w-5 text-amber-500" />
        <p className="text-sm italic leading-relaxed text-zinc-600">
          “Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
          pasangan hidup dari jenismu sendiri...”
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">
          (QS Ar-Rum: 21)
        </p>
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
    <div className="group relative overflow-hidden rounded-3xl border border-amber-200/60 bg-white/90 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-600/10">
      {/* Sudut dekoratif emas */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-amber-100/80 to-transparent transition-transform duration-500 group-hover:scale-150" />

      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={person.name ?? role}
          className="relative mx-auto mb-5 h-40 w-40 rounded-full object-cover ring-4 ring-amber-200/70 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="relative mx-auto mb-5 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-300 ring-4 ring-amber-200/50">
          <Heart className="h-12 w-12" />
        </div>
      )}

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">{role}</p>
      <h3 className="relative mt-2 font-[family-name:var(--font-display)] text-2xl text-zinc-900">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="relative mt-2 text-sm text-zinc-500">
          Putra/Putri dari {person.parentName}
        </p>
      )}
      {person?.bio && (
        <p className="relative mt-3 border-t border-amber-100 pt-3 text-sm italic text-zinc-600">
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
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Agenda</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Rangkaian Acara</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>

      <div className="mx-auto mt-10 max-w-xl space-y-5">
        {events.map((e) => (
          <div
            key={e.id}
            className="group relative overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/10"
          >
            <div className="absolute top-0 right-0 h-16 w-16 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200/50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative">
              <span className="inline-block rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                {formatDate(e.date)}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-900">
                {e.title ?? "Acara"}
              </h3>
              {e.time && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-600">
                  <Clock className="h-4 w-4 text-amber-600" /> {formatTime(e.time)}
                </p>
              )}
              {e.location && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-600">
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
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Ucapan &amp; Doa</p>
      <div className="relative mx-auto mt-6 max-w-lg rounded-3xl border border-amber-200/60 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <Quote className="mx-auto mb-4 h-6 w-6 text-amber-500" />
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
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Cerita Kami</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Perjalanan Cinta</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>

      <div className="mx-auto mt-12 max-w-xl space-y-10 text-left">
        {story.map((item, index) => (
          <div key={item.id} className="relative pl-10">
            {index < story.length - 1 && (
              <span className="absolute left-[9px] top-7 h-full w-px bg-gradient-to-b from-amber-400/70 to-transparent" />
            )}
            <span className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-400/80 bg-white">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500" />
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
    <section id="galeri" className="w-full max-w-3xl bg-gradient-to-b from-[#efe9d8] to-[#f4f1e8] px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Galeri Foto</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Momen Berharga</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>

      <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
        {gallery.map((item) => (
          <figure
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-600/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.caption ?? "Foto galeri"}
              className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {item.caption && (
              <figcaption className="px-4 py-3 text-left text-sm italic text-zinc-600">
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
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Tanda Kasih</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Kado Nikah</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
        Doa restu Anda adalah hadiah terbaik. Jika ingin memberi tanda kasih, Anda dapat
        mengirimkannya melalui salah satu rekening berikut.
      </p>

      <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
        {gifts.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl border border-amber-200/60 bg-white/90 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/10"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-700">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <p className="font-[family-name:var(--font-display)] font-semibold text-zinc-900">{g.provider}</p>
                {g.name && <p className="text-xs text-zinc-500">{g.name}</p>}
              </div>
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-widest text-zinc-400">No. Rekening</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-mono text-lg font-semibold tracking-wide text-zinc-900">
                {g.accountNumber}
              </p>
              <CopyButton text={g.accountNumber} />
            </div>
            {g.holderName && (
              <p className="mt-2 text-sm text-zinc-600">a.n. {g.holderName}</p>
            )}
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
    <section id="rsvp" className="w-full max-w-3xl bg-gradient-to-b from-[#efe9d8] to-[#f4f1e8] px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Kehadiran</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Konfirmasi Kehadiran</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
        Mohon konfirmasi kehadiran Anda agar kami dapat menyiapkan segala sesuatunya.
      </p>
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-amber-200/60 bg-white/90 p-7 text-left shadow-lg shadow-emerald-600/5 backdrop-blur-sm">
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
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Wedding Wall</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">Kirim Ucapan &amp; Doa</h2>
      <div className="mt-4">
        <OrnamentDivider />
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <WishList
          wishes={wishes ?? []}
          cardClass="border-amber-200/60 bg-white/90"
          nameClass="text-emerald-800"
          avatarClass="bg-gradient-to-br from-emerald-600 to-emerald-500 text-amber-50"
          emptyClass="text-zinc-400"
        />
      </div>

      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-amber-200/60 bg-white/90 p-7 text-left shadow-sm backdrop-blur-sm">
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
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-emerald-900 to-[#06281e] px-6 py-16 text-center text-emerald-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,140,60,0.18),transparent_60%)]" />
      <div className="relative">
        <div className="mb-6 flex justify-center">
          <OrnamentDivider light />
        </div>
        <p className="font-[family-name:var(--font-display)] text-3xl text-amber-100">
          {groomName ?? "Pria"} <span className="mx-1 inline-block font-[family-name:var(--font-script)] text-3xl text-amber-300">&amp;</span> {brideName ?? "Wanita"}
        </p>
        <p className="mt-3 text-sm text-emerald-100/80">Terima kasih atas doa &amp; kehadiran Anda</p>
        <p className="mt-8 text-xs tracking-widest text-emerald-200/50">© {new Date().getFullYear()} MEDUTA</p>
      </div>
    </footer>
  );
}
