"use client";

import { useEffect, useState } from "react";
import { Gunungan, ParangStrip, WayangSilhouette, PARANG_URL } from "./WayangDecor";
import { formatDate } from "./types";

/**
 * WayangGate — gerbang template "Wayang Adat", adopsi 1:1 dari referensi
 * HTML "The Wedding of Raden Bagas & Ayu Laras":
 * - Latar gradasi hijau-gelap + dua strip batik parang bergersak di sisi.
 * - Panggung: dua wayang mengapit gunungan emas bercahaya (lampu blencong).
 * - "THE WEDDING OF" + nama pasangan serif besar + "&" script emas.
 * - Save the date, "Kepada Yth." nama tamu, tombol "Buka Undangan".
 * Animasi CSS murni (fade-in bertahap, wayang sway, lampu kelap-kelip).
 */

const GOLD = "#b98f3e";
const GOLD_L = "#e2c274";
const GREEN = "#1f3a2b";
const GREEN_D = "#14261c";
const SOGAN_D = "#3e2515";

export default function WayangGate({
  groomNick,
  brideNick,
  guestName,
  eventDate,
  eventName,
  photoUrl,
  onOpen,
  embedded = false,
}: {
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  eventDate?: string;
  eventName?: string;
  photoUrl?: string;
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
    onOpen?.();
    window.setTimeout(() => setOpen(true), 750);
  };

  const groom = groomNick ?? "Pria";
  const bride = brideNick ?? "Wanita";

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden text-center ${
        closing ? "wy-out" : ""
      }`}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{GATE_STYLES}</style>

      {/* Latar: foto kustom (pilih user/admin) > gradasi hijau + keemasan */}
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: photoUrl
            ? "linear-gradient(180deg, rgba(15,33,24,0.72), rgba(20,38,28,0.86))"
            : `radial-gradient(ellipse at 50% 36%, rgba(226,194,116,0.26), transparent 58%), linear-gradient(180deg, #0f2118, ${GREEN} 58%, ${SOGAN_D})`,
        }}
      />

      {/* Strip parang kiri-kanan (bergerak pelan) */}
      <div
        aria-hidden
        className="wy-parang-edge wy-edge-l"
        style={{ backgroundImage: `${PARANG_URL}, linear-gradient(rgba(20,10,5,.6), rgba(20,10,5,.6))` }}
      />
      <div
        aria-hidden
        className="wy-parang-edge wy-edge-r"
        style={{ backgroundImage: `${PARANG_URL}, linear-gradient(rgba(20,10,5,.6), rgba(20,10,5,.6))` }}
      />

      {/* Bingkai halus */}
      <div
        aria-hidden
        className="pointer-events-none z-[1]"
        style={{
          position: "fixed",
          inset: "14px",
          border: "1px solid rgba(226,194,116,.5)",
          boxShadow: "inset 0 0 0 5px rgba(226,194,116,.08)",
        }}
      />

      {/* Konten */}
      <div className="wy-in relative z-[2] flex h-full flex-col items-center justify-center px-8">
        {/* Panggung wayang: gunungan dengan aura blencong */}
        <div className="wy-stage relative flex items-end justify-center">
          {/* Aura lampu blencong */}
          <div aria-hidden className="wy-lamp" />
          <div aria-hidden className="wy-side-figure">
            <WayangSilhouette gender="female" />
          </div>
          <Gunungan className="wy-gunungan float-slow" stroke={GOLD_L} strokeWidth={1.4} />
          <div aria-hidden className="wy-side-figure wy-flip">
            <WayangSilhouette gender="male" />
          </div>
        </div>

        <p className="wy-fade-up wy-k" style={{ animationDelay: "0.3s" }}>
          {eventName ?? "THE WEDDING OF"}
        </p>

        <h1 className="wy-fade-up wy-names" style={{ animationDelay: "0.55s" }}>
          {groom}
          <em>&amp;</em>
          {bride}
        </h1>

        {eventDate ? (
          <p className="wy-fade-up wy-date" style={{ animationDelay: "0.8s" }}>
            Save the Date
            <br />
            <span>{formatDate(eventDate)}</span>
          </p>
        ) : null}

        {guestName ? (
          <div className="wy-fade-up mt-6" style={{ animationDelay: "0.95s" }}>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#e2c274]/85">
              Kepada Yth.
            </p>
            <p className="mt-1 text-lg font-medium tracking-wide text-white">
              {guestName}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleOpen}
          className="wy-fade-up wy-btn mt-9"
          style={{ animationDelay: "1.1s" }}
        >
          Buka Undangan
        </button>
      </div>
    </div>
  );
}

