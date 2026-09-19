"use client";

import { useState } from "react";
import { MapPin, Clock, CalendarDays, Heart, ExternalLink } from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

const ACCENT =
  "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 shadow-lg shadow-rose-500/25";
const BORDER =
  "border-rose-200 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function FloralTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <FloralShell
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

function FloralShell({
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
  if (!isPublished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fdf4f6] px-6 text-center">
        <p className="text-lg font-medium text-zinc-800">Undangan belum dipublikasikan</p>
        <p className="text-sm text-zinc-500">
          Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
        </p>
      </div>
    );
  }

  const groom = data.groom;
  const bride = data.bride;
 // Info akad sudah tampil di section "Hari Bahagia" — entri "Akad" pada
  // Rangkaian Acara disembunyikan agar tidak dobel (lihat splitAgenda).
  const events = splitAgenda(data.events, {}).additional;
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#fdf4f6] font-[family-name:var(--font-serif-elegant)] text-zinc-900">
      {/* Kelopak melayang lembut di latar */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(251,113,133,0.08),transparent_50%),radial-gradient(ellipse_at_85%_85%,rgba(244,114,182,0.10),transparent_50%)]" />

      <Cover
        eventName={data.eventName ?? "The Wedding Of"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data.eventDate}
        guestName={guestName}
        locked={!gateOpen}
        onOpen={onGateOpen}
        bgUrl={bgUrl}
        gatePhoto={gatePhoto}
      />

      <div className="w-full max-w-3xl space-y-16 px-6 py-16">
        {groom?.name || bride?.name ? (
          <section className="text-center">
            <Heading eyebrow="Bride & Groom" title="Kedua Mempelai" />
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Person person={groom} role="Mempelai Pria" />
              <Person person={bride} role="Mempelai Wanita" />
            </div>
            <p className="mx-auto mt-10 max-w-md text-sm italic leading-relaxed text-zinc-500">
              “Dan Kami ciptakan kamu berpasang-pasangan.” (QS An-Naba’: 8)
            </p>
          </section>
        ) : null}

        <section className="text-center">
          <Heading eyebrow="The Moment" title="Hari Bahagia" />
          <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            {data.eventDate && (
              <FloralCard icon={CalendarDays} label={formatDate(data.eventDate)} />
            )}
            {data.eventTime && <FloralCard icon={Clock} label={formatTime(data.eventTime)} />}
            {(data.venueName || data.location) && (
              <FloralCard
                icon={MapPin}
                label={[data.venueName, data.location].filter(Boolean).join(", ")}
              />
            )}
          </div>
          {data.locationMap && (
            <a
              href={data.locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:shadow-xl hover:shadow-rose-500/30"
            >
              <MapPin className="h-4 w-4" /> Lihat Lokasi
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}
        </section>

        {story.length > 0 ? (
          <section className="text-center">
            <Heading eyebrow="Our Story" title="Cerita Kami" />
            <div className="mx-auto mt-10 max-w-xl space-y-8 text-left">
              {story.map((item, index) => (
                <div key={item.id} className="relative pl-9">
                  {index < story.length - 1 && (
                    <span className="absolute left-[8px] top-6 h-full w-px bg-gradient-to-b from-pink-400 to-rose-200/40" />
                  )}
                  <span className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm">
                    <Heart className="h-2.5 w-2.5 fill-white text-white" />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-pink-500">
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
        ) : null}

        {gallery.length > 0 ? (
          <section id="galeri" className="text-center">
            <Heading eyebrow="Gallery" title="Galeri Momen" />
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4">
              {gallery.map((item) => (
                <figure
                  key={item.id}
                  className="group relative overflow-hidden rounded-3xl border-2 border-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? "Foto galeri"}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rose-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {item.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 text-left text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section id="rsvp" className="text-center">
          <Heading eyebrow="RSVP" title="Konfirmasi Kehadiran" />
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
            Mohon konfirmasi kehadiran Anda untuk kelancaran acara kami.
          </p>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-rose-100 bg-white/90 p-7 shadow-xl shadow-rose-500/10 backdrop-blur-sm">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
        </section>

        {events.length > 0 ? (
          <section className="text-center">
            <Heading eyebrow="Agenda" title="Rangkaian Acara" />
            <div className="mx-auto mt-10 max-w-xl space-y-5">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="group relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg hover:shadow-rose-500/15"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br from-rose-100 to-pink-200/60 transition-transform duration-500 group-hover:scale-150" />
                  <div className="relative">
                    <span className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                      {formatDate(e.date)}
                    </span>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium text-zinc-900">
                      {e.title ?? "Acara"}
                    </h3>
                    {e.time && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-600">
                        <Clock className="h-4 w-4 text-pink-500" /> {formatTime(e.time)}
                      </p>
                    )}
                    {e.location && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-600">
                        <MapPin className="h-4 w-4 text-pink-500" /> {e.location}
                      </p>
                    )}
                    {e.locationMap && (
                      <a
                        href={e.locationMap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-700 hover:underline"
                      >
                        Lihat Lokasi <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {gifts.length > 0 ? (
          <section id="kado" className="text-center">
            <Heading eyebrow="Wedding Gift" title="Tanda Kasih" />
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
              Doa restu Anda adalah hadiah terbaik. Jika ingin memberi tanda kasih, silakan melalui
              rekening berikut.
            </p>
            <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className="rounded-3xl border border-rose-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg hover:shadow-rose-500/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-200/70 text-rose-600">
                      <RingIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] font-semibold text-zinc-900">
                        {g.provider}
                      </p>
                      {g.name && <p className="text-xs text-zinc-500">{g.name}</p>}
                    </div>
                  </div>
                  <p className="mt-4 font-mono text-lg font-semibold tracking-wide text-zinc-900">
                    {g.accountNumber}
                  </p>
                  {g.holderName && (
                    <p className="mt-1 text-xs text-zinc-500">a.n. {g.holderName}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.customMessage ? (
          <section className="text-center">
            <Heading eyebrow="Wishes" title="Pesan Untuk Tamu" />
            <div className="relative mx-auto mt-8 max-w-lg rounded-3xl border border-pink-100 bg-gradient-to-br from-white to-rose-50/70 p-8 shadow-sm">
              <RingIcon className="mx-auto mb-3 h-6 w-6 text-pink-400" />
              <p className="whitespace-pre-line leading-relaxed text-zinc-600">
                {data.customMessage}
              </p>
            </div>
          </section>
        ) : null}

        <section id="ucapan" className="text-center">
          <Heading eyebrow="Wedding Wall" title="Berikan Ucapan" />
          <div className="mx-auto mt-8 max-w-2xl">
            <WishList
              wishes={wishes ?? []}
              cardClass="border-rose-100 bg-white/90"
              nameClass="text-rose-600"
              avatarClass="bg-gradient-to-br from-rose-400 to-pink-500 text-white"
              emptyClass="text-zinc-400"
            />
          </div>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-rose-100 bg-white/90 p-7 shadow-xl shadow-rose-500/10 backdrop-blur-sm">
            <WishForm invitationId={invitationId} accentClass={ACCENT} borderClass={BORDER} />
          </div>
        </section>
      </div>

      <footer className="w-full overflow-hidden bg-gradient-to-b from-rose-950 via-[#4a0d22] to-[#3d0a1b] px-6 py-16 text-center">
        <div className="pointer-events-none absolute" />
        <div className="relative mx-auto max-w-md px-6">
          <div className="mb-6 flex justify-center">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-rose-300/50" />
            <RingIcon className="mx-3 h-4 w-4 text-rose-300" />
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-rose-300/50" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-3xl text-rose-50">
            {groom?.nickname ?? groom?.name ?? "Pria"}
            <Heart className="mx-2 inline h-5 w-5 animate-pulse fill-pink-400 text-pink-400" />
            {bride?.nickname ?? bride?.name ?? "Wanita"}
          </p>
          <p className="mt-3 text-sm text-rose-200/70">
            Terima kasih atas doa &amp; kehadiran Anda
          </p>
          {data.musicUrl && music ? (
            <MusicFab
              isPlaying={music.isPlaying}
              onToggle={music.toggle}
              buttonClassName="bg-rose-950 text-pink-200 border border-pink-300/30"
              playingIconClassName="h-5 w-5 animate-pulse text-pink-300"
              pausedIconClassName="h-5 w-5 opacity-70"
            />
          ) : null}
          <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-rose-200/40">
            © {new Date().getFullYear()} Meduta
          </p>
        </div>
      </footer>
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
      className="animate-fade-up relative flex min-h-[92vh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden bg-center bg-cover px-6 text-center text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(120,26,60,0.45), rgba(88,14,50,0.65)), url(${bgUrl || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=70"})`,
      }}
    >
      {/* Bingkai halus + ornamen melayang */}
      <div className="pointer-events-none absolute inset-5 rounded-[2.5rem] border border-rose-200/30" />
      <div className="animate-float-slow pointer-events-none absolute left-[8%] top-[14%] text-4xl opacity-40">
        🌸
      </div>
      <div className="animate-float-slower pointer-events-none absolute right-[10%] top-[24%] text-2xl opacity-30">
        🌷
      </div>
      <div className="animate-float-slower pointer-events-none absolute bottom-[16%] left-[14%] text-3xl opacity-30">
        🌹
      </div>

      <div className="relative">
        <p className="animate-fade-up-delay-1 mb-3 text-xs uppercase tracking-[0.4em] text-rose-100">
          {eventName}
        </p>
        <h1 className="animate-fade-up-delay-2 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
          {groomNick ?? "Pria"}{" "}
          <span className="animate-pulse mx-2 inline font-[family-name:var(--font-script)] text-4xl text-pink-200 sm:text-5xl">
            &amp;
          </span>{" "}
          {brideNick ?? "Wanita"}
        </h1>

        <div className="animate-fade-up-delay-3 mt-6 flex items-center justify-center gap-3">
          <span className="hidden h-px w-14 bg-gradient-to-r from-transparent to-rose-200/70 sm:block" />
          <p className="max-w-[240px] text-sm leading-relaxed tracking-[0.2em] text-rose-50">
            {formatDate(eventDate)}
          </p>
          <span className="hidden h-px w-14 bg-gradient-to-l from-transparent to-rose-200/70 sm:block" />
        </div>

        {guestName && (
          <div className="animate-fade-up-delay-4 mx-auto mt-10 max-w-sm rounded-2xl border border-white/25 bg-white/10 p-4 shadow-lg backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.3em] text-rose-100/90">Kepada Yth.</p>
            <p className="mt-1 font-[family-name:var(--font-script)] text-3xl text-white">
              {guestName}
            </p>
          </div>
        )}
      </div>
    </header>
  );

  // Saat gerbang tertutup: konten dikunci + overlay "Buka Undangan" fullscreen
  if (locked) {
    return (
      <InvitationGate
        theme="floral"
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

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-pink-500">{eyebrow}</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zinc-900 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-3 flex items-center justify-center gap-2.5 text-rose-400/80">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-rose-400/60" />
        <RingIcon className="h-3.5 w-3.5" />
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-rose-400/60" />
      </div>
    </div>
  );
}

function FloralCard({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-2.5 rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg hover:shadow-rose-500/15">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-200/70 text-rose-600 transition-colors group-hover:from-rose-500 group-hover:to-pink-500 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-center text-sm font-medium leading-snug text-zinc-700">{label}</span>
    </div>
  );
}

function Person({
  person,
  role,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-rose-100 bg-white/95 p-7 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-xl hover:shadow-rose-500/15">
      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-rose-100/90 to-pink-200/50 transition-transform duration-500 group-hover:scale-150" />

      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={person.name ?? role}
          className="relative mx-auto mb-4 h-36 w-36 rounded-full object-cover ring-4 ring-rose-200/70 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="relative mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-200/70 text-rose-400 ring-4 ring-rose-200/50">
          <Heart className="h-10 w-10" />
        </div>
      )}

      <p className="relative text-[11px] font-bold uppercase tracking-[0.3em] text-pink-500">
        {role}
      </p>
      <h3 className="relative mt-1.5 font-[family-name:var(--font-display)] text-xl text-zinc-900">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="relative mt-1.5 text-sm text-zinc-500">{person.parentName}</p>
      )}
      {person?.bio && (
        <p className="relative mt-2 border-t border-rose-100 pt-2.5 text-sm italic text-zinc-600">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}
    </div>
  );
}
