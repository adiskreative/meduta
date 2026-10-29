"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Halaman FAQ (Tanya Jawab) Meduta — accordion yang bisa dibuka-tutup.
 * Berada di route group (legal) agar navbar/footer konsisten.
 */

const FAQS: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Umum",
    items: [
      {
        q: "Apa itu Meduta?",
        a: "Meduta adalah platform undangan pernikahan digital. Anda memilih template, mengisi data mempelai dan acara, lalu membagikan link undangan ke tamu - lengkap dengan RSVP, dinding ucapan, musik latar, galeri foto, dan peta lokasi dalam satu tempat.",
      },
      {
        q: "Apakah Meduta gratis?",
        a: "Ya, Anda bisa mulai gratis tanpa kartu kredit: 1 undangan dengan template dasar, RSVP, dan wedding wall. Template dan fitur premium ditandai label \"Premium\" dan dapat dinikmati sesuai paket yang tersedia.",
      },
      {
        q: "Apakah undangan bisa dibuka di semua perangkat?",
        a: "Bisa. Semua template dirancang mobile-first - tampil sempurna di ponsel tamu - dan tetap rapi saat dibuka dari tablet maupun desktop.",
      },
    ],
  },
  {
    group: "Membuat Undangan",
    items: [
      {
        q: "Bagaimana langkah membuat undangan?",
        a: "Daftar akun → pilih template di halaman Pilih Tema → isi data di dashboard (mempelai, acara, galeri, kado, cerita) → atur musik & background jika ingin → buat daftar tamu di menu Kirim Undangan → bagikan link personal ke tiap tamu.",
      },
      {
        q: "Apakah data yang saya isi bisa diedit lagi?",
        a: "Bisa kapan saja. Semua form di dashboard tersimpan per bagian - buka kembali formnya, ubah, lalu simpan. Perubahan langsung tampil di undangan tanpa perlu kirim ulang link.",
      },
      {
        q: "Bagaimana cara mengganti foto mempelai dan galeri?",
        a: "Buka menu Mempelai untuk foto pasangan dan Galeri untuk foto tambahan. Foto besar (di atas 3MB) dikompres otomatis di browser sebelum diunggah, jadi Anda tidak perlu resize manual. Format yang didukung: JPG/PNG/WebP.",
      },
      {
        q: "Bisakah mengganti background template?",
        a: "Bisa. Di dashboard tersedia menu Background - pilih dari galeri aset atau unggah foto sendiri. Pilihan background Anda dipakai di undangan, menggantikan bawaan template.",
      },
      {
        q: "Bisakah menambahkan musik pilihan sendiri?",
        a: "Bisa. Di menu Musik, unggah file MP3/WAV/OGG/M4A (maksimal 10MB). Musik otomatis mengalun saat tamu menekan tombol Buka Undangan, dan tamu dapat mematikannya lewat tombol speaker.",
      },
    ],
  },
  {
    group: "Tamu & Undangan",
    items: [
      {
        q: "Bagaimana cara memberi nama tamu di undangan?",
        a: "Di menu Kirim Undangan, ketik daftar nama tamu lalu klik Generate. Sistem membuat link personal per tamu - nama tamu otomatis muncul di halaman pembuka undangan (\"Kepada Yth. ...\"). Daftar link tersimpan dan bisa disalin ulang kapan saja.",
      },
      {
        q: "Apa itu RSVP dan bagaimana bekerjanya?",
        a: "RSVP memungkinkan tamu konfirmasi kehadiran (hadir/tidak hadir) beserta jumlah pendamping langsung dari undangan. Semua jawaban masuk ke dashboard Anda sehingga mudah dihitung untuk katering dan tempat duduk.",
      },
      {
        q: "Apakah ucapan tamu bisa dimoderasi?",
        a: "Ya. Ucapan dan doa tamu tampil di wedding wall, dan Anda dapat menyetujui/menyembunyikan ucapan tertentu dari dashboard sebelum tampil publik.",
      },
    ],
  },
  {
    group: "Lainnya",
    items: [
      {
        q: "Apakah link undangan saya akan kedaluwarsa?",
        a: "Tidak. Selama akun Anda aktif, link undangan dan seluruh datanya tetap dapat diakses - tamu yang menyimpan link lama tetap bisa membukanya.",
      },
      {
        q: "Saya menemukan masalah atau error, kemana harus lapor?",
        a: "Hubungi kami lewat WhatsApp 0823 9988 9992 (respon tercepat) atau email admin@meduta.my.id. Sertakan nama akun/email terdaftar dan tangkapan layar masalahnya agar kami bisa membantu lebih cepat.",
      },
    ],
  },
  {
    group: "Transaksi & Pembayaran",
    items: [
      {
        q: "Apakah Uang Saya Akan dikembalikan jika gagal pembayaran?",
        a: "Ya, jika pembayaran gagal, uang Anda akan dikembalikan ke rekening yang digunakan untuk pembayaran.",
      },
    ],
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
        Bantuan
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
        Tanya Jawab (FAQ)
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        Pertanyaan yang paling sering diajukan tentang Meduta. Tidak menemukan
        jawaban? Hubungi kami lewat{" "}
        <a
          href="/pusat-bantuan"
          className="font-medium text-pink-600 hover:underline"
        >
          Pusat Bantuan
        </a>
        .
      </p>

      <div className="mt-10 space-y-10">
        {FAQS.map((group) => (
          <section key={group.group}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              {group.group}
            </h2>
            <div className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {group.items.map((item) => {
                const id = `${group.group}-${item.q}`;
                const isOpen = open === id;
                return (
                  <div key={id}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-zinc-50"
                    >
                      <span className="text-sm font-medium text-zinc-900">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-600">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
