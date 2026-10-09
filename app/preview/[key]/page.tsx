import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mapDecorations } from "@/lib/decoration";
import { DEFAULT_SAMPLE_DATA, mergeSampleData } from "@/lib/sample-data";
import TemplateRenderer from "@/components/templates";
import PreviewShell from "@/components/templates/PreviewShell";
import ShotReporter from "@/components/templates/ShotReporter";
import type { InvitationView } from "@/components/templates/types";
import {
  THUMB_INNER_H,
  THUMB_FULL_H,
  thumbVh,
  THUMB_PHONE_W,
} from "@/lib/thumb-constants";

type Props = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ embed?: string; shot?: string; frame?: string }>;
};

const VALID = new Set(["classic", "minimal", "floral", "rustic", "berkreative", "garden", "botanical", "zen", "vogue", "celestial", "scrapbook", "enchanted", "fairytale", "onyx", "purple", "wedflix", "spotify"]);

export const metadata: Metadata = {
  title: "Pratinjau Template | Meduta",
};

// Data contoh: bawaan sistem (lib/sample-data) yang dapat dioverride per
// template lewat Admin Panel → Kelola Template → Data Contoh.
const sampleWishes = [
  {
    id: "w1",
    guestName: "Bapak Ahmad & Ibu Siti",
    message: "Selamat menempuh hidup baru, semoga menjadi keluarga sakinah, mawaddah, warahmah.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "w2",
    guestName: "Rizky Pratama",
    message: "Barakallahu lakuma, semoga langgeng sampai jannah. 🎉",
    createdAt: new Date().toISOString(),
  },
];

export default async function PreviewPage({ params, searchParams }: Props) {
  const { key } = await params;
  const { embed, shot, frame } = await searchParams;
  if (!VALID.has(key)) notFound();

  const template = await prisma.template.findUnique({
    where: { componentKey: key },
    select: {
      defaultMusicUrl: true,
      sampleData: true,
      decorations: {
        include: { asset: { select: { url: true, name: true } } },
        orderBy: { zIndex: "asc" },
      },
    },
  });
  const decorations = mapDecorations(template?.decorations ?? []);
  const mergedSample = mergeSampleData(template?.sampleData);
  const { guestName: sampleGuest, ...sampleData } = mergedSample as InvitationView & {
    guestName?: string;
  };

  const templateNode = (
    <TemplateRenderer
      componentKey={key}
      invitationId="preview-id"
      slug="preview"
      guestName={sampleGuest ?? "Bapak Ahmad & Ibu Siti"}
      data={{ ...sampleData, musicUrl: sampleData.musicUrl || template?.defaultMusicUrl || undefined }}
      isPublished
      embedded={embed === "1" || shot === "1"}
      wishes={sampleWishes}
      decorations={decorations}
    />
  );

  // Mode embed (?embed=1): template polos untuk dijadikan thumbnail live
  // via iframe di landing page / dashboard — tanpa mockup & badge shell.
  // Scrollbar disembunyikan & interaksi dimatikan via <style> (aman SSR,
  // tanpa mutasi DOM yang memicu hydration mismatch).
  if (embed === "1") {
    return (
      <>
        <style>{`
          html, body { scrollbar-width: none; overflow-x: hidden; }
          body::-webkit-scrollbar { display: none; }
          body { pointer-events: none; }
        `}</style>
        {templateNode}
      </>
    );
  }

  // Mode shot (?shot=1): seperti embed, tapi seluruh template dirender
  // "terbuka" dalam kolom sempit khusus untuk penangkapan screenshot
  // full-halaman oleh Chrome headless (pembuatan thumbnail).
  // PENTING: kolom RATA KIRI (bukan margin auto) — Chrome headless memiliki
  // lebar layout minimum ~500px walau window-size 390; jika kolom 390px
  // di-tengahkan, screenshot 390px akan memotong sisi kanan dan menyisakan
  // strip kosong di kiri thumbnail.
  if (shot === "1") {
    return (
      <>
        <style>{`
          html, body { scrollbar-width: none; overflow-x: hidden; margin: 0; height: auto !important; }
          body::-webkit-scrollbar { display: none; }
          body { pointer-events: none; }
          /* Section "satu layar" dirender setinggi viewport ponsel tiruan
             (THUMB_INNER_H ≈ 823px) - PERSIS seperti live iframe, sehingga
             komposisi cover & kartu tamu identik piksel dengan tampilan live.
             100vh/100svh TIDAK dipakai karena window screenshot setinggi
             seluruh halaman (vh = tinggi halaman, bukan layar ponsel). */
          .min-h-screen { min-height: ${THUMB_FULL_H}px !important; }
          [class*="min-h-[100svh]"], [class*="min-h-[100vh]"] { min-height: ${THUMB_FULL_H}px !important; }
          [class*="min-h-[95vh]"] { min-height: ${thumbVh(95)}px !important; }
          [class*="min-h-[92vh]"] { min-height: ${thumbVh(92)}px !important; }
          [class*="min-h-[90svh]"] { min-height: ${thumbVh(90)}px !important; }
          [class*="min-h-[88vh]"] { min-height: ${thumbVh(88)}px !important; }
          [class*="max-h-[80vh]"] { max-height: ${thumbVh(80)}px !important; }
          [class*="max-h-[85vh]"] { max-height: ${thumbVh(85)}px !important; }
          [class*="max-h-[90vh]"] { max-height: ${thumbVh(90)}px !important; }
          /* Thumbnail full-page dirender TANPA scroll — animasi
             reveal-on-scroll (pola <prefix>-reveal / <prefix>-fade-up)
             tidak akan terpicu IntersectionObserver sehingga section di
             bawah lipatan tertangkap opacity 0 (kosong). Paksa semua
             konten terlihat saat penangkapan. */
          [class*="-reveal"], [class*="-fade-up"] {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        `}</style>
        <div style={{ width: THUMB_PHONE_W, margin: "0" }}>{templateNode}</div>
        <ShotReporter />
      </>
    );
  }

  // Mode frame (?frame=1): isi mockup preview — dokumen mandiri yang
  // dirender dalam <iframe> ber-viewport ponsel (390px) oleh PreviewShell.
  // Render via iframe membuat breakpoint Tailwind (sm:/md:) merespons
  // lebar LAYAR PONSEL, bukan lebar browser — mockup kini akurat piksel
  // seperti ponsel asli (sebelumnya layout desktop dijejalkan ke 360px).
  if (frame === "1") {
    return (
      <>
        <style>{`
          html, body { margin: 0; scrollbar-width: none; overflow-x: hidden; }
          /* Scrollbar disembunyikan agar mirip overlay ponsel asli -
             dan lebar konten tetap penuh (scrollbar klasik Windows
             memakan ~17px dari viewport iframe) */
          html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
        `}</style>
        {templateNode}
      </>
    );
  }

  return <PreviewShell>{templateNode}</PreviewShell>;
}
