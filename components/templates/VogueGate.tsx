"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Gerbang editorial khusus template Vogue — halaman sampul majalah:
 * masthead "Special Editorial Issue" + nomor edisi dari tanggal acara,
 * nama pasangan tipografis besar, kotak "Exclusively Invited For" untuk
 * tamu, tombol "Buka Undangan Majalah", dan footer ISSN.
 * Perilaku identik dengan InvitationGate (kunci scroll, animasi buka,
 * panggil onOpen agar musik latar mulai) — hanya bahasa visualnya editorial.
 */

/** Nomor edisi & ISSN diturunkan dari tanggal acagar terasa "authored". */
function issueMeta(date?: string) {
  if (!date) return { issue: "N° 01", issn: "ISSN MEDUTA-01" };
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return { issue: "N° 01", issn: "ISSN MEDUTA-01" };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "long" });
  return {
    issue: `N° ${mm} — ${month} ${yyyy}`,
    issn: `ISSN ${yyyy}-${mm}${dd}`,
  };
}

export default function VogueGate({
  eventName = "The Wedding Invitation Of",
  groomNick,
  brideNick,
  eventDate,
  guestName,
  location,
  onOpen,
  /** Background kustom user/admin — tampil redup di belakang sampul. */
  backgroundUrl,
  /** Foto khusus gerbang pilihan user/admin — menggantikan latar bawaan. */
  photoUrl,
}: {
  eventName?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  location?: string;
  onOpen?: () => void;
  backgroundUrl?: string;
  photoUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const { issue, issn } = issueMeta(eventDate);

  // Kunci scroll halaman selama gerbang tertutup (lepas otomatis saat terbuka)
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
    window.setTimeout(() => setOpen(true), 700);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#151513] text-[#F9F8F3] ${
        closing ? "animate-gate-open" : ""
      }`}
      role="dialog"
      aria-label="Buka undangan"
    >
      {/* Latar: background kustom user/admin (redup, grayscale) atau gradasi editorial */}
      {(photoUrl || backgroundUrl) ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl || backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(21,21,19,0.82), rgba(21,21,19,0.94))",
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, #262622 0%, #151513 55%, #0E0E0D 100%)",
          }}
        />
      )}

      {/* Masthead atas — khas halaman sampul majalah */}
      <div className="animate-fade-up relative z-10 px-6 pt-7 sm:px-10 sm:pt-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase leading-relaxed tracking-[0.45em] text-[#8E8B84]">
              Special Editorial
              <br />
              Issue
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[11px] tracking-wide text-[#DCD8CE]">
              {issue}
            </p>
          </div>
          <span className="inline-block shrink-0 border border-[#F9F8F3]/35 px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] text-[#DCD8CE]">
            Limited Edition
          </span>
        </div>
        <div className="mt-5 h-px bg-[#F9F8F3]/15" />
      </div>

      {/* Tengah — judul sampul + penerima undangan */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-6 text-center">
        <p className="animate-fade-up text-[10px] uppercase tracking-[0.45em] text-[#A3A099]">
          {eventName}
        </p>
        <h1 className="animate-fade-up-delay-1 mt-4 font-[family-name:var(--font-display)] text-5xl italic leading-[1.08] sm:text-6xl">
          {groomNick ?? "Pria"}
          <span className="mx-2.5 font-[family-name:var(--font-serif-elegant)] text-4xl not-italic text-[#C9C5BC] sm:text-5xl">
            &amp;
          </span>
          {brideNick ?? "Wanita"}
        </h1>

        <div className="animate-fade-up-delay-2 mt-8 border border-[#F9F8F3]/25 bg-[#F9F8F3]/[0.04] px-8 py-4">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#A3A099]">
            Exclusively Invited For
          </p>
          <p className="mt-1.5 font-[family-name:var(--font-display)] text-2xl italic">
            {guestName || "Tamu Undangan"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="animate-fade-up-delay-3 group mt-10 inline-flex w-full max-w-xs items-center bg-[#A6A396] px-6 py-4 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-[#1B1B18] shadow-2xl shadow-black/40 transition-all duration-300 hover:bg-[#F9F8F3] active:scale-[0.98]"
        >
          <span className="flex-1 text-center">Buka Undangan Majalah</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* Footer edisi */}
      <div className="relative z-10 px-6 pb-6 sm:px-10 sm:pb-8">
        <div className="h-px bg-[#F9F8F3]/15" />
        <p className="animate-fade-up-delay-4 mt-4 font-[family-name:var(--font-display)] text-xs text-[#DCD8CE]">
          {issn}
        </p>
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.35em] text-[#8E8B84]">
          {location ? location.toUpperCase() : "Special Wedding Edition"}
        </p>
      </div>
    </div>
  );
}
