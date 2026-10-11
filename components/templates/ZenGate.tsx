"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

/**
 * ZenGate — gerbang undangan khusus template Zen Minimalist, sesuai
 * desain referensi: latar terang hangat (off-white), eyebrow
 * "THE WEDDING INVITATION" tracking lebar, lingkaran sapuan tinta
 * (ensō) tipis di tengah berisi nama pasangan serif besar + tanggal,
 * kutipan italic, dan tombol gelap charcoal "BUKA UNDANGAN >".
 *
 * Fitur Meduta tetap utuh: nama tamu dari link undangan, foto gerbang
 * (user > admin > mempelai > galeri) tampil halus di dalam lingkaran
 * bila diunggah, background kustom redup, animasi buka 0.7 dtk, musik
 * dimulai saat tombol ditekan (via onOpen).
 */

const ZEN = {
  bg: "#FAF7F2",
  ink: "#2B2B28",
  soft: "#8A8A82",
  sage: "#788A75",
  hairline: "rgba(43,43,40,0.14)",
} as const;

const GATE_STYLES = `
  .zengate-ink {
    border: 1.5px solid rgba(43, 43, 40, 0.35);
    border-top-color: rgba(43, 43, 40, 0.5);
    border-right-color: rgba(43, 43, 40, 0.18);
    border-bottom-color: rgba(43, 43, 40, 0.3);
    border-left-color: rgba(43, 43, 40, 0.22);
    border-radius: 9999px;
    /* sapuan ensō tidak sempurna */
    filter: url(#none);
    transform: rotate(-8deg);
  }
  .zengate-serif {
    font-family: var(--font-serif-elegant), Georgia, serif;
  }
  .zengate-btn {
    background: ${ZEN.ink};
    transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  }
  .zengate-btn:hover {
    background: #444440;
    transform: translateY(-1px);
    box-shadow: 0 14px 28px -10px rgba(43, 43, 40, 0.45);
  }
  .zengate-btn:active {
    transform: scale(0.97);
  }
  @keyframes zengate-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .zengate-f1 { animation: zengate-fade-up 0.8s ease 0.05s both; }
  .zengate-f2 { animation: zengate-fade-up 0.9s ease 0.25s both; }
  .zengate-f3 { animation: zengate-fade-up 0.9s ease 0.5s both; }
  .zengate-f4 { animation: zengate-fade-up 0.9s ease 0.75s both; }
`;

export default function ZenGate({
  eventName = "The Wedding Invitation",
  groomNick,
  brideNick,
  eventDate,
  guestName,
  tagline,
  onOpen,
  backgroundUrl,
  photoUrl,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  tagline?: string;
  onOpen?: () => void;
  backgroundUrl?: string;
  photoUrl?: string;
}) {
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);

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

  // Tanggal format enso: DD . MM . YYYY
  const d = eventDate ? new Date(eventDate) : null;
  const dateLabel =
    d && !Number.isNaN(d.getTime())
      ? [
          String(d.getDate()).padStart(2, "0"),
          String(d.getMonth() + 1).padStart(2, "0"),
          d.getFullYear(),
        ].join(" . ")
      : "";

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden px-6 text-center ${
        closing ? "animate-gate-open" : ""
      }`}
      style={{ background: ZEN.bg }}
      role="dialog"
      aria-label="Buka undangan"
    >
      <style>{GATE_STYLES}</style>

      {/* Background kustom user/admin (sangat redup di belakang) */}
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10"
        />
      )}

      {/* Tekstur kertas halus */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(43,43,40,0.035) 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />

      {/* Eyebrow — THE WEDDING INVITATION + garis kecil */}
      <div className="zengate-f1 relative z-10 flex flex-col items-center">
        <p
          className="zengate-serif text-[11px] font-medium uppercase sm:text-xs"
          style={{ color: ZEN.soft, letterSpacing: "0.42em" }}
        >
          {eventName}
        </p>
        <span
          className="mt-3 block h-px w-10"
          style={{ background: ZEN.hairline }}
          aria-hidden
        />
      </div>

      {/* Lingkaran ensō */}
      <div className="zengate-f2 relative z-10 mt-10 mb-9 flex flex-col items-center">
        <div className="relative flex h-52 w-52 items-center justify-center sm:h-60 sm:w-60">
          {/* Sapuan tinta */}
          <div className="zengate-ink absolute inset-0" aria-hidden />
          {/* Foto gerbang (opsional) — memenuhi lingkaran; nama pindah ke bawah */}
          {photoUrl ? (
            <div
              className="absolute inset-3 overflow-hidden rounded-full"
              style={{ border: `1px solid ${ZEN.hairline}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Foto pasangan"
                className="h-full w-full object-cover"
                style={{ filter: "saturate(0.88) contrast(1.02)" }}
              />
            </div>
          ) : (
            /* Tanpa foto: nama + tanggal di dalam lingkaran (persis referensi) */
            <div className="relative z-10 px-6 text-center">
              <h1
                className="zengate-serif text-4xl leading-tight sm:text-[2.6rem]"
                style={{ color: ZEN.ink }}
              >
                {groomNick ?? "Pria"}
                <span
                  className="mx-2 text-2xl italic sm:text-3xl"
                  style={{ color: ZEN.sage }}
                >
                  &amp;
                </span>
                {brideNick ?? "Wanita"}
              </h1>
              {dateLabel && (
                <p
                  className="mt-2 text-[11px] font-medium"
                  style={{ color: ZEN.soft, letterSpacing: "0.5em" }}
                >
                  {dateLabel}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Dengan foto: nama + tanggal tampil di bawah lingkaran */}
        {photoUrl && (
          <div className="mt-5 text-center">
            <h1
              className="zengate-serif text-4xl leading-tight sm:text-[2.6rem]"
              style={{ color: ZEN.ink }}
            >
              {groomNick ?? "Pria"}
              <span
                className="mx-2 text-2xl italic sm:text-3xl"
                style={{ color: ZEN.sage }}
              >
                &amp;
              </span>
              {brideNick ?? "Wanita"}
            </h1>
            {dateLabel && (
              <p
                className="mt-2 text-[11px] font-medium"
                style={{ color: ZEN.soft, letterSpacing: "0.5em" }}
              >
                {dateLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nama tamu (bila ada link undangan) */}
      {guestName && (
        <div className="zengate-f3 relative z-10 mb-6">
          <p
            className="text-[10px] uppercase"
            style={{ color: ZEN.soft, letterSpacing: "0.4em" }}
          >
            Kepada Yth.
          </p>
          <p
            className="zengate-serif mt-1 text-xl capitalize"
            style={{ color: ZEN.ink }}
          >
            {guestName}
          </p>
        </div>
      )}

      {/* Kutipan */}
      <p
        className="zengate-f3 zengate-serif relative z-10 mb-9 max-w-xs text-sm italic leading-relaxed sm:max-w-sm sm:text-[15px]"
        style={{ color: ZEN.soft }}
      >
        &ldquo;
        {tagline ??
          "Dua jiwa menyatu dalam harmoni, tumbuh bersama dalam ketenteraman dan kedamaian."}
        &rdquo;
      </p>

      {/* Tombol buka — charcoal */}
      <button
        type="button"
        onClick={handleOpen}
        className="zengate-btn zengate-f4 group relative z-10 inline-flex items-center gap-3 px-9 py-3.5 text-xs font-semibold uppercase shadow-lg"
        style={{ color: "#FAF7F2", letterSpacing: "0.28em" }}
      >
        Buka Undangan
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: "#C9C4B8" }}
        />
      </button>
    </div>
  );
}
