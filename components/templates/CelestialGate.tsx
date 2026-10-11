"use client";

import { useEffect, useState } from "react";
import { Moon, Sparkles } from "lucide-react";

/**
 * CelestialGate — gerbang undangan khusus template Celestial Night,
 * sesuai desain referensi: kartu glass gelap di tengah langit navy
 * bercahaya ungu, badge bulan emas, nama pasangan gradasi emas,
 * tagline kutipan, kotak tamu berbingkai, dan tombol emas berkilau.
 * Fitur Meduta tetap utuh: nama tamu dari link undangan, background
 * kustom user/admin tampil redup di belakang, animasi buka 0.7 dtk,
 * musik latar dimulai saat tombol ditekan (via onOpen).
 */

/* Palet — konsisten dengan CelestialTemplate */
const CEL = {
  bg: "#050814",
  gold: "#E6C875",
  goldSoft: "#F3E5AB",
  purple: "#C084FC",
  line: "rgba(230, 200, 117, 0.25)",
} as const;

const GATE_STYLES = `
  .celgate-glow {
    background:
      radial-gradient(ellipse 90% 65% at 50% 45%, rgba(88, 28, 135, 0.45), transparent 70%),
      radial-gradient(ellipse 60% 45% at 50% 100%, rgba(192, 132, 252, 0.12), transparent 70%),
      ${CEL.bg};
  }
  .celgate-card {
    /* Solid gradient — TANPA backdrop-blur agar teks selalu tajam
       (blur pada elemen ber-teks dirender kabur oleh rasterisasi layer) */
    background: linear-gradient(165deg, rgba(13, 19, 36, 0.99) 0%, rgba(9, 13, 25, 0.99) 55%, rgba(16, 10, 32, 0.99) 100%);
    border: 1px solid ${CEL.line};
    box-shadow:
      0 0 60px rgba(126, 34, 206, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .celgate-guestbox {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(230, 200, 117, 0.22);
  }
  .celgate-btn {
    background: linear-gradient(135deg, #F8D974 0%, ${CEL.gold} 55%, #C99B2E 100%);
    box-shadow:
      0 8px 28px rgba(230, 200, 117, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
    transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  }
  .celgate-btn:hover {
    transform: translateY(-1px) scale(1.03);
    filter: brightness(1.06);
    box-shadow:
      0 10px 34px rgba(230, 200, 117, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }
  .celgate-btn:active {
    transform: scale(0.97);
  }
  @keyframes celgate-twinkle {
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
  }
  .celgate-star {
    position: absolute;
    border-radius: 9999px;
    background: #fff;
    animation: celgate-twinkle var(--dur, 3s) ease-in-out infinite;
  }
`;

/* Bintang deterministik (seeded) agar SSR & client identik — tanpa hydration mismatch */
function seededStars(count: number) {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: rand() * 100,
    top: rand() * 100,
    size: 1 + rand() * 2,
    dur: 2 + rand() * 3,
    delay: rand() * 3,
    gold: rand() > 0.75,
  }));
}

export default function CelestialGate({
  eventName = "The Celestial Wedding Of",
  groomNick,
  brideNick,
  guestName,
  tagline,
  onOpen,
  backgroundUrl,
  /** Foto khusus gerbang pilihan user/admin — menggantikan latar bawaan. */
  photoUrl,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  tagline?: string;
  onOpen?: () => void;
  backgroundUrl?: string;
  photoUrl?: string;
}) {
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);
  const stars = seededStars(70);

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
    onOpen?.();
    // Unmount setelah animasi buka selesai (0.7 dtk)
    window.setTimeout(() => setOpen(true), 700);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center overflow-hidden celgate-glow text-center ${
        closing ? "animate-gate-open" : ""
      }`}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{GATE_STYLES}</style>

      {/* Background kustom user/admin (redup di bawah kartu) */}
      {(photoUrl || backgroundUrl) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl || backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}

      {/* Langit berbintang */}
      <div className="absolute inset-0" aria-hidden>
        {stars.map((s) => (
          <span
            key={s.id}
            className="celgate-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: s.gold ? CEL.gold : "#fff",
              ["--dur" as string]: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Kartu glass utama */}
      <div
        className="celgate-card relative z-10 mx-4 w-full rounded-3xl px-8 py-12 sm:mx-6"
        style={{ maxWidth: 400 }}
      >
        {/* Badge bulan emas */}
        <div
          className="relative mx-auto mb-7 flex items-center justify-center rounded-full"
          style={{
            width: 74,
            height: 74,
            border: "1px solid rgba(252, 211, 77, 0.4)",
            background: "#1a1030",
            boxShadow: "0 0 30px rgba(192,132,252,0.35)",
          }}
        >
          <Moon
            className="text-amber-300"
            style={{ width: 32, height: 32 }}
            strokeWidth={1.5}
          />
          <Sparkles
            className="absolute text-amber-200"
            style={{ width: 20, height: 20, right: -6, top: -6 }}
            strokeWidth={1.5}
          />
        </div>

        {/* Eyebrow */}
        <p
          className="animate-fade-up uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.42em",
            color: CEL.goldSoft,
          }}
        >
          {eventName}
        </p>

        {/* Nama pasangan gradasi emas */}
        <h1
          className="animate-fade-up-delay-1 cel-gold-text mt-3 font-[family-name:var(--font-display)] font-bold leading-tight"
          style={{ fontSize: "clamp(2rem, 9vw, 2.6rem)" }}
        >
          {groomNick ?? "Pria"} &amp; {brideNick ?? "Wanita"}
        </h1>

        {/* Tagline kutipan */}
        <p className="animate-fade-up-delay-2 mt-3 font-[family-name:var(--font-serif-elegant)] text-sm italic text-white/70">
          &ldquo;{tagline ?? "Two stars aligning into one constellation"}&rdquo;
        </p>

        {/* Kotak tamu */}
        <div
          className="celgate-guestbox animate-fade-up-delay-3 mt-9 rounded-xl px-5 py-4"
        >
          <p style={{ fontSize: 11, letterSpacing: "0.04em" }} className="text-white/60">
            Kepada Yth. Bapak/Ibu/Saudara/i
          </p>
          <p className="cel-gold-text mt-1 font-[family-name:var(--font-display)] font-semibold" style={{ fontSize: 20 }}>
            {guestName ?? "Tamu Undangan"}
          </p>
        </div>

        {/* Tombol emas berkilau */}
        <button
          type="button"
          onClick={handleOpen}
          className="celgate-btn animate-fade-up-delay-4 mt-10 inline-flex items-center gap-2.5 rounded-full font-[family-name:var(--font-display)] font-bold uppercase text-[#3a2a05]"
          style={{ padding: "14px 36px", fontSize: 12, letterSpacing: "0.22em" }}
        >
          Buka Undangan
          <Sparkles style={{ width: 16, height: 16 }} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
