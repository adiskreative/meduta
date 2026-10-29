"use client";

import Image from "next/image";
import {
  CalendarDays,
  ChevronDown,
  Heart,
  House,
  Images,
  Leaf,
  MapPin,
  MessageCircle,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";
import CopyButton from "./CopyButton";
import RsvpForm from "./RsvpForm";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import { SaveToCalendarButton, useCountdown } from "./SharedWidgets";
import WishForm from "./WishForm";
import WishList from "./WishList";
import { formatDate, splitAgenda, type GalleryItem, type TemplateProps } from "./types";

const ASSET_PATH = "/design/rimba-zamrud";
const NEW_DECOR = `${ASSET_PATH}/decor-2`;
const FOREST_IMAGE = `${NEW_DECOR}/forest-bg.jpg`;
const GARDEN_IMAGE = `${ASSET_PATH}/garden-aisle.webp`;
const DECOR = {
  peonyTrio: `${NEW_DECOR}/peony-trio.webp`,
  peonyBouquet: `${NEW_DECOR}/peony-bouquet.webp`,
  whiteGarland: `${NEW_DECOR}/white-garland.webp`,
  roseSprig: `${NEW_DECOR}/rose-sprig.webp`,
  eucCorner: `${NEW_DECOR}/euc-corner.webp`,
  fernSprig: `${NEW_DECOR}/fern-sprig.webp`,
  fernSoft: `${NEW_DECOR}/fern-soft.webp`,
  ivyHang: `${NEW_DECOR}/ivy-hang.webp`,
  garlandWide: `${NEW_DECOR}/garland-wide.webp`,
  peonyCorner: `${NEW_DECOR}/peony-corner.webp`,
  forest: FOREST_IMAGE,
} as const;

/* PRNG deterministik — SSR & client menghasilkan posisi identik */
function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

type FireflyParticle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  kind: "glow" | "spark";
};

const FIREFLY_PARTICLES: FireflyParticle[] = (() => {
  const random = seededRandom(20261212);
  const particles: FireflyParticle[] = [];
  for (let i = 0; i < 26; i += 1) {
    particles.push({
      left: random() * 100,
      top: random() * 100,
      size: 3.5 + random() * 3,
      duration: 3.4 + random() * 4.6,
      delay: random() * 8,
      drift: 8 + random() * 16,
      kind: "glow",
    });
  }
  for (let i = 0; i < 10; i += 1) {
    particles.push({
      left: random() * 100,
      top: random() * 100,
      size: 8 + random() * 4,
      duration: 4.5 + random() * 4,
      delay: random() * 9,
      drift: 0,
      kind: "spark",
    });
  }
  return particles;
})();

