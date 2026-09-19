"use client";

import { useState } from "react";
import { MapPin, Clock, CalendarDays, Heart, Landmark, Quote, ExternalLink, AtSign } from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";

const ACCENT =
  "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-600/25";
const BORDER =
  "border-violet-200 bg-violet-50/40 focus:border-violet-500 focus:ring-violet-100";

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function MinimalTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <MinimalShell
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

function MinimalShell({
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
        <p className="text-lg font-medium text-zinc-800">Undangan belum dipublikasikan</p>
        <p className="text-sm text-zinc-500">
          Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
        </p>
      </div>
    );
  }

  const groom = data.groom;
  const bride = data.bride;
  // Info akad sudah tampil di section "Save The Date" — entri "Akad" pada
  // Rangkaian Acara disembunyikan agar tidak dobel (lihat splitAgenda).
  const events = splitAgenda(data.events, {}).additional;
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#f7f6fd] font-sans text-zinc-900">
      <Cover
        eventName={data.eventName ?? "The Wedding"}
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
          <Section
            eyebrow="Bride & Groom"
            title={`${groom?.nickname ?? groom?.name ?? "-"} & ${bride?.nickname ?? bride?.name ?? "-"}`}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Photo person={groom} role="Mempelai Pria" />
              <Photo person={bride} role="Mempelai Wanita" />
            </div>
          </Section>
        ) : null}

        {story.length > 0 ? (
          <Section eyebrow="Our Story" title="Cerita Kami">
            <div className="mt-2 space-y-8 border-t border-violet-100 pt-6 text-left">
              {story.map((item, index) => (
                <div key={item.id} className="relative pl-8">
                  {index < story.length - 1 && (
                    <span className="absolute left-[7px] top-6 h-full w-px bg-gradient-to-b from-violet-400 to-fuchsia-300/40" />
                  )}
                  <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 ring-4 ring-violet-100" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-fuchsia-500">
                    {item.date ? formatDate(item.date) : "Momen"}
                  </p>
                  <h3 className="mt-1 font-semibold text-zinc-900">{item.title ?? ""}</h3>
                  {item.description && (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <Section eyebrow="Save The Date" title="Tanggal & Lokasi">
          <div className="space-y-3 border-t border-violet-100 pt-5">
            {data.eventDate && <Row icon={CalendarDays} text={formatDate(data.eventDate)} />}
            {data.eventTime && <Row icon={Clock} text={formatTime(data.eventTime)} />}
            {data.venueName && <Row icon={MapPin} text={data.venueName} />}
            {data.location && <Row icon={MapPin} text={data.location} />}
          </div>
          {data.locationMap && (
            <a
              href={data.locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:shadow-xl hover:shadow-violet-600/30"
            >
              <MapPin className="h-4 w-4" /> Buka Peta
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}
        </Section>

        {gallery.length > 0 ? (
          <Section eyebrow="Gallery" title="Galeri Momen">
            <div className="mt-2 grid grid-cols-2 gap-4 border-t border-violet-100 pt-6">
              {gallery.map((item) => (
                <figure
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-600/15"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? "Foto galeri"}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {item.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 text-left text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </Section>
        ) : null}

        <Section eyebrow="RSVP" title="Konfirmasi Kehadiran">
          <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/60 p-6">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
        </Section>

        {events.length > 0 ? (
          <Section eyebrow="Agenda" title="Rangkaian Acara">
            <div className="mt-2 space-y-4 border-t border-violet-100 pt-6">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-lg hover:shadow-violet-600/10"
                >
                  <div className="absolute top-0 right-0 h-14 w-14 -translate-y-5 translate-x-5 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 transition-transform duration-500 group-hover:scale-150" />
                  <div className="relative">
                    <span className="inline-block rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      {formatDate(e.date)}
                    </span>
                    <h3 className="mt-2.5 text-lg font-semibold text-zinc-900">{e.title ?? "Acara"}</h3>
                    {e.time && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600">
                        <Clock className="h-4 w-4 text-violet-500" /> {formatTime(e.time)}
                      </p>
                    )}
                    {e.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600">
                        <MapPin className="h-4 w-4 text-violet-500" /> {e.location}
                      </p>
                    )}
                    {e.locationMap && (
                      <a
                        href={e.locationMap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-fuchsia-600 hover:underline"
                      >
                        Lihat Lokasi <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {gifts.length > 0 ? (
          <Section eyebrow="Wedding Gift" title="Tanda Kasih">
            <div className="mt-2 grid grid-cols-1 gap-4 border-t border-violet-100 pt-6 sm:grid-cols-2">
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-violet-100 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-lg hover:shadow-violet-600/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                      <Landmark className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-900">{g.provider}</p>
                      {g.name && <p className="text-xs text-zinc-500">{g.name}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="font-mono text-base font-semibold tracking-wide text-zinc-900">
                      {g.accountNumber}
                    </p>
                    <CopyButton text={g.accountNumber} />
                  </div>
                  {g.holderName && (
                    <p className="mt-1.5 text-xs text-zinc-500">a.n. {g.holderName}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {data.customMessage ? (
          <Section eyebrow="Wishes" title="Pesan Untuk Tamu">
            <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/60 p-6">
              <Quote className="mb-3 h-5 w-5 text-fuchsia-500" />
              <p className="whitespace-pre-line leading-relaxed text-zinc-700">{data.customMessage}</p>
            </div>
          </Section>
        ) : null}

        {data.musicUrl && music ? (
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            buttonClassName="bg-indigo-950 text-fuchsia-200 border border-fuchsia-300/30"
            playingIconClassName="h-5 w-5 animate-pulse text-fuchsia-300"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
        ) : null}

        <Section id="ucapan" eyebrow="Wedding Wall" title="Ucapan & Doa">
          <div className="mt-4 space-y-6">
            <WishList
              wishes={wishes ?? []}
              cardClass="border-violet-100 bg-white"
              nameClass="text-violet-700"
              avatarClass="bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
              emptyClass="text-zinc-400"
            />
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/60 p-6">
              <WishForm invitationId={invitationId} accentClass={ACCENT} borderClass={BORDER} />
            </div>
          </div>
        </Section>
      </div>

      <footer className="w-full bg-gradient-to-r from-indigo-950 via-violet-950 to-fuchsia-950 px-6 py-14 text-center">
        <RingIcon className="mx-auto mb-4 h-5 w-5 text-fuchsia-300" />
        <p className="text-2xl font-light tracking-tight text-white">
          {groom?.nickname ?? groom?.name ?? "Pria"}{" "}
          <Heart className="mx-1 inline h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />{" "}
          {bride?.nickname ?? bride?.name ?? "Wanita"}
        </p>
        <p className="mt-2 text-sm text-violet-200/70">Terima kasih atas doa &amp; kehadiran Anda</p>
        <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-violet-300/40">
          © {new Date().getFullYear()} Meduta
        </p>
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
    <header className="animate-fade-up relative flex min-h-[88vh] w-full max-w-3xl flex-col items-center justify-end overflow-hidden bg-indigo-950 pb-16 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgUrl || "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=70"}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      {/* Aurora gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-violet-900/50 to-fuchsia-900/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(129,140,248,0.35),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(232,121,249,0.3),transparent_50%)]" />

      <div className="relative px-6">
        <p className="animate-fade-up-delay-1 mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-200">
          {eventName}
        </p>
        <h1 className="animate-fade-up-delay-2 text-5xl font-light tracking-tight sm:text-6xl">
          {groomNick ?? "Pria"}{" "}
          <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text font-serif italic text-transparent">&amp;</span>{" "}
          {brideNick ?? "Wanita"}
        </h1>

        <div className="animate-fade-up-delay-3 mt-6 flex items-center justify-center gap-3">
          <span className="hidden h-px w-12 bg-gradient-to-r from-transparent to-fuchsia-300/60 sm:block" />
          {eventDate && (
            <p className="max-w-[240px] text-sm leading-relaxed tracking-[0.2em] text-violet-100">
              {formatDate(eventDate)}
            </p>
          )}
          <span className="hidden h-px w-12 bg-gradient-to-l from-transparent to-fuchsia-300/60 sm:block" />
        </div>

        {guestName && (
          <div className="animate-fade-up-delay-4 mx-auto mt-10 max-w-sm rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200">Kepada Yth.</p>
            <p className="mt-1 text-lg font-medium">{guestName}</p>
          </div>
        )}
      </div>
    </header>
  );

  // Saat gerbang tertutup: konten dikunci + overlay "Buka Undangan" fullscreen
  if (locked) {
    return (
      <InvitationGate
        theme="minimal"
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

function Photo({ person, role }: { person?: TemplateProps["data"]["groom"]; role: string }) {
  return (
    <div className="group">
      {person?.photoUrl ? (
        <div className="relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-violet-600/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.photoUrl}
            alt={person.name ?? role}
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-200">{role}</p>
            <p className="mt-0.5 text-lg font-light text-white">{person.name ?? "-"}</p>
          </div>
        </div>
      ) : (
        <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-400">
          <Heart className="h-8 w-8" />
          <p className="px-4 text-center text-sm font-medium text-violet-500">{person?.name ?? role}</p>
        </div>
      )}
      {person?.instagram && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <AtSign className="h-3.5 w-3.5 text-fuchsia-500" /> {person.instagram}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  id,
  eyebrow,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
  eyebrow?: string;
}) {
  return (
    <section id={id} className="rounded-3xl border border-violet-100 bg-white/70 p-7 shadow-sm backdrop-blur-sm sm:p-8">
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-500">{eyebrow}</p>
      )}
      <h2 className="mt-1 bg-gradient-to-r from-indigo-900 via-violet-800 to-fuchsia-800 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <p className="flex items-center gap-3 text-zinc-700">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 text-violet-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium">{text}</span>
    </p>
  );
}
