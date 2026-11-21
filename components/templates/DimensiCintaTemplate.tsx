"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowUp,
  AtSign,
  CalendarDays,
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  Mail,
  MapPin,
  Quote,
  
} from "lucide-react";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown, SaveToCalendarButton } from "./SharedWidgets";
import { formatDate, splitAgenda, type TemplateProps, type WishItem } from "./types";
import {
  getBackgroundUrl,
  getGatePhotoUrl,
  resolveGatePhoto,
} from "@/lib/decoration";

/**
 * Dimensi Cinta — undangan digital bergaya 3D "crystal galaxy".
 * Seluruh kedalaman dibuat dengan CSS transform/perspective (tanpa WebGL)
 * supaya ringan di ponsel, tetap tampil bagus di iframe preview 440px,
 * dan tidak menambah dependency baru.
 */
const ASSETS = {
  chapel: "/design/roman/villa-chapel.webp",
  gate: "/design/roman/gerbang.webp",
  garland: "/design/roman/garland-peony.webp",
  corner: "/design/roman/corner-rose.webp",
  bouquet: "/design/roman/bouquet-crimson.webp",
  bouquetWhite: "/design/roman/bouquet-white.webp",
  pampas: "/design/roman/pampas.webp",
  cartouche: "/design/roman/cartouche.webp",
  carriage: "/design/roman/carriage.webp",
  envelope: "/design/roman/envelope-wax.webp",
  floralBorder: "/design/roman/floral-border.webp",
};

