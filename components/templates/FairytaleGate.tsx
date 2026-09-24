"use client";

import { useEffect, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

/**
 * FairytaleGate — gerbang khusus template Fairytale Dream, adopsi 1:1
 * dari referensi "colorful_floral_fairytale_wedding_invitation.tsx":
 * kartu storybook fairytale-card di tengah latar pastel blur, wreath
 * bunga watercolor dengan monogram pasangan, nama script gradasi
 * pink-purple-teal bercahaya, kutipan dongeng, kotak tamu, dan tombol
 * "Buka Undangan Dongeng" dengan ikon buku + kilau.
 * Kupu-kupu animasi melayang di sekeliling kartu (CSS murni — referensi
 * memakai framer-motion yang tidak tersedia di Meduta).
 *
 * Fitur Meduta tetap utuh: nama tamu dari link undangan, animasi buka
 * lalu onOpen (musik mulai, scroll lepas). Saat animasi penutupan,
 * kartu memudar & membesar persis efek AnimatePresence referensi.
 */

/* Kupu-kupu animasi: kepakan sayap + jalur melayang, murni CSS */
function Butterfly({
  style,
  color = "#ec4899",
  duration = 6,
  delay = 0,
}: {
  style?: React.CSSProperties;
  color?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      aria-hidden
      className="ft-float pointer-events-none absolute z-20"
      style={{ ...style, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
        <g className="ft-wing-l">
          <path
            d="M 50 50 C 20 20, 0 40, 20 70 C 40 90, 50 60, 50 50 Z"
            fill={color}
            opacity="0.85"
          />
        </g>
        <g className="ft-wing-r">
          <path
            d="M 50 50 C 80 20, 100 40, 80 70 C 60 90, 50 60, 50 50 Z"
            fill={color}
            opacity="0.85"
          />
        </g>
        <circle cx="50" cy="50" r="4" fill="#fbbf24" />
      </svg>
    </div>
  );
}

/* Wreath bunga watercolor dengan monogram di tengah (dari referensi) */
function WreathMonogram({ monogram }: { monogram: string }) {
  return (
    <div className="relative mx-auto mb-4 -mt-2 h-28 w-28">
      <svg viewBox="0 0 500 500" className="h-full w-full" fill="none" aria-hidden>
        <defs>
          <linearGradient id="ftGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle cx="250" cy="250" r="210" stroke="url(#ftGold)" strokeWidth="10" strokeDasharray="24 18" className="ft-spin-slow opacity-70" />
        <circle cx="250" cy="250" r="228" stroke="#f472b6" strokeWidth="5" opacity="0.4" />
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 250 250)`}>
            <path d="M 250 20 C 270 5, 290 20, 280 40 C 270 60, 230 60, 220 40 C 210 20, 230 5, 250 20 Z" fill="#ff1493" opacity="0.85" />
            <path d="M 250 15 C 265 0, 280 15, 270 30 C 260 45, 240 45, 230 30 C 220 15, 235 0, 250 15 Z" fill="#ffb6c1" opacity="0.9" />
            <circle cx="250" cy="25" r="14" fill="#fbbf24" />
            <path d="M 220 35 C 190 20, 180 50, 210 55 Z" fill="#34d399" opacity="0.8" />
            <path d="M 280 35 C 310 20, 320 50, 290 55 Z" fill="#2dd4bf" opacity="0.8" />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-serif-elegant)] text-2xl font-bold text-pink-600">
        {monogram}
      </div>
    </div>
  );
}

export default function FairytaleGate({
  eventName = "The Fairytale Wedding Invitation",
  groomNick,
  brideNick,
  guestName,
  onOpen,
  embedded = false,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  onOpen?: () => void;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(embedded);
  const [closing, setClosing] = useState(false);

  // Kunci scroll halaman selama gerbang tertutup
  useEffect(() => {
    if (open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (open) return null;

  const handleOpen = () => {
    if (closing) return;
    setClosing(true);
    // Kartu memudar & membesar dulu (efek AnimatePresence referensi);
    // parent (unmount + musik + scroll) dipanggil setelah animasi selesai.
    window.setTimeout(() => {
      onOpen?.();
      setOpen(true);
    }, 800);
  };

  const names = `${groomNick ?? "Pria"} & ${brideNick ?? "Wanita"}`;
  const monogram = `${(groomNick ?? "P").charAt(0).toUpperCase()} & ${(brideNick ?? "W").charAt(0).toUpperCase()}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-200 via-purple-200 to-sky-200 p-4"
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{FT_GATE_STYLES}</style>

      {/* Kupu-kupu melayang di sekeliling kartu */}
      <Butterfly style={{ top: "12%", left: "12%" }} color="#ec4899" duration={7} />
      <Butterfly style={{ top: "68%", right: "10%" }} color="#8b5cf6" duration={8} delay={0.6} />
      <Butterfly style={{ bottom: "14%", left: "18%" }} color="#14b8a6" duration={6.5} delay={1.2} />
      <Butterfly style={{ top: "20%", right: "18%" }} color="#f59e0b" duration={9} delay={0.3} />

      {/* Kartu storybook — memudar & membesar saat tombol ditekan */}
      <div
        className="ft-gate-card relative z-10 w-full max-w-lg overflow-hidden rounded-[40px] border-4 border-pink-300/80 p-7 text-center shadow-2xl sm:p-12"
        style={{
          transform: closing ? "scale(1.08)" : "scale(1)",
          opacity: closing ? 0 : 1,
          transition: "transform 750ms ease, opacity 750ms ease",
        }}
      >
        <WreathMonogram monogram={monogram} />

        <span className="mb-3 inline-block rounded-full border border-pink-300 bg-pink-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-pink-700">
          {eventName}
        </span>

        <h1
          className="ft-glow-text my-2 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl"
          style={{
            fontFamily: "var(--font-script)",
            backgroundImage: "linear-gradient(to right, #db2777, #9333ea, #0d9488)",
          }}
        >
          {names}
        </h1>

        <p className="mb-6 mt-3 font-[family-name:var(--font-serif-elegant)] text-sm italic text-slate-600 md:text-base">
          &ldquo;Dua hati, satu cerita dongeng abadi. Kami mengundang Anda
          menjadi saksi keajaiban cinta kami.&rdquo;
        </p>

        {/* Kotak tamu */}
        <div className="my-6 rounded-2xl border border-pink-200 bg-white/90 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kepada Yth. Bapak/Ibu/Saudara/i:
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-serif-elegant)] text-xl font-bold text-slate-900">
            {guestName ?? "Tamu Undangan Yang Dihormati"}
          </h3>
        </div>

        {/* Tombol buka — gradasi via inline style agar selalu ter-render
            tajam (kelas gradient Tailwind rawan tak ter-generate) */}
        <button
          type="button"
          onClick={handleOpen}
          style={{
            backgroundImage:
              "linear-gradient(to right, #ec4899 0%, #a855f7 50%, #14b8a6 100%)",
          }}
          className="group flex w-full items-center justify-center gap-3 rounded-full border-2 border-white/60 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <BookOpen className="h-6 w-6 transition-transform group-hover:rotate-12" />
          <span>Buka Undangan Dongeng</span>
          <Sparkles className="h-5 w-5 text-yellow-300" />
        </button>
      </div>
    </div>
  );
}

/* CSS gerbang: kartu storybook SOLID (tanpa blur agar teks selalu tajam),
 * glow teks, kupu-kupu, wreath berputar */
const FT_GATE_STYLES = `
  .ft-gate-card {
    background: linear-gradient(160deg, #fff5fa 0%, #fff0f7 45%, #f0fdfa 100%);
    box-shadow: 0 20px 50px rgba(219,39,119,0.22), inset 0 0 0 1px rgba(255,255,255,0.8);
  }
  .ft-glow-text {
    text-shadow: 0 0 18px rgba(255,20,147,0.35);
  }
  .ft-spin-slow { animation: ftSpin 18s linear infinite; transform-origin: center; }
  @keyframes ftSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes ftFlapL {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(0.25); }
  }
  @keyframes ftFlapR {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(0.25); }
  }
  .ft-wing-l {
    animation: ftFlapL 0.45s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: right center;
  }
  .ft-wing-r {
    animation: ftFlapR 0.45s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: left center;
  }
  @keyframes ftFloatPath {
    0% { transform: translate(0, 0) rotate(0deg); }
    20% { transform: translate(12px, -16px) rotate(8deg); }
    40% { transform: translate(-10px, -10px) rotate(-8deg); }
    60% { transform: translate(10px, -20px) rotate(5deg); }
    80% { transform: translate(-8px, -6px) rotate(-5deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  .ft-float { animation: ftFloatPath 6s ease-in-out infinite; }
`;