/* Overlay cahaya kunang-kunang: dot emas berdenyut + sparkle bintang kecil */
function Fireflies({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rz-fireflies pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <span className="rz-mist rz-mist-a" />
      <span className="rz-mist rz-mist-b" />
      {FIREFLY_PARTICLES.map((particle, index) => (
        <span
          key={index}
          className={particle.kind === "glow" ? "rz-glow" : "rz-spark"}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            "--t": `${particle.duration}s`,
            "--d": `${particle.delay}s`,
            "--dx": `${particle.drift}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

/* Strip garland putih di tepi atas section gelap (tepi potong kenop memudar) */
function TopGarland({ light = false }: { light?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
      <Image
        src={DECOR.garlandWide}
        alt=""
        width={1600}
        height={560}
        className="rz-garland-sway h-40 w-full object-cover object-top sm:h-52"
        style={{
          maskImage: "linear-gradient(180deg, #000 55%, transparent 96%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 55%, transparent 96%)",
          opacity: light ? 0.32 : 0.9,
        }}
      />
    </div>
  );
}
const THEME = {
  forest: "#0F2A22",
  forestBand: "#163A2F",
  forestDeep: "#071B15",
  leaf: "#8FAE98",
  gold: "#CFB27A",
  goldPale: "#E9D7A8",
  ivory: "#EEF4EE",
  ink: "#1B120C",
  muted: "#BCD2C3",
} as const;

type NavItem = { id: string; label: string; Icon: LucideIcon };
type GateProps = { gateOpen: boolean; closing: boolean; onOpen: () => void };

export default function RimbaZamrudTemplate(props: TemplateProps) {
  const isEmbedded = Boolean(props.embedded);
  const [gateOpen, setGateOpen] = useState(isEmbedded);
  const [closing, setClosing] = useState(false);
  const music = useBackgroundMusic(isEmbedded ? undefined : props.data.musicUrl, props.data.musicStart, props.data.musicEnd);

  const openInvitation = () => {
    setClosing(true);
    music.play();
    window.setTimeout(() => {
      setGateOpen(true);
      setClosing(false);
    }, 650);
  };

  return (
    <RimbaShell
      {...props}
      data={isEmbedded ? { ...props.data, musicUrl: undefined } : props.data}
      gateOpen={gateOpen}
      closing={closing}
      onOpen={openInvitation}
      music={music}
    />
  );
}

function RimbaShell({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
  decorations,
  gateOpen,
  closing,
  onOpen,
  music,
}: TemplateProps & GateProps & { music: MusicController }) {
  if (!isPublished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F2A22] px-6 text-center text-[#EEF4EE]">
        <div>
          <Leaf className="mx-auto mb-4 h-10 w-10 text-[#CFB27A]" />
          <h1 className="font-serif text-2xl">Undangan belum dipublikasikan</h1>
          <p className="mt-2 text-sm text-white/65">
            Silakan cek kembali setelah pemilik undangan menerbitkannya.
          </p>
        </div>
      </div>
    );
  }

  const groom = data.groom;
  const bride = data.bride;
  const groomName = groom?.nickname || groom?.name || "Mempelai Pria";
  const brideName = bride?.nickname || bride?.name || "Mempelai Wanita";
  const events = data.events ?? [];
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];
  const background = data.backgroundUrl || getBackgroundUrl(decorations) || FOREST_IMAGE;
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: groom?.photoUrl,
    bridePhotoUrl: bride?.photoUrl,
    firstGalleryUrl: gallery[0]?.url,
  }) || background;
  const navItems: NavItem[] = [
    { id: "home", label: "Beranda", Icon: House },
    ...(groom?.name || bride?.name
      ? [{ id: "mempelai", label: "Mempelai", Icon: UsersRound }]
      : []),
    ...(events.length || data.eventDate
      ? [{ id: "acara", label: "Acara", Icon: CalendarDays }]
      : []),
    ...(story.length ? [{ id: "kisah", label: "Kisah", Icon: Heart }] : []),
    ...(gallery.length ? [{ id: "galeri", label: "Galeri", Icon: Images }] : []),
    ...(gifts.length ? [{ id: "kado", label: "Kado", Icon: Heart }] : []),
    { id: "rsvp", label: "RSVP", Icon: CalendarDays },
    { id: "ucapan", label: "Ucapan", Icon: MessageCircle },
  ];

  return (
    <div
      className="rz-page min-h-screen overflow-x-hidden bg-[#0F2A22] text-[#EEF4EE]"
    >
      <style dangerouslySetInnerHTML={{ __html: RIMBA_STYLES }} />
      <main>
        <Cover
          brideName={brideName}
          groomName={groomName}
          eventDate={data.eventDate}
          photo={background}
        />
        {!data.quoteHidden && data.quoteText?.trim() ? (
          <Quote
            title={data.quoteTitle}
            text={data.quoteText.trim()}
            source={data.quoteSource}
          />
        ) : null}
        {(groom?.name || bride?.name) && <Couple groom={groom} bride={bride} />}
        {data.eventDate ? <CountdownSection eventDate={data.eventDate} /> : null}
        {events.length || data.eventDate ? (
          <Events
            eventDate={data.eventDate}
            eventTime={data.eventTime}
            venueName={data.venueName}
            location={data.location}
            locationMap={data.locationMap}
            events={events}
          />
        ) : null}
        {story.length > 0 ? <Story items={story} /> : null}
        {gallery.length > 0 ? <Gallery items={gallery} /> : null}
        {data.videos && data.videos.length > 0 ? <Videos videos={data.videos} /> : null}
        <Rsvp invitationId={invitationId} guestName={guestName} gifts={gifts} />
        <Wishes invitationId={invitationId} wishes={wishes ?? []} />
        <Closing brideName={brideName} groomName={groomName} photo={gatePhoto} />
      </main>
      <Footer />
      {gateOpen && <Navigation items={navItems} />}
      {gateOpen && data.musicUrl && (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          positionClassName="fixed bottom-24 right-4 z-[65] md:bottom-24 md:right-7"
          buttonClassName="border border-[#CFB27A]/60 bg-[#0F2A22]/90 text-[#E9D7A8] shadow-lg"
        />
      )}
      {(!gateOpen || closing) && (
        <InvitationGate
          gateOpen={gateOpen}
          closing={closing}
          onOpen={onOpen}
          photo={gatePhoto}
          brideName={brideName}
          groomName={groomName}
          eventDate={data.eventDate}
          guestName={guestName}
        />
      )}
    </div>
  );
}

function InvitationGate({
  gateOpen,
  closing,
  onOpen,
  photo,
  brideName,
  groomName,
  eventDate,
  guestName,
}: GateProps & {
  photo: string;
  brideName: string;
  groomName: string;
  eventDate?: string;
  guestName?: string;
}) {
  return (
    <section
      aria-label="Sampul undangan"
      className={`rz-gate fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-10 ${gateOpen ? "rz-gate-out" : ""} ${closing ? "rz-gate-closing" : ""}`}
    >
      <Image
        src={photo}
        alt=""
        fill
        unoptimized
        priority
        sizes="100vw"
        className="rz-gate-backdrop object-cover"
        style={{ objectPosition: "center 42%" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,24,17,.42),rgba(7,27,21,.78)_65%,rgba(7,27,21,.95))]" />
      {/* Kunang-kunang berkelap-kelip */}
      <Fireflies />
      {/* Peony putih di kedua sudut atas — saling memandang seperti referensi */}
      <Image
        src={DECOR.peonyTrio}
        alt=""
        width={900}
        height={900}
        priority
        className="rz-gate-flower pointer-events-none absolute -bottom-[8%] left-[-14%] h-[46vh] w-auto max-w-[420px] object-contain opacity-95 sm:-left-[6%]"
      />
      <Image
        src={DECOR.peonyTrio}
        alt=""
        width={900}
        height={900}
        priority
        className="rz-gate-flower rz-mirror pointer-events-none absolute -bottom-[4%] right-[-16%] h-[44vh] w-auto max-w-[400px] -scale-x-100 object-contain opacity-95 sm:-right-[7%]"
      />
      {/* Peony bouquet pinching the top corners */}
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        priority
        className="rz-gate-flower pointer-events-none absolute -left-[6%] top-[-8%] h-[32vh] w-auto max-w-[320px] object-contain opacity-95"
      />
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        priority
        className="rz-gate-flower rz-mirror pointer-events-none absolute -right-[6%] top-[-8%] h-[32vh] w-auto max-w-[320px] -scale-x-100 object-contain opacity-95"
      />
      {/* Fern hijau peeping at the base */}
      <Image
        src={DECOR.fernSprig}
        alt=""
        width={900}
        height={900}
        className="rz-gate-flower pointer-events-none absolute -bottom-[16%] left-[40%] hidden h-[24vh] w-auto max-w-[220px] object-contain opacity-70 sm:block"
      />
      <div className="relative z-10 mx-auto w-full max-w-[460px] text-center text-[#EEF4EE]">
        <p className="text-[10px] font-medium uppercase tracking-[.38em] text-[#E9D7A8] sm:text-xs">
          The Wedding Of
        </p>
        <div className="rz-names mt-5 space-y-[-.14em] text-[clamp(3.2rem,14vw,6.6rem)] leading-[.98] drop-shadow-lg">
          <p>{brideName}</p>
          <p className="text-[.42em] text-[#E9D7A8]">&amp;</p>
          <p>{groomName}</p>
        </div>
        <p className="mt-5 text-[10px] uppercase tracking-[.27em] text-white/85 sm:text-xs">
          {eventDate ? formatDate(eventDate) : "Dengan penuh rasa syukur"}
        </p>
        <div className="rz-card mx-auto mt-8 max-w-[350px] px-6 py-6">
          <p className="text-[10px] uppercase tracking-[.2em] text-[#E9D7A8]">
            Kepada Yth. Bapak/Ibu/Saudara/i
          </p>
          <p className="mt-2 font-serif text-xl">{guestName || "Nama Tamu"}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rz-open-button mt-5 inline-flex items-center gap-2 rounded-full border border-[#E9D7A8]/70 bg-[#CFB27A] px-7 py-3 text-xs font-semibold tracking-wide text-[#1B120C] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#E0C48F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E9D7A8]"
          >
            <Heart className="h-4 w-4" />
            Buka Undangan
          </button>
        </div>
      </div>
    </section>
  );
}

function Cover({
  brideName,
  groomName,
  eventDate,
  photo,
}: {
  brideName: string;
  groomName: string;
  eventDate?: string;
  photo: string;
}) {
  return (
    <section
      id="home"
      className="rz-cover relative isolate flex min-h-[720px] items-end overflow-hidden px-5 pb-24 pt-24 text-center text-white sm:min-h-[850px] sm:pb-28"
    >
      <Image
        src={photo}
        alt=""
        fill
        unoptimized
        priority
        sizes="100vw"
        className="rz-cover-backdrop object-cover"
        style={{ objectPosition: "center 42%" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,33,23,.08)_10%,rgba(8,33,23,.30)_42%,rgba(8,33,23,.9)_100%)]" />
      <Fireflies />
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        className="rz-float pointer-events-none absolute -left-[6%] top-[-5%] w-[42vw] max-w-[330px] object-contain opacity-95 sm:w-[24vw]"
      />
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        className="rz-float rz-mirror pointer-events-none absolute -right-[6%] top-[-5%] w-[42vw] max-w-[330px] -scale-x-100 object-contain opacity-95 sm:w-[24vw]"
      />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <p className="text-[10px] uppercase tracking-[.4em] text-[#E9D7A8] sm:text-xs">
          The Wedding Of
        </p>
        <h1 className="rz-names mt-5 text-[clamp(3.5rem,13vw,7.5rem)] leading-[1.05]">
          {brideName}
          <span className="mx-3 block py-2 text-[.42em] text-[#E9D7A8] sm:inline sm:py-0">
            &amp;
          </span>
          {groomName}
        </h1>
        <div className="mx-auto mt-7 h-px w-20 bg-[#CFB27A]" />
        <p className="mt-5 text-xs uppercase tracking-[.28em] text-white/85 sm:text-sm">
          {eventDate ? formatDate(eventDate) : "Hari bahagia kami"}
        </p>
        <a
          href="#undangan"
          className="mt-10 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.25em] text-white/75 transition hover:text-white"
        >
          Jelajahi undangan <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0F2A22] to-transparent" />
    </section>
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
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[.32em] text-[#CFB27A]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight text-[#EEF4EE] sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-5 h-px w-14 bg-[#CFB27A]" />
    </div>
  );
}

function Quote({
  title,
  text,
  source,
}: {
  title?: string;
  text: string;
  source?: string;
}) {
  return (
    <section id="undangan" className="relative overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={900}
        height={900}
        className="rz-floral-decor pointer-events-none absolute -right-28 top-[-6%] w-72 opacity-60 sm:w-80"
      />
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={900}
        height={900}
        className="pointer-events-none absolute -left-24 bottom-[-10%] hidden w-64 rotate-[12deg] -scale-x-100 opacity-50 sm:block"
      />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-full border border-[#CFB27A]/45 text-[#CFB27A]">
          <Leaf className="h-5 w-5" />
        </div>
        <p className="text-[10px] uppercase tracking-[.32em] text-[#CFB27A]">
          {title || "Dengan memohon rahmat dan ridho Allah SWT"}
        </p>
        <blockquote className="mt-6 font-serif text-xl leading-[1.9] text-[#EEF4EE] sm:text-2xl">
          “{text}”
        </blockquote>
        {source && (
          <p className="mt-5 text-[10px] uppercase tracking-[.23em] text-[#CFB27A]">
            {source}
          </p>
        )}
      </div>
    </section>
  );
}

function Couple({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section id="mempelai" className="rz-band relative overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={DECOR.eucCorner}
        alt=""
        width={800}
        height={800}
        className="rz-float pointer-events-none absolute -left-24 -top-24 w-72 opacity-70 sm:w-[24rem]"
      />
      <Image
        src={DECOR.peonyBouquet}
        alt=""
        width={900}
        height={900}
        className="rz-float pointer-events-none absolute -right-24 bottom-[-14%] hidden w-64 opacity-55 sm:block"
      />
      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionHeading eyebrow="Dengan penuh rasa syukur" title="Kedua Mempelai" />
        <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-7 text-[#BCD2C3]">
          Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.
          Dengan memohon rahmat dan ridho-Nya, kami bermaksud menyelenggarakan
          pernikahan putra-putri kami.
        </p>
        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
          <PersonCard person={bride} fallbackName="Mempelai Wanita" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#CFB27A]/45 bg-[#E9D7A8]/10 text-[#E9D7A8]">
            <Heart className="h-6 w-6" />
          </div>
          <PersonCard person={groom} fallbackName="Mempelai Pria" />
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  fallbackName,
}: {
  person?: TemplateProps["data"]["groom"];
  fallbackName: string;
}) {
  if (!person?.name) return null;
  return (
    <article className="text-center">
      <div className="relative mx-auto h-72 w-56 overflow-hidden rounded-t-[130px] border border-[#CFB27A]/70 bg-[#1C4636] shadow-[0_26px_70px_-40px_rgba(0,0,0,.8)]">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt={person.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#1C4636] to-[#0F2A22] font-serif text-6xl text-[#E9D7A8]">
            {(person.nickname || person.name).charAt(0)}
          </div>
        )}
        <span className="absolute inset-2 rounded-t-[120px] border border-white/65" />
      </div>
      <p className="mt-9 text-[10px] uppercase tracking-[.32em] text-[#CFB27A]">
        {fallbackName}
      </p>
      <h3 className="mt-2 font-serif text-3xl text-[#EEF4EE] sm:text-4xl">{person.name}</h3>
      {person.bio && (
        <p className="mx-auto mt-3 max-w-xs whitespace-pre-line text-sm leading-6 text-[#BCD2C3]">
          {person.bio}
        </p>
      )}
      {person.parentName && (
        <p className="mt-3 text-xs leading-6 text-[#BCD2C3]">
          Putra/Putri dari
          <br />
          {person.parentName}
        </p>
      )}
      {person.instagram && (
        <a
          href={`https://www.instagram.com/${person.instagram.replace(/^@/, "")}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-xs text-[#CFB27A] underline decoration-[#CFB27A]/50 underline-offset-4"
        >
          @{person.instagram.replace(/^@/, "")}
        </a>
      )}
    </article>
  );
}

function CountdownSection({ eventDate }: { eventDate: string }) {
  const time = useCountdown(eventDate);
  const values = [
    { label: "Hari", value: time.days },
    { label: "Jam", value: time.hours },
    { label: "Menit", value: time.minutes },
    { label: "Detik", value: time.seconds },
  ];
  return (
    <section className="relative isolate overflow-hidden bg-[#0F2A22] px-5 py-20 text-[#EEF4EE] sm:py-24">
      <Image
        src={FOREST_IMAGE}
        alt=""
        fill
        sizes="100vw"
        className="rz-scene-backdrop object-cover opacity-[.5]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B2119]/50 to-[#0B2119]/85" />
      <Fireflies />
      <Image
        src={DECOR.fernSprig}
        alt=""
        width={900}
        height={900}
        className="rz-float pointer-events-none absolute -left-20 top-[-10%] w-56 opacity-85 sm:w-72"
      />
      <Image
        src={DECOR.fernSprig}
        alt=""
        width={900}
        height={900}
        className="rz-float rz-mirror pointer-events-none absolute -right-24 bottom-[-10%] w-60 -scale-x-100 opacity-85 sm:w-72"
      />
      <div className="relative mx-auto max-w-3xl">
        <SectionHeading eyebrow="Catat tanggalnya" title="Menuju Hari Bahagia" />
        <p className="mt-5 text-center text-sm text-white/75">{formatDate(eventDate)}</p>
        <div className="mt-9 grid grid-cols-4 gap-2 sm:gap-4">
          {values.map(({ label, value }) => (
            <div
              key={label}
              className="rz-card rz-card-sm px-2 py-4 text-center sm:py-6"
            >
              <p className="font-serif text-3xl tabular-nums text-[#E9D7A8] sm:text-5xl">
                {String(value).padStart(2, "0")}
              </p>
              <p className="mt-2 text-[9px] uppercase tracking-[.2em] text-white/70 sm:text-[10px]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Events({
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
  const agenda = splitAgenda(events, {
    date: eventDate,
    time: eventTime,
    venue: venueName,
    mapUrl: locationMap,
  });
  const mainLocation = agenda.main.venue || location;
  const hasMainEvent = Boolean(
    agenda.main.date || agenda.main.time || mainLocation || agenda.main.mapUrl,
  );
  return (
    <section id="acara" className="rz-band relative overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        className="rz-float pointer-events-none absolute -left-20 top-[-6%] w-56 opacity-80 sm:w-64"
      />
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        className="rz-float rz-mirror pointer-events-none absolute -right-24 bottom-[-8%] hidden w-60 -scale-x-100 opacity-70 sm:block"
      />
      <div className="relative mx-auto max-w-5xl">
        <SectionHeading eyebrow="Rangkaian acara" title="Lokasi & Waktu" />
        <p className="mt-4 text-center text-sm text-[#BCD2C3]">Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir.</p>
        <div className="mt-11 grid gap-5 md:grid-cols-2">
          {hasMainEvent && (
            <EventCard
              title="Akad Nikah"
              date={agenda.main.date}
              time={agenda.main.time}
              venue={mainLocation}
              location={location}
            />
          )}
          {agenda.additional.map((event) => (
            <EventCard
              key={event.id}
              title={event.title || "Rangkaian Acara"}
              date={event.date}
              time={event.time}
              venue={event.location}
              location={event.location}
            />
          ))}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {agenda.main.mapUrl && (
            <a
              href={agenda.main.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rz-button rz-button-outline"
            >
              <MapPin className="h-4 w-4" /> Buka Peta
            </a>
          )}
          {agenda.main.date && (
            <SaveToCalendarButton
              title={`Pernikahan ${venueName || "Kami"}`}
              date={agenda.main.date}
              time={agenda.main.time}
              location={mainLocation}
              className="rz-button rz-button-outline"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function EventCard({
  title,
  date,
  time,
  venue,
  location,
}: {
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
}) {
  return (
    <article className="rz-card relative overflow-hidden p-6 text-center sm:p-8">
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={400}
        height={400}
        className="pointer-events-none absolute -right-10 -top-14 w-28 opacity-40"
      />
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#CFB27A] text-[#1B120C]">
        <CalendarDays className="h-5 w-5" />
      </div>
      <h3 className="relative mt-4 font-serif text-2xl text-[#EEF4EE]">{title}</h3>
      {date && <p className="relative mt-3 text-sm font-medium text-[#CFB27A]">{formatDate(date)}</p>}
      {time && <p className="relative mt-1 text-sm text-[#BCD2C3]">Pukul {time}</p>}
      {venue && <p className="relative mt-4 text-sm font-semibold text-[#EEF4EE]">{venue}</p>}
      {location && <p className="relative mx-auto mt-1 max-w-md text-xs leading-6 text-[#BCD2C3]">{location}</p>}
    </article>
  );
}

function Story({ items }: { items: NonNullable<TemplateProps["data"]["story"]> }) {
  return (
    <section id="kisah" className="relative isolate overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={GARDEN_IMAGE}
        alt=""
        fill
        sizes="100vw"
        className="rz-scene-backdrop object-cover opacity-[.08]"
      />
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={900}
        height={900}
        className="rz-float pointer-events-none absolute -left-20 top-[-6%] w-56 opacity-60 sm:w-64"
      />
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={900}
        height={900}
        className="rz-float rz-mirror pointer-events-none absolute -right-24 bottom-[-8%] hidden w-60 -scale-x-100 opacity-55 sm:block"
      />
      <div className="relative mx-auto max-w-4xl">
        <SectionHeading eyebrow="Jejak perjalanan" title="Kisah Kami" />
        <div className="relative mx-auto mt-12 max-w-2xl">
          <div className="absolute bottom-4 left-[15px] top-4 w-px bg-[#CFB27A]/60 sm:left-1/2" />
          <div className="space-y-7">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`relative pl-12 sm:w-1/2 sm:pl-0 ${index % 2 === 0 ? "sm:pr-10 sm:text-right" : "sm:ml-auto sm:pl-10"}`}
              >
                <span className={`absolute left-[8px] top-2 h-4 w-4 rounded-full border-[3px] border-[#0F2A22] bg-[#CFB27A] shadow-[0_0_0_1px_#CFB27A] sm:left-auto ${index % 2 === 0 ? "sm:-right-[8px]" : "sm:-left-[8px]"}`} />
                <p className="text-[10px] uppercase tracking-[.23em] text-[#CFB27A]">{item.date}</p>
                <h3 className="mt-1 font-serif text-2xl text-[#EEF4EE]">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm leading-7 text-[#BCD2C3]">{item.description}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery({ items }: { items: GalleryItem[] }) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedImage]);

  return (
    <section id="galeri" className="rz-band relative overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={DECOR.peonyBouquet}
        alt=""
        width={900}
        height={900}
        className="rz-floral-decor pointer-events-none absolute -bottom-32 -left-28 w-80 opacity-85 sm:w-[26rem]"
      />
      <Image
        src={DECOR.roseSprig}
        alt=""
        width={800}
        height={800}
        className="pointer-events-none absolute -right-24 top-[-8%] hidden w-64 -scale-y-100 opacity-85 sm:block"
      />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeading eyebrow="Momen berharga" title="Galeri Kenangan" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedImage(item)}
              className={`rz-gallery-image group relative overflow-hidden rounded-2xl bg-[#1C4636] text-left shadow-md ${index % 5 === 1 ? "aspect-[4/5]" : "aspect-square"}`}
              aria-label={`Perbesar foto ${item.caption || index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || `Momen pernikahan ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0F2A22]/65 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              {item.caption && (
                <span className="absolute bottom-3 left-3 right-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {item.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.caption || "Foto galeri"}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#071B15]/95 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            aria-label="Tutup foto"
            className="absolute right-5 top-5 rounded-full border border-white/30 p-2 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.url}
              alt={selectedImage.caption || "Foto galeri"}
              className="max-h-[82vh] max-w-full rounded-xl object-contain"
            />
            {selectedImage.caption && (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {selectedImage.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}

function Videos({ videos }: { videos: NonNullable<TemplateProps["data"]["videos"]> }) {
  return (
    <section className="relative overflow-hidden bg-[#0F2A22] px-5 py-16 text-center text-[#EEF4EE]">
      <Fireflies />
      <div className="relative z-10 mx-auto max-w-4xl">
        <SectionHeading eyebrow="Simpan dalam kenangan" title="Video Kami" />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {videos.map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rz-button border border-[#CFB27A] bg-[#CFB27A] text-[#1B120C] hover:bg-[#E9D7A8]"
            >
              <Heart className="h-4 w-4" />
              {video.title || "Putar video"}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Rsvp({
  invitationId,
  guestName,
  gifts,
}: {
  invitationId: string;
  guestName?: string;
  gifts: NonNullable<TemplateProps["data"]["gifts"]>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="rsvp" className="rz-band relative isolate overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={GARDEN_IMAGE}
        alt=""
        fill
        sizes="100vw"
        className="rz-scene-backdrop object-cover opacity-[.07]"
      />
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={900}
        height={900}
        className="rz-float pointer-events-none absolute -left-20 top-[-8%] w-56 opacity-60 sm:w-64"
      />
      <Image
        src={DECOR.fernSoft}
        alt=""
        width={900}
        height={900}
        className="rz-float rz-mirror pointer-events-none absolute -right-24 bottom-[-10%] hidden w-60 -scale-x-100 opacity-55 sm:block"
      />
      <div className="relative mx-auto max-w-4xl">
        <SectionHeading eyebrow="Kehadiran Anda" title="Konfirmasi Kehadiran" />
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-7 text-[#BCD2C3]">
          Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami.
          Silakan sampaikan konfirmasi kehadiran melalui formulir berikut.
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rz-button mx-auto mt-8 flex bg-[#CFB27A] px-7 py-3 text-[#1B120C] hover:bg-[#E9D7A8]"
        >
          <CalendarDays className="h-4 w-4" />
          Konfirmasi Kehadiran
        </button>
        {gifts.length > 0 && <Gifts gifts={gifts} />}
      </div>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi kehadiran"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#071B15]/80 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="rz-card rz-form relative w-full max-w-lg p-5 text-[#EEF4EE] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Tutup konfirmasi"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#CFB27A] hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-6 pr-10 font-serif text-2xl text-[#EEF4EE]">
              Konfirmasi Kehadiran
            </h3>
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass="bg-[#CFB27A] hover:bg-[#E9D7A8] text-[#1B120C]"
              borderClass="border-[#CFB27A]/35 focus:border-[#E9D7A8] focus:ring-[#E9D7A8]/20"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Gifts({ gifts }: { gifts: NonNullable<TemplateProps["data"]["gifts"]> }) {
  return (
    <div id="kado" className="rz-gifts mx-auto mt-16 max-w-3xl text-center">
      <SectionHeading eyebrow="Tanda kasih" title="Kirim Hadiah" />
      <p className="mt-4 text-sm leading-7 text-[#BCD2C3]">
        Doa restu Anda adalah hadiah terindah. Jika berkenan mengirimkan tanda kasih,
        dapat melalui informasi berikut.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {gifts.map((gift) => (
          <article key={gift.id} className="rz-card rz-card-sm relative overflow-hidden p-5 text-left">
            <Image
              src={DECOR.roseSprig}
              alt=""
              width={200}
              height={200}
              className="pointer-events-none absolute -right-8 -top-10 w-20 opacity-30"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#CFB27A]">{gift.provider}</p>
            <p className="mt-3 text-sm font-medium text-[#EEF4EE]">{gift.name}</p>
            <p className="mt-1 select-all text-sm tracking-wider text-[#CFB27A]">{gift.accountNumber}</p>
            {gift.holderName && <p className="mt-1 text-xs text-[#BCD2C3]">a.n. {gift.holderName}</p>}
            <div className="mt-3 inline-flex">
              <CopyButton text={gift.accountNumber} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Wishes({
  invitationId,
  wishes,
}: {
  invitationId: string;
  wishes: NonNullable<TemplateProps["wishes"]>;
}) {
  return (
    <section id="ucapan" className="rz-form rz-wishes relative overflow-hidden px-5 py-20 sm:py-28">
      <Image
        src={DECOR.eucCorner}
        alt=""
        width={1000}
        height={1000}
        className="rz-floral-decor pointer-events-none absolute -right-28 -top-24 w-72 opacity-70 sm:w-[26rem]"
      />
      <Image
        src={DECOR.peonyTrio}
        alt=""
        width={700}
        height={700}
        className="rz-float pointer-events-none absolute -left-20 bottom-[-12%] hidden w-56 opacity-80 sm:block"
      />
      <div className="relative mx-auto max-w-5xl">
        <SectionHeading eyebrow="Doa terbaik untuk kami" title="Ucapan & Doa" />
        <div className="rz-card mx-auto mt-9 max-w-xl p-5 sm:p-8">
          <WishForm
            invitationId={invitationId}
            accentClass="bg-[#CFB27A] hover:bg-[#E9D7A8] text-[#1B120C]"
            borderClass="border-[#CFB27A]/35 focus:border-[#E9D7A8] focus:ring-[#E9D7A8]/20"
          />
        </div>
        <div className="mt-9">
          <WishList
            wishes={wishes}
            cardClass="rz-card rz-card-sm"
            nameClass="text-[#EEF4EE]"
            avatarClass="bg-[#CFB27A] text-[#1B120C]"
            emptyClass="text-[#BCD2C3]"
          />
        </div>
      </div>
    </section>
  );
}

function Closing({
  brideName,
  groomName,
  photo,
}: {
  brideName: string;
  groomName: string;
  photo: string;
}) {
  return (
    <section className="relative isolate flex min-h-[560px] items-center overflow-hidden px-8 py-24 text-center text-[#EEF4EE]">
      <Image src={photo} alt="" fill unoptimized sizes="100vw" className="rz-scene-backdrop object-cover" />
      <div className="absolute inset-0 bg-[#071B15]/80" />
      <Fireflies />
      <TopGarland light />
      <Image
        src={DECOR.peonyCorner}
        alt=""
        width={1100}
        height={1100}
        className="rz-float pointer-events-none absolute -bottom-40 -left-40 w-96 opacity-95 sm:w-[30rem]"
      />
      <Image
        src={DECOR.fernSprig}
        alt=""
        width={900}
        height={900}
        className="rz-float rz-mirror pointer-events-none absolute -bottom-24 -right-36 hidden w-72 -scale-x-100 opacity-90 sm:block"
      />
      <div className="relative mx-auto max-w-2xl">
        <Heart className="mx-auto h-7 w-7 text-[#CFB27A]" />
        <p className="mt-6 text-[10px] uppercase tracking-[.32em] text-[#E9D7A8]">Terima Kasih</p>
        <h2 className="rz-names mt-4 text-4xl sm:text-6xl">
          {brideName} <span className="text-[#CFB27A]">&amp;</span> {groomName}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-white/75">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
          berkenan hadir dan memberikan doa restu.
        </p>
        <p className="mt-8 font-serif text-2xl text-[#E9D7A8]">Wassalamu’alaikum Wr. Wb.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#071B15] px-8 pt-7 pb-24 text-center text-[10px] tracking-wide text-[#BCD2C3]/60 md:pb-9">
      <p>
        <span className="text-[#E9D7A8]">Rimba Zamrud</span> · Undangan Digital
      </p>
      <p className="mt-1">Didesain Oleh Meduta</p>
    </footer>
  );
}

function Navigation({ items }: { items: NavItem[] }) {
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);
    const observer = new IntersectionObserver(
      (entries) => {
        const activeSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top))[0];
        if (activeSection) setActiveId(activeSection.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="rz-nav fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-w-2xl justify-around border-t border-[#CFB27A]/30 bg-[#0F2A22]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_30px_rgba(7,27,21,.35)] md:bottom-5 md:rounded-full md:border md:px-3 md:pb-2">
      {items.map(({ id, label, Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-label={label}
          aria-current={activeId === id ? "location" : undefined}
          className={`flex min-w-0 flex-col items-center gap-1 px-2 py-1 text-[9px] transition sm:text-[10px] ${activeId === id ? "text-[#E9D7A8]" : "text-white/60 hover:text-white"}`}
        >
          <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

const RIMBA_STYLES = `
  .rz-page {
    background-color: ${THEME.forest};
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.3'/%3E%3C/svg%3E");
  }
  .rz-band { background: linear-gradient(180deg, transparent, rgba(22,58,47,.66) 18%, rgba(22,58,47,.66) 82%, transparent); }
  .rz-card {
    position: relative;
    border-radius: 22px;
    background: rgba(16,48,38,.6);
    border: 1px solid rgba(255,255,255,.16);
    box-shadow: 0 18px 40px rgba(0,0,0,.28);
  }
  .rz-card::before {
    content: "";
    position: absolute;
    inset: 7px;
    border: 1px dotted rgba(233,215,168,.5);
    border-radius: 15px;
    pointer-events: none;
  }
  .rz-card-sm { border-radius: 16px; }
  .rz-card-sm::before { inset: 5px; border-radius: 10px; }
  /* Font ala referensi: Cormorant Garamond untuk teks, Great Vibes untuk nama */
  .rz-page { font-family: var(--font-serif-elegant); }
  .rz-page .font-serif { font-family: var(--font-serif-elegant); }
  .rz-names { font-family: var(--font-script); font-weight: 400; }
  .rz-gate { background: ${THEME.forestDeep}; }
  .rz-gate-frame { border: 1px solid rgba(230,216,181,.38); border-radius: 26px; pointer-events: none; }
  .rz-gate-out { opacity: 0; pointer-events: none; transition: opacity .65s ease; }
  .rz-gate-closing { opacity: 0; pointer-events: none; }
  .rz-gate-backdrop { animation: rz-forest-breath 26s ease-in-out infinite alternate; }
  .rz-cover-backdrop { animation: rz-forest-breath 34s ease-in-out infinite alternate; }
  .rz-gate-flower { transform-origin: 50% 12%; will-change: translate, rotate, scale; animation: rz-bloom-sway 9s ease-in-out infinite alternate, rz-petal-breathe 6s ease-in-out infinite alternate; }
  .rz-float { transform-origin: 50% 8%; animation: rz-bloom-sway 9s ease-in-out infinite alternate, rz-petal-breathe 6s ease-in-out infinite alternate; }
  .rz-floral-decor { transform-origin: 50% 10%; animation: rz-bloom-sway 9s ease-in-out infinite alternate, rz-petal-breathe 6s ease-in-out infinite alternate; }
  .rz-mirror { animation-name: rz-bloom-sway, rz-petal-breathe-mirror; }
  .rz-garland-sway { transform-origin: 50% 0%; animation: rz-garland-sway 9s ease-in-out infinite alternate; }
  .rz-fireflies { z-index: 1; }
  .rz-glow {
    position: absolute;
    border-radius: 50%;
    background: ${THEME.goldPale};
    box-shadow: 0 0 10px 3px rgba(233,215,168,.55);
    opacity: 0;
    animation: rz-glow var(--t, 5s) ease-in-out var(--d, 0s) infinite;
  }
  .rz-spark {
    position: absolute;
    opacity: 0;
    background:
      radial-gradient(circle, ${THEME.goldPale} 0 18%, transparent 20%),
      linear-gradient(${THEME.goldPale}, ${THEME.goldPale}) center/1px 100% no-repeat,
      linear-gradient(${THEME.goldPale}, ${THEME.goldPale}) center/100% 1px no-repeat;
    animation: rz-spark-tw var(--t, 6s) ease-in-out var(--d, 0s) infinite;
  }
  .rz-mist {
    position: absolute;
    left: -50%;
    width: 200%;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255,255,255,.06), transparent);
    animation: rz-mist 26s ease-in-out infinite alternate;
  }
  .rz-mist-a { top: 16%; }
  .rz-mist-b { top: 60%; animation-duration: 34s; animation-direction: alternate-reverse; }
  .rz-scene-backdrop { animation: rz-forest-breath 28s ease-in-out infinite alternate; }
  .rz-open-button { position: relative; animation: rz-soft-glow 3.2s ease-in-out infinite; }
  .rz-open-button::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 2px solid ${THEME.gold};
    opacity: 0;
    animation: rz-pulse-ring 2.4s ease-out 2.4s infinite;
    pointer-events: none;
  }
  @keyframes rz-pulse-ring { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(1.35, 1.6); opacity: 0; } }
  .rz-gallery-image:focus-visible { outline: 2px solid ${THEME.gold}; outline-offset: 3px; }
  @keyframes rz-forest-breath { from { transform: scale(1); } to { transform: scale(1.075) translate3d(1.2%, -0.5%, 0); } }
  @keyframes rz-petal-breathe { from { scale: 1; } to { scale: 1.035; } }
  @keyframes rz-petal-breathe-mirror { from { scale: -1 1; } to { scale: -1.035 1.035; } }
  @keyframes rz-bloom-sway { from { translate: 0 5px; rotate: -1.2deg; } to { translate: 0 -9px; rotate: 1.2deg; } }
  @keyframes rz-garland-sway { from { translate: 0 0; rotate: -0.6deg; } to { translate: 0 5px; rotate: 0.6deg; } }
  @keyframes rz-glow {
    0%,100% { opacity: 0; translate: 0 0; }
    40% { opacity: .9; }
    70% { opacity: .35; translate: var(--dx, 12px) -20px; }
  }
  @keyframes rz-spark-tw { 0%,100% { opacity: 0; scale: .4; rotate: 0deg; } 50% { opacity: .9; scale: 1; rotate: 45deg; } }
  @keyframes rz-mist { from { translate: -10% 0; } to { translate: 10% 0; } }
  @keyframes rz-soft-glow { 0%,100% { box-shadow: 0 0 0 rgba(233,215,168,0); } 50% { box-shadow: 0 0 24px rgba(233,215,168,.3); } }
  @media (prefers-reduced-motion: reduce) {
    .rz-gate-backdrop, .rz-cover-backdrop, .rz-gate-flower, .rz-float, .rz-floral-decor, .rz-scene-backdrop, .rz-open-button, .rz-open-button::after, .rz-garland-sway, .rz-glow, .rz-spark, .rz-mist { animation: none; }
    .rz-gate-out { transition-duration: .01ms; }
  }
  .rz-button { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; border-radius: 9999px; padding: .7rem 1.15rem; font-size: .75rem; font-weight: 600; transition: background-color .2s, color .2s, transform .2s; }
  .rz-button:hover { transform: translateY(-1px); }
  .rz-button-outline { border: 1px solid rgba(233,215,168,.75); background: rgba(233,215,168,.08); color: ${THEME.goldPale}; }
  .rz-button-outline:hover { background: ${THEME.goldPale}; color: ${THEME.ink}; }
  /* Form & kartu shared (RsvpForm, WishForm, WishList, CopyButton) di atas tema gelap */
  .rz-form label { color: ${THEME.goldPale}; }
  .rz-form .bg-white { background-color: rgba(255,255,255,.05); }
  .rz-form .text-zinc-900, .rz-form .text-zinc-700 { color: ${THEME.ivory}; }
  .rz-form .placeholder-zinc-400::placeholder { color: rgba(188,210,195,.55); }
  .rz-form .border-zinc-300 { border-color: rgba(233,215,168,.35); }
  .rz-form .hover\:bg-zinc-50:hover { background-color: rgba(255,255,255,.08); }
  .rz-form .bg-emerald-50 { background-color: rgba(207,178,122,.14); }
  .rz-form .text-emerald-700, .rz-form .text-emerald-600 { color: ${THEME.goldPale}; }
  .rz-form .bg-red-50 { background-color: rgba(224,122,110,.14); }
  .rz-form .text-red-600 { color: #F4A99F; }
  .rz-form .border-red-400 { border-color: #E07A6E; }
  .rz-wishes .text-zinc-600 { color: ${THEME.muted}; }
  .rz-wishes .text-zinc-400 { color: rgba(188,210,195,.5); }
  .rz-gifts .border-zinc-300 { border-color: rgba(233,215,168,.4); }
  .rz-gifts .text-zinc-600 { color: ${THEME.goldPale}; }
  .rz-gifts .hover\:border-rose-300:hover { border-color: ${THEME.goldPale}; }
  .rz-gifts .hover\:bg-rose-50:hover { background-color: rgba(233,215,168,.12); }
  .rz-gifts .hover\:text-rose-600:hover { color: ${THEME.goldPale}; }
  .rz-gifts .text-emerald-600 { color: ${THEME.leaf}; }
  @media (max-width: 380px) { .rz-nav a { padding-left: .35rem; padding-right: .35rem; } .rz-nav span { font-size: 8px; } }
`;