const STYLES = `
  .dc-root {
    --dc-night: #080719;
    --dc-violet: #251552;
    --dc-rose: #ff74a8;
    --dc-gold: #f6d68a;
    --dc-ice: #b9e8ff;
    --dc-text: #f8f4ff;
    --dc-muted: #c5b9e8;
    --dc-glass: rgba(255,255,255,0.075);
    --dc-glass-line: rgba(255,255,255,0.16);
    color: var(--dc-text);
  }
  .dc-root * { box-sizing: border-box; }
  .dc-glass {
    background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.035));
    border: 1px solid var(--dc-glass-line);
    box-shadow: 0 18px 50px rgba(3,2,18,0.45), inset 0 1px 0 rgba(255,255,255,0.22);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .dc-gold-text {
    background: linear-gradient(95deg, #d9a94a 0%, #fff1bd 35%, #f6d68a 58%, #b9822b 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: dcShimmer 7s linear infinite;
  }
  .dc-eye { letter-spacing: 0.32em; text-transform: uppercase; }

  @keyframes dcShimmer { to { background-position: 200% center; } }
  @keyframes dcOrbit { from { transform: rotateZ(0deg); } to { transform: rotateZ(360deg); } }
  @keyframes dcOrbitReverse { from { transform: rotateZ(360deg); } to { transform: rotateZ(0deg); } }
  @keyframes dcFloat {
    /* --dc-rot / --dc-flip dipakai ornament sudut agar rotasi 180° tidak
       hilang ketika animasi mengambil alih properti transform. */
    0%, 100% { transform: translate3d(0,0,0) scaleX(var(--dc-flip, 1)) rotate(var(--dc-rot, 0deg)); }
    50% { transform: translate3d(0,-16px,0) scaleX(var(--dc-flip, 1)) rotate(calc(var(--dc-rot, 0deg) + 2deg)); }
  }
  @keyframes dcPulse {
    0%, 100% { opacity: 0.45; transform: scale(1); }
    50% { opacity: 0.95; transform: scale(1.12); }
  }
  @keyframes dcSweep {
    0% { transform: translateX(-130%) rotate(18deg); }
    60%, 100% { transform: translateX(160%) rotate(18deg); }
  }
  @keyframes dcRevealIn {
    from { opacity: 0; transform: perspective(900px) rotateX(16deg) translateY(34px) translateZ(-40px); }
    to { opacity: 1; transform: perspective(900px) rotateX(0) translateY(0) translateZ(0); }
  }
  @keyframes dcCubeTick {
    0%, 100% { transform: rotateX(0deg); }
    50% { transform: rotateX(-8deg); }
  }
  @keyframes dcHeartbeat {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.12); }
    50% { transform: scale(1); }
    75% { transform: scale(1.08); }
  }
  @keyframes dcScrollCue {
    0%, 100% { transform: translateY(0); opacity: 0.45; }
    50% { transform: translateY(7px); opacity: 1; }
  }
  @keyframes dcGateExit {
    to { opacity: 0; transform: perspective(1000px) rotateY(85deg) scale(0.72); filter: blur(8px); }
  }
  @keyframes dcPetalFall {
    0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.85; }
    100% { transform: translate3d(35px,110vh,0) rotate(340deg); opacity: 0; }
  }

  .dc-reveal { opacity: 0; }
  /* backwards (bukan both): setelah animasi selesai, transform dikembalikan
     ke aturan aslinya agar efek tilt pada kartu tidak ditimpa keyframe. */
  .dc-reveal.dc-visible { opacity: 1; animation: dcRevealIn 0.9s cubic-bezier(.22,1,.36,1) backwards; }
  .dc-reveal[data-delay="1"].dc-visible { animation-delay: 0.12s; }
  .dc-reveal[data-delay="2"].dc-visible { animation-delay: 0.24s; }
  .dc-reveal[data-delay="3"].dc-visible { animation-delay: 0.36s; }

  .dc-tilt {
    transform: perspective(1000px) rotateX(var(--dc-rx, 0deg)) rotateY(var(--dc-ry, 0deg));
    transform-style: preserve-3d;
    transition: transform 0.25s ease-out;
  }
  .dc-layer { transform: translateZ(var(--dc-z, 0px)); }

  .dc-orbit {
    position: absolute;
    border-radius: 999px;
    border: 1px solid rgba(246,214,138,0.42);
    box-shadow: 0 0 24px rgba(246,214,138,0.12), inset 0 0 18px rgba(185,232,255,0.08);
    animation: dcOrbit 20s linear infinite;
  }
  .dc-orbit.reverse { animation-name: dcOrbitReverse; }
  .dc-orbit::after {
    content: "";
    position: absolute;
    top: 8%;
    left: 50%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--dc-gold);
    box-shadow: 0 0 14px 4px rgba(246,214,138,0.55);
  }
  .dc-orb {
    position: absolute;
    border-radius: 999px;
    background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.65), rgba(255,116,168,0.22) 38%, rgba(76,45,160,0.04) 70%);
    opacity: 0.55;
    filter: blur(0.5px);
    animation: dcFloat 8s ease-in-out infinite;
  }
  .dc-sweep {
    position: absolute;
    top: 0;
    height: 100%;
    width: 30px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent);
    animation: dcSweep 5.5s ease-in-out infinite;
    pointer-events: none;
  }
  .dc-portal {
    position: relative;
    transform-style: preserve-3d;
    perspective: 1000px;
  }
  .dc-portal-photo {
    /* Jangan set position di sini: kelas absolute inset-9 di JSX harus menang
       supaya ukuran foto benar-benar 184px, bukan ukuran intrinsik gambar. */
    overflow: hidden;
    border-radius: 46% 46% 38% 38% / 38% 38% 46% 46%;
    border: 1px solid rgba(246,214,138,0.65);
    box-shadow: 0 24px 70px rgba(0,0,0,0.55), 0 0 40px rgba(255,116,168,0.22);
    transform: translateZ(24px);
  }
  .dc-portal-photo img { width: 100%; height: 100%; object-fit: cover; }
  .dc-cube {
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    animation: dcCubeTick 4.5s ease-in-out infinite;
    animation-delay: var(--dc-cube-delay, 0s);
  }
  .dc-cube::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0.24), transparent 45%);
    pointer-events: none;
  }
  .dc-flip-card {
    display: grid;
    width: 100%;
    min-height: 250px;
    transform-style: preserve-3d;
    transition: transform 0.85s cubic-bezier(.22,1,.36,1);
    cursor: pointer;
  }
  .dc-flip-card.is-flipped { transform: rotateY(180deg); }
  /* Kedua sisi menempati sel grid yang sama, sehingga tinggi kartu mengikuti
     konten terpanjang — tidak ada teks yang keluar dari kartu saat dibalik. */
  .dc-flip-face {
    grid-area: 1 / 1;
    position: relative;
    min-height: 250px;
    overflow: hidden;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .dc-flip-back { transform: rotateY(180deg); }
  .dc-gallery-scroller {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 1.4rem 0 2rem;
    scrollbar-width: none;
  }
  .dc-gallery-scroller::-webkit-scrollbar { display: none; }
  .dc-gallery-card {
    flex: 0 0 74%;
    scroll-snap-align: center;
    transform: perspective(900px) rotateY(5deg) scale(0.94);
    transition: transform 0.5s ease, opacity 0.5s ease;
    opacity: 0.75;
  }
  .dc-gallery-card:nth-child(even) { transform: perspective(900px) rotateY(-5deg) scale(0.94); }
  .dc-gallery-card:hover { transform: perspective(900px) rotateY(0) scale(1); opacity: 1; }
  .dc-petal {
    position: absolute;
    top: -12vh;
    width: 8px;
    height: 13px;
    border-radius: 80% 20% 70% 30%;
    background: linear-gradient(135deg, rgba(255,116,168,0.9), rgba(246,214,138,0.5));
    animation: dcPetalFall linear infinite;
    pointer-events: none;
  }
  .dc-gate-closing { animation: dcGateExit 0.85s cubic-bezier(.55,0,.85,.4) forwards; }
  .dc-heartbeat { animation: dcHeartbeat 2.6s ease-in-out infinite; }
  .dc-scroll-cue { animation: dcScrollCue 1.8s ease-in-out infinite; }

  .dc-input {
    width: 100%;
    border-radius: 0.9rem;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.92);
    padding: 0.7rem 0.9rem;
    font-size: 0.875rem;
    color: #201638;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .dc-input:focus { border-color: #ff74a8; box-shadow: 0 0 0 3px rgba(255,116,168,0.18); }

  @media (prefers-reduced-motion: reduce) {
    .dc-root *, .dc-root *::before, .dc-root *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
    .dc-reveal, .dc-reveal.dc-visible { opacity: 1 !important; transform: none !important; }
  }
`;

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".dc-reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("dc-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("dc-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function TiltCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--dc-rx", "0deg");
    element.style.setProperty("--dc-ry", "0deg");
  };

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.setProperty("--dc-ry", `${offsetX * 13}deg`);
    element.style.setProperty("--dc-rx", `${-offsetY * 10}deg`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`dc-tilt ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Petals() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[100svh] overflow-hidden">
      {[10, 28, 47, 66, 84].map((left, index) => (
        <span
          key={left}
          className="dc-petal"
          style={{
            left: `${left}%`,
            animationDuration: `${12 + index * 1.8}s`,
            animationDelay: `${index * 2.2}s`,
            opacity: 0.32,
          }}
        />
      ))}
    </div>
  );
}

export default function DimensiCintaTemplate(props: TemplateProps) {
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(
    isEmbed ? undefined : props.data.musicUrl,
    props.data.musicStart,
    props.data.musicEnd,
  );

  useReveal();

  if (!props.isPublished) return <DraftNotice />;

  const bgUrl =
    props.data.backgroundUrl || getBackgroundUrl(props.decorations) || ASSETS.chapel;
  const resolvedGatePhoto = resolveGatePhoto({
    gatePhotoUrl: props.data.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(props.decorations),
    groomPhotoUrl: props.data.groom?.photoUrl,
    bridePhotoUrl: props.data.bride?.photoUrl,
    firstGalleryUrl: props.data.gallery?.[0]?.url,
  });
  const coverPhoto =
    resolvedGatePhoto === bgUrl || resolvedGatePhoto === ASSETS.gate
      ? undefined
      : resolvedGatePhoto;
  const agenda = splitAgenda(props.data.events, {
    date: props.data.eventDate,
    time: props.data.eventTime,
    venue: [props.data.venueName, props.data.location].filter(Boolean).join(", "),
    mapUrl: props.data.locationMap,
  });

  return (
    <div className="dc-root relative min-h-screen overflow-x-hidden bg-[#080719] font-sans text-[#f8f4ff]">
      <style>{STYLES}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgUrl} alt="" className="h-full w-full object-cover opacity-35" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 6%, rgba(94,48,190,0.55) 0%, rgba(8,7,25,0.25) 55%, rgba(8,7,25,0.94) 100%)",
          }}
        />
      </div>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <span className="dc-orb" style={{ left: "-8%", top: "12%", width: 180, height: 180, animationDelay: "0s" }} />
        <span className="dc-orb" style={{ right: "-10%", top: "42%", width: 230, height: 230, animationDelay: "1.8s" }} />
        <span className="dc-orb" style={{ left: "18%", bottom: "4%", width: 130, height: 130, animationDelay: "3.2s" }} />
      </div>

      {!gateOpen ? (
        <DimensiGate
          groomNick={props.data.groom?.nickname ?? props.data.groom?.name}
          brideNick={props.data.bride?.nickname ?? props.data.bride?.name}
          guestName={props.guestName}
          onOpen={() => {
            setGateOpen(true);
            music.play();
          }}
        />
      ) : null}

      <Cover
        eventName={props.data.eventName ?? "Undangan Pernikahan"}
        groomNick={props.data.groom?.nickname ?? props.data.groom?.name}
        brideNick={props.data.bride?.nickname ?? props.data.bride?.name}
        date={agenda.main.date}
        venue={props.data.venueName ?? props.data.location}
        guestName={props.guestName}
        photo={coverPhoto}
      />
      <Petals />

      {props.data.groom?.name || props.data.bride?.name ? (
        <CoupleSection groom={props.data.groom} bride={props.data.bride} />
      ) : null}
      <CountdownSection date={agenda.main.date} eventName={props.data.eventName} />
      {!props.data.quoteHidden ? (
        <QuoteSection
          title={props.data.quoteTitle}
          text={props.data.quoteText}
          source={props.data.quoteSource}
        />
      ) : null}
      <EventsSection main={agenda.main} events={agenda.additional} />
      {props.data.story?.length ? <StorySection story={props.data.story} /> : null}
      {props.data.gallery?.length ? <GallerySection gallery={props.data.gallery} /> : null}
      {props.data.gifts?.length ? <GiftsSection gifts={props.data.gifts} /> : null}
      <RsvpSection invitationId={props.invitationId} guestName={props.guestName} />
      <WishesSection invitationId={props.invitationId} wishes={props.wishes ?? []} />
      <ClosingSection text={props.data.customMessage} />
      <Footer groomName={props.data.groom?.name} brideName={props.data.bride?.name} />
      <FloatingControls music={props.data.musicUrl ? music : undefined} />
    </div>
  );
}

function DraftNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#080719] px-6 text-center text-white">
      <style>{STYLES}</style>
      <Heart className="dc-heartbeat h-9 w-9 text-[#ff74a8]" />
      <p className="font-[family-name:var(--font-serif-elegant)] text-2xl font-bold">
        Undangan Belum Dipublikasikan
      </p>
      <p className="max-w-sm text-sm text-[#c5b9e8]">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan hubungi kedua mempelai.
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="dc-reveal mx-auto mb-10 max-w-xl text-center">
      <p className="dc-eye text-[10px] font-semibold text-[#f6d68a]">{eyebrow}</p>
      <h2 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#f6d68a]" />
        <Heart className="h-3.5 w-3.5 text-[#ff74a8]" />
        <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#f6d68a]" />
      </div>
      {description ? (
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#c5b9e8]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang 3D                                                          */
/* ------------------------------------------------------------------ */
function DimensiGate({
  groomNick,
  brideNick,
  guestName,
  onOpen,
}: {
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  onOpen?: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const handleOpen = () => {
    if (closing) return;
    setClosing(true);
    timer.current = window.setTimeout(() => onOpen?.(), 820);
  };

  const groomInitial = (groomNick ?? "A").charAt(0).toUpperCase();
  const brideInitial = (brideNick ?? "T").charAt(0).toUpperCase();

  return (
    <div
      role="dialog"
      aria-label="Buka undangan pernikahan"
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-[#07061a] px-5 text-center ${
        closing ? "dc-gate-closing" : ""
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img src={ASSETS.chapel} alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(104,54,205,0.5),rgba(7,6,26,0.94)_68%)]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2">
        <span className="dc-orbit" style={{ inset: 0 }} />
        <span className="dc-orbit reverse" style={{ inset: 34, animationDuration: "14s" }} />
        <span className="dc-orbit" style={{ inset: 72, animationDuration: "26s" }} />
      </div>

      <img
        src={ASSETS.bouquetWhite}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -left-12 top-0 w-100 opacity-70"
        style={{ animation: "dcFloat 7s ease-in-out infinite" }}
      />
      <img
        src={ASSETS.bouquet}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-17 bottom-1 w-150 opacity-70"
        style={{ animation: "dcFloat 8s ease-in-out 1.2s infinite" }}
      />

      <TiltCard className="dc-glass relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] px-6 py-9">
        <span aria-hidden className="dc-sweep" />
        <p className="dc-eye text-[10px] font-bold text-[#f6d68a]">Digital Wedding Invitation</p>
        <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full border border-[#f6d68a]/50 bg-gradient-to-br from-[#ff74a8]/25 to-[#b9e8ff]/10 shadow-[0_0_38px_rgba(246,214,138,0.25)]">
          <span className="font-[family-name:var(--font-script)] text-4xl text-[#fff1bd]">
            {groomInitial} <span className="text-[#ff74a8]">&</span> {brideInitial}
          </span>
        </div>
        <p className="mt-5 font-[family-name:var(--font-script)] text-3xl text-[#ffbcd5]">
          The Wedding of
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold uppercase tracking-wide">
          {groomNick ?? "Groom"} <span className="dc-gold-text">&</span> {brideNick ?? "Bride"}
        </h1>

        <div className="mx-auto mt-6 w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10px] text-[#e7dfff]">
          Kepada Yth. <span className="font-semibold text-white">{guestName ?? "Tamu Undangan"}</span>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          disabled={closing}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff74a8] via-[#f6d68a] to-[#b9e8ff] px-7 py-3 text-sm font-bold text-[#1a1033] shadow-[0_10px_30px_rgba(255,116,168,0.35)] transition hover:scale-[1.03] active:scale-95 disabled:opacity-70"
        >
          <Mail className="h-4 w-4" />
          Buka Undangan
        </button>
        <p className="mt-4 text-[10px] tracking-widest text-[#c5b9e8]">
          KETUK UNTUK MEMASUKI DIMENSI CINTA
        </p>
      </TiltCard>
      <p className="relative z-10 mt-6 text-[10px] tracking-[0.25em] text-white/90">
        SCROLL UNTUK MENJELA
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cover                                                               */
/* ------------------------------------------------------------------ */
function Cover({
  eventName,
  groomNick,
  brideNick,
  date,
  venue,
  guestName,
  photo,
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  date?: string;
  venue?: string;
  guestName?: string;
  photo?: string;
}) {
  return (
    <header className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-10 text-center">
      {/* Semua dekorasi cover dikurung dalam satu lapisan agar tidak pernah
          menambah scrollWidth header (garland 130% & bunga sudut negatif). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.garland}
          alt=""
          className="absolute -top-12 left-1/2 w-[112%] max-w-none -translate-x-1/2 opacity-20"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.corner}
          alt=""
          className="absolute -left-8 top-0 w-75 opacity-30"
          style={{
            animation: "dcFloat 9s ease-in-out infinite",
            ["--dc-rot" as string]: "180deg",
            /* Aset punya sisi patah di kiri + bawah. scaleX(-1) + rotasi 180°
               jadi cermin vertikal: patah kiri + atas → keluar layar. */
            ["--dc-flip" as string]: "-1",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.corner}
          alt=""
          className="absolute -right-8 top-0 w-75 opacity-30"
          style={{
            animation: "dcFloat 9s ease-in-out infinite",
            ["--dc-rot" as string]: "180deg",
          }}
        />
      </div>

      {/* Konten berada di z-10: dekorasi z-0 tidak pernah bisa menutupi
          foto portal maupun teks setelah gerbang dibuka. */}
      <div className="relative z-10 flex w-full flex-col items-center">
      <div className="dc-portal relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
        <span className="dc-orbit" style={{ inset: -18 }} />
        <span className="dc-orbit reverse" style={{ inset: -2, animationDuration: "15s" }} />
        <span className="dc-orbit" style={{ inset: 22, animationDuration: "24s" }} />
        <div className="dc-portal-photo absolute inset-9">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`${groomNick ?? ""} & ${brideNick ?? ""}`} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ASSETS.gate} alt="" />
          )}
        </div>
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,116,168,0.14), transparent 65%)" }}
        />
      </div>

      <p className="dc-eye mt-8 text-[10px] font-bold text-[#f6d68a]">{eventName}</p>
      <h1 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-4xl font-bold sm:text-5xl">
        {groomNick ?? "Groom"} <span className="dc-gold-text">&</span> {brideNick ?? "Bride"}
      </h1>
      <p className="mt-1 font-[family-name:var(--font-script)] text-2xl text-[#ffbcd5] sm:text-3xl">
        A Love Beyond Dimensions
      </p>
      <div className="dc-glass mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-5 py-2 text-[11px] text-[#e7dfff]">
        {date ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-[#f6d68a]" />
            {formatDate(date)}
          </span>
        ) : null}
        {venue ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#ff74a8]" />
            {venue}
          </span>
        ) : null}
      </div>
      {guestName ? (
        <p className="mt-4 text-xs text-[#c5b9e8]">
          With love, for <span className="font-semibold text-white">{guestName}</span>
        </p>
      ) : null}
      </div>

      <div className="dc-scroll-cue absolute bottom-6 z-10 flex flex-col items-center gap-1">
        <span className="text-[10px] tracking-[0.3em] text-white/80">GULIR</span>
        <ChevronDown className="h-4 w-4 text-[#f6d68a]" />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Mempelai                                                            */
/* ------------------------------------------------------------------ */
function CoupleSection({
  groom,
  bride,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
}) {
  return (
    <section id="mempelai" className="relative z-10 px-5 py-20">
      <SectionHeading
        eyebrow="Dua jiwa, satu dimensi"
        title="Pasangan Mempelai"
        description="Dengan memohon rahmat dan ridho-Nya, kami mempersatukan dua perjalanan menjadi satu kisah."
      />
      <div className="relative mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.pampas}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -left-8 -top-8 w-40 opacity-30"
        />
        <PersonCard person={bride} role="Mempelai Wanita" delay={1} />
        <div className="flex items-center justify-center sm:hidden">
          <Heart className="dc-heartbeat h-7 w-7 text-[#ff74a8]" />
        </div>
        <PersonCard person={groom} role="Mempelai Pria" delay={2} />
      </div>
      <div className="relative mx-auto mt-10 hidden max-w-xs items-center justify-center gap-4 sm:flex">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#f6d68a]/60" />
        <Heart className="dc-heartbeat h-7 w-7 text-[#ff74a8]" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#f6d68a]/60" />
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
  delay,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  delay: number;
}) {
  return (
    <div data-delay={delay} className="dc-reveal">
      <TiltCard className="dc-glass rounded-[1.8rem] p-5 text-center sm:p-7">
        <div className="relative mx-auto h-48 w-40 sm:h-56 sm:w-44">
          <span className="dc-orbit" style={{ inset: -8, animationDuration: "22s" }} />
          <div
            className="dc-layer absolute inset-0 overflow-hidden rounded-[48%_48%_36%_36%/36%_36%_48%_48%] border border-[#f6d68a]/40 bg-white/5"
            style={{ ["--dc-z" as string]: "28px" }}
          >
            {person?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photoUrl} alt={person.name ?? role} className="h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-[#f6d68a]">♥</div>
            )}
          </div>
        </div>
        <p className="dc-eye mt-5 text-[10px] font-bold text-[#ffbcd5]">{role}</p>
        <h3 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold">
          {person?.name ?? "Nama Mempelai"}
        </h3>
        {person?.parentName ? (
          <p className="mt-1 text-xs text-[#c5b9e8]">{person.parentName}</p>
        ) : null}
        {person?.bio ? <p className="mt-3 text-xs italic text-white/85">{person.bio}</p> : null}
      </TiltCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Countdown kubus                                                     */
/* ------------------------------------------------------------------ */
function CountdownSection({ date, eventName }: { date?: string; eventName?: string }) {
  const time = useCountdown(date);
  const items = [
    { label: "Hari", value: time.days },
    { label: "Jam", value: time.hours },
    { label: "Menit", value: time.minutes },
    { label: "Detik", value: time.seconds },
  ];

  return (
    <section className="relative z-10 px-5 py-20">
      <SectionHeading
        eyebrow="Menuju hari yang ditunggu"
        title="Hitung Mundur Cinta"
        description="Setiap detik adalah langkah lebih dekat untuk mengucap janji suci."
      />
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2.5 sm:gap-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            data-delay={index % 3}
            className="dc-reveal"
          >
            <div
              className="dc-cube dc-glass rounded-2xl px-1 py-4 text-center sm:py-5"
              style={{ ["--dc-cube-delay" as string]: `${index * 0.35}s` }}
            >
              <span className="block font-[family-name:var(--font-serif-elegant)] text-2xl font-bold tabular-nums text-white sm:text-4xl">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="dc-eye mt-1 block text-[10px] font-semibold text-[#f6d68a] sm:text-[11px]">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      {date ? (
        <div className="dc-reveal mt-8 flex justify-center">
          <SaveToCalendarButton
            title={eventName ?? "Pernikahan Kami"}
            date={date}
            location=""
            className="dc-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-[#fff1bd] transition hover:border-[#f6d68a]/60"
          />
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kutipan                                                             */
/* ------------------------------------------------------------------ */
function QuoteSection({
  title,
  text,
  source,
}: {
  title?: string;
  text?: string;
  source?: string;
}) {
  return (
    <section className="relative z-10 px-5 py-16">
      <div className="dc-reveal mx-auto max-w-2xl">
        <TiltCard className="dc-glass relative overflow-hidden rounded-[2rem] px-7 py-12 text-center">
          <span aria-hidden className="dc-sweep" />
          <Quote className="mx-auto h-9 w-9 text-[#f6d68a]/70" />
          {title ? (
            <p className="dc-eye mt-5 text-[10px] font-bold text-[#ffbcd5]">{title}</p>
          ) : null}
          <p className="mt-4 font-[family-name:var(--font-serif-elegant)] text-xl italic leading-relaxed text-white sm:text-2xl">
            {text ?? "Cinta adalah bahasa yang tidak perlu diterjemahkan."}
          </p>
          {source ? <p className="mt-4 text-xs text-[#c5b9e8]">— {source}</p> : null}
        </TiltCard>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Acara                                                               */
/* ------------------------------------------------------------------ */
function EventsSection({
  main,
  events,
}: {
  main: { date?: string; time?: string; venue?: string; mapUrl?: string };
  events: TemplateProps["data"]["events"];
}) {
  return (
    <section id="acara" className="relative z-10 px-5 py-20">
      <SectionHeading
        eyebrow="Rangkaian acara"
        title="Hari Bahagia Kami"
        description="Kehadiran dan doa Anda adalah hadiah paling berharga di hari istimewa ini."
      />
      <div className="mx-auto max-w-3xl space-y-5">
        <article data-delay="0" className="dc-reveal">
          <TiltCard className="dc-glass overflow-hidden rounded-[1.8rem]">
            <div className="grid sm:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-8">
                <p className="dc-eye text-[10px] font-bold text-[#f6d68a]">Acara Utama</p>
                <h3 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-3xl font-bold">
                  Akad & Resepsi
                </h3>
                <div className="mt-5 grid gap-3 text-sm text-[#e7dfff]">
                  <span className="inline-flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#ff74a8]" />
                    {main.date ? formatDate(main.date) : "Tanggal akan diumumkan"}
                  </span>
                  <span className="inline-flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#f6d68a]" />
                    {main.time ?? "Waktu akan diumumkan"}
                  </span>
                  <span className="inline-flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#b9e8ff]" />
                    {main.venue ?? "Lokasi akan diumumkan"}
                  </span>
                </div>
                {main.mapUrl ? (
                  <a
                    href={main.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f6d68a]/45 px-4 py-2 text-xs font-semibold text-[#fff1bd] transition hover:bg-[#f6d68a]/10"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Buka Peta
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>
          </TiltCard>
        </article>

        {events?.map((event, index) => (
          <article key={event.id} data-delay={index % 3} className="dc-reveal">
            <TiltCard className="dc-glass flex items-start gap-4 rounded-2xl p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ff74a8]/40 bg-[#ff74a8]/10 text-[#ffbcd5]">
                <Heart className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-[family-name:var(--font-serif-elegant)] text-xl font-semibold">
                  {event.title ?? "Acara Tambahan"}
                </h4>
                {event.date ? (
                  <p className="mt-1 text-xs text-[#f6d68a]">{formatDate(event.date)}</p>
                ) : null}
                {event.time ? <p className="mt-1 text-xs text-[#e7dfff]">{event.time}</p> : null}
                {event.location ? (
                  <p className="mt-1 text-xs text-[#c5b9e8]">{event.location}</p>
                ) : null}
                {event.locationMap ? (
                  <a
                    href={event.locationMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#b9e8ff] hover:underline"
                  >
                    Lihat lokasi <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </TiltCard>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kisah cinta — kartu bisa dibalik                                    */
/* ------------------------------------------------------------------ */
type StoryItem = NonNullable<TemplateProps["data"]["story"]>[number];

function StorySection({ story }: { story: StoryItem[] }) {
  const [flippedId, setFlippedId] = useState<string | null>(null);

  return (
    <section id="kisah" className="relative z-10 px-5 py-20">
      <SectionHeading
        eyebrow="Chapter by chapter"
        title="Kisah Cinta Kami"
        description="Ketuk setiap kartu untuk membuka halaman kecil dari perjalanan kami."
      />
      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
        {story.map((item, index) => {
          const flipped = flippedId === item.id;
          return (
            <div key={item.id} data-delay={index % 3} className="dc-reveal">
              <div
                aria-pressed={flipped}
                role="button"
                tabIndex={0}
                onClick={() => setFlippedId(flipped ? null : item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFlippedId(flipped ? null : item.id);
                  }
                }}
                className="dc-flip-card outline-none focus-visible:ring-2 focus-visible:ring-[#f6d68a]"
              >
                <div className="dc-flip-face dc-glass flex flex-col justify-between rounded-[1.8rem] p-6">
                  <div>
                    <span className="dc-eye text-[10px] font-bold text-[#f6d68a]">
                      Chapter {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-4 font-[family-name:var(--font-script)] text-3xl text-[#ffbcd5]">
                      {item.date ? formatDate(item.date) : "Sebuah Hari"}
                    </p>
                    <h3 className="mt-2 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold">
                      {item.title ?? "Cerita Kami"}
                    </h3>
                  </div>
                  <p className="mt-6 inline-flex items-center gap-2 text-xs text-[#c5b9e8]">
                    Ketuk untuk membuka
                    <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg] text-[#f6d68a]" />
                  </p>
                </div>
                <div className="dc-flip-face dc-flip-back dc-glass flex flex-col items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-[#4a227f]/80 to-[#120b32]/90 p-7 text-center">
                  <Heart className="dc-heartbeat h-7 w-7 text-[#ff74a8]" />
                  <h3 className="mt-4 font-[family-name:var(--font-serif-elegant)] text-2xl font-bold">
                    {item.title ?? "Cerita Kami"}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#e7dfff]">
                    {item.description ?? "Cerita ini akan segera ditulis."}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.carriage}
        alt=""
        aria-hidden
        className="pointer-events-none mx-auto mt-8 w-80 opacity-45"
        style={{ animation: "dcFloat 9s ease-in-out infinite" }}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Galeri coverflow                                                    */
/* ------------------------------------------------------------------ */
function GallerySection({ gallery }: { gallery: NonNullable<TemplateProps["data"]["gallery"]> }) {
  const [active, setActive] = useState<{ url: string; caption?: string } | null>(null);

  return (
    <section id="galeri" className="relative z-10 py-20">
      <SectionHeading
        eyebrow="Fragmen waktu"
        title="Galeri Kenangan"
        description="Geser untuk menjelajah momen favorit kami dalam dimensi berbeda."
      />
      <div className="dc-gallery-scroller px-[13%]">
        {gallery.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive({ url: item.url, caption: item.caption })}
            className="dc-gallery-card group overflow-hidden rounded-[1.8rem] text-left"
          >
            <div className="dc-glass overflow-hidden rounded-[1.8rem]">
              <div className="aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? "Foto galeri"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              {item.caption ? (
                <p className="relative z-10 px-4 py-3 text-xs font-medium text-[#e7dfff]">{item.caption}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-label="Lihat foto"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Tutup foto"
            onClick={() => setActive(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white"
          >
            <Heart className="h-5 w-5" />
          </button>
          <figure className="max-w-lg" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.url} alt={active.caption ?? "Foto galeri"} className="max-h-[75vh] w-full rounded-2xl object-contain" />
            {active.caption ? (
              <figcaption className="mt-3 text-center text-sm text-white/90">{active.caption}</figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kado                                                                */
/* ------------------------------------------------------------------ */
function GiftsSection({ gifts }: { gifts: NonNullable<TemplateProps["data"]["gifts"]> }) {
  return (
    <section id="kado" className="relative z-10 px-5 py-16">
      <SectionHeading
        eyebrow="Tanda kasih"
        title="Kado Digital"
        description="Kehadiran Anda sudah cukup, namun jika ingin berbagi rezeki, berikut pilihannya."
      />
      <div className="mx-auto grid max-w-2xl gap-4">
        {gifts.map((gift, index) => (
          <div key={gift.id} data-delay={index % 3} className="dc-reveal">
            <TiltCard className="dc-glass flex items-center gap-4 rounded-2xl p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f6d68a]/40 bg-[#f6d68a]/10">
                <Heart className="h-5 w-5 text-[#f6d68a]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-widest text-[#ffbcd5]">{gift.provider}</p>
                <p className="truncate font-semibold text-white">{gift.name}</p>
                <p className="font-mono text-sm tracking-wide text-[#e7dfff]">{gift.accountNumber}</p>
                <p className="text-xs text-[#c5b9e8]">a.n. {gift.holderName}</p>
              </div>
              <CopyButton
                text={gift.accountNumber}
                className="border border-[#f6d68a]/45 text-[#fff1bd] hover:border-[#f6d68a] hover:bg-[#f6d68a]/10 hover:text-white"
                copiedIconClass="text-[#f6d68a]"
              />
            </TiltCard>
          </div>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.envelope}
        alt=""
        aria-hidden
        className="pointer-events-none mx-auto mt-8 w-80 opacity-70"
        style={{ animation: "dcFloat 8s ease-in-out 1.4s infinite" }}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP                                                                */
/* ------------------------------------------------------------------ */
function RsvpSection({ invitationId, guestName }: { invitationId: string; guestName?: string }) {
  return (
    <section id="rsvp" className="relative z-10 px-5 py-20">
      <SectionHeading
        eyebrow="Konfirmasi kehadiran"
        title="Apakah Kamu Akan Datang?"
        description="Mohon kabari kami sebelum hari istimewa agar tempat dapat disiapkan dengan sempurna."
      />
      <div className="dc-reveal mx-auto max-w-xl">
        <TiltCard className="dc-glass rounded-[2rem] p-6 sm:p-8">
          <RsvpForm
            invitationId={invitationId}
            initialName={guestName}
            accentClass="bg-gradient-to-r from-[#ff74a8] to-[#f6d68a] text-[#1a1033] hover:brightness-110"
            borderClass="dc-input"
            labelClass="text-[#e7dfff]"
            secondaryButtonClass="border border-white/20 bg-white/5 text-[#fff1bd] hover:bg-white/10"
          />
        </TiltCard>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ucapan                                                              */
/* ------------------------------------------------------------------ */
function WishesSection({ invitationId, wishes }: { invitationId: string; wishes: WishItem[] }) {
  return (
    <section id="ucapan" className="relative z-10 px-5 py-16">
      <SectionHeading
        eyebrow="Wedding wall"
        title="Doa & Ucapan"
        description="Titipkan satu kalimat hangat untuk kami berdua."
      />
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="dc-reveal">
          <TiltCard className="dc-glass rounded-[1.8rem] p-6">
            <WishForm
              invitationId={invitationId}
              accentClass="bg-gradient-to-r from-[#b9e8ff] via-[#f6d68a] to-[#ff74a8] text-[#1a1033] hover:brightness-110"
              borderClass="dc-input"
              labelClass="text-[#e7dfff]"
            />
          </TiltCard>
        </div>
        <div className="dc-reveal" data-delay="1">
          <WishList
            wishes={wishes}
            cardClass="border-white/15 bg-white/10 backdrop-blur-md"
            nameClass="text-[#fff1bd]"
            avatarClass="bg-[#ff74a8]/25 text-[#ffbcd5]"
            emptyClass="text-[#d8cdf2]"
            messageClass="text-[#e7dfff]"
            dateClass="text-[#c5b9e8]"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Penutup & footer                                                    */
/* ------------------------------------------------------------------ */
function ClosingSection({ text }: { text?: string }) {
  return (
    <section className="relative z-10 px-5 pb-24 pt-10 text-center">
      <div className="dc-reveal mx-auto max-w-2xl">
        <Heart className="dc-heartbeat mx-auto h-10 w-10 text-[#ff74a8]" />
        <p className="mt-6 font-[family-name:var(--font-serif-elegant)] text-xl italic leading-relaxed text-white sm:text-2xl">
          {text ??
            "Merupakan suatu kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu."}
        </p>
        <p className="mt-6 font-[family-name:var(--font-script)] text-3xl text-[#f6d68a]">
          See you in our next chapter
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.floralBorder}
        alt=""
        aria-hidden
        className="pointer-events-none mx-auto mt-10 w-full max-w-2xl opacity-55"
      />
    </section>
  );
}

function Footer({ groomName, brideName }: { groomName?: string; brideName?: string }) {
  return (
    <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center">
      <p className="font-[family-name:var(--font-serif-elegant)] text-lg text-white/85">
        {groomName ?? "Groom"} <span className="text-[#ff74a8]">&</span> {brideName ?? "Bride"}
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#c5b9e8]">
        <AtSign className="h-3.5 w-3.5 text-[#f6d68a]" />
        Dibuat Oleh Meduta
      </p>
    </footer>
  );
}

function FloatingControls({ music }: { music?: MusicController }) {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      {music ? (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          positionClassName="relative"
          buttonClassName="border border-[#f6d68a]/50 bg-[#251552]/90 text-[#fff1bd] shadow-[0_0_24px_rgba(246,214,138,0.25)]"
          playingIconClassName="h-5 w-5 text-[#f6d68a]"
        />
      ) : null}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Kembali ke atas"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ff74a8]/40 bg-[#251552]/90 text-[#ffbcd5] shadow-lg transition hover:scale-110"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