/* Animasi & ornamen gerbang */
const GATE_STYLES = `
  :root {
    --wy-gold: ${GOLD};
    --wy-gold-l: ${GOLD_L};
    --wy-green: ${GREEN};
    --wy-green-d: ${GREEN_D};
  }
  @keyframes wyFadeIn {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; }
  }
  .wy-fade-up { opacity: 0; animation: wyFadeIn 1.3s ease forwards; }

  @keyframes wyDrift { to { background-position: 96px 96px; } }
  .wy-parang-edge {
    position: absolute; top: 0; bottom: 0; z-index: 1; width: min(11vw, 84px);
    background-size: 48px 48px, auto;
    animation: wyDrift 50s linear infinite;
    opacity: .9;
  }
  .wy-edge-l { left: 0; border-right: 2px solid rgba(226,194,116,.6); }
  .wy-edge-r { right: 0; border-left: 2px solid rgba(226,194,116,.6); }

  @keyframes wyFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .float-slow { animation: wyFloat 6s ease-in-out infinite; }

  .wy-stage { gap: clamp(4px, 2.5vw, 18px); height: clamp(170px, 32svh, 280px); margin-bottom: clamp(14px, 3svh, 24px); }
  .wy-stage > * { position: relative; z-index: 1; }
  .wy-stage .wy-gunungan { height: 88%; width: auto; }
  .wy-side-figure { height: 100%; aspect-ratio: 104/200; color: #e2c274; opacity: .85; }
  .wy-flip .wy-fig { transform: scaleX(-1); }
  .wy-side-figure svg { height: 100%; width: 100%; }
  .wy-lamp {
    position: absolute; z-index: 0; left: 50%; top: 50%; transform: translate(-50%,-50%);
    width: min(82vw, 420px); aspect-ratio: 1; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,214,120,.4), rgba(226,194,116,.12) 42%, transparent 68%);
    animation: wyFlick 3.2s ease-in-out infinite;
  }

  @keyframes wySway { 0%,100% { transform: rotate(-1.8deg); } 50% { transform: rotate(1.8deg); } }
  .wy-fig { transform-origin: 50% 100%; animation: wySway 6s ease-in-out infinite; }
  .wy-flip .wy-fig { animation-delay: -3s; }
  @keyframes wyArm { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(12deg); } }
  .wy-arm { transform-origin: 60px 68px; animation: wyArm 4.5s ease-in-out infinite; }
  @keyframes wyNod { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(3deg); } }
  .wy-hd { transform-origin: 58px 50px; animation: wyNod 5s ease-in-out infinite; }

  /* Teks gerbang */
  .wy-k { letter-spacing: .34em; font-size: clamp(11px, 3vw, 13px); color: ${GOLD_L}; margin-bottom: 6px; }
  .wy-names {
    font-family: var(--font-serif-elegant), Georgia, serif;
    font-weight: 600;
    font-size: clamp(46px, 14vw, 88px);
    line-height: 1.02;
    color: #fff;
    text-shadow: 0 2px 24px rgba(0,0,0,.5);
  }
  .wy-names em {
    display: block;
    font-family: var(--font-script), cursive;
    font-weight: 400;
    font-size: .55em;
    line-height: 1.1;
    color: ${GOLD_L};
    margin: 4px 0;
  }
  .wy-date {
    margin: clamp(12px, 2.5svh, 20px) 0 clamp(18px, 3.5svh, 28px);
    font-weight: 300; letter-spacing: .14em; line-height: 1.6; color: rgba(255,255,255,.85);
  }
  .wy-date span {
    display: block;
    font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600;
    font-size: clamp(19px, 5vw, 24px); letter-spacing: .1em; color: ${GOLD_L};
  }

  .wy-btn {
    min-width: min(100%, 230px);
    padding: 14px 30px;
    border: 1px solid ${GOLD};
    border-radius: 2px;
    background: linear-gradient(135deg, ${GOLD_L}, ${GOLD});
    color: ${GREEN_D};
    font-size: 14px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase;
    cursor: pointer;
    transition: transform .4s, box-shadow .4s;
  }
  .wy-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(185,143,62,.4); }

  @keyframes wyOut {
    to { opacity: 0; transform: translateY(-100%) scale(1.03); }
  }
  .wy-out { animation: wyOut 1s cubic-bezier(.7,0,.2,1) forwards; pointer-events: none; }

  @media (prefers-reduced-motion: reduce) {
    .wy-fig, .wy-arm, .wy-hd, .wy-lamp, .wy-parang-edge, .float-slow, .wy-fade-up { animation: none !important; }
    .wy-fade-up { opacity: 1 !important; }
  }
`;
