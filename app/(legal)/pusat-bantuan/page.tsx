import Link from "next/link";
import {
  Palette,
  Image as ImageIcon,
  Music,
  Users,
  MessageCircleHeart,
  CreditCard,
  LifeBuoy,
  Mail,
} from "lucide-react";

/**
 * Halaman Pusat Bantuan Meduta — ikhtisar topik bantuan (kartu kategori)
 * yang mengarahkan ke fitur terkait, FAQ, dan kontak langsung.
 */

const TOPICS = [
  {
    icon: Palette,
    title: "Template & Tampilan",
    desc: "Memilih tema, mengganti background, dan mengatur foto gerbang undangan.",
    href: "/dashboard/pilih-tema",
    cta: "Pilih Tema",
  },
  {
    icon: ImageIcon,
    title: "Foto Mempelai & Galeri",
    desc: "Ukuran yang direkomendasikan, format yang didukung, dan kompresi otomatis.",
    href: "/panduan",
    cta: "Lihat Panduan Foto",
  },
  {
    icon: Music,
    title: "Musik Latar",
    desc: "Mengunggah musik pilihan sendiri, format & batas ukuran file.",
    href: "/panduan",
    cta: "Lihat Panduan Musik",
  },
  {
    icon: Users,
    title: "Daftar Tamu & Link Undangan",
    desc: "Membuat link personal per tamu, menyalin ulang, dan membagikan lewat WhatsApp.",
    href: "/dashboard/kirim-undangan",
    cta: "Kirim Undangan",
  },
  {
    icon: MessageCircleHeart,
    title: "RSVP & Ucapan Tamu",
    desc: "Memantau konfirmasi kehadiran dan memoderasi dinding ucapan.",
    href: "/dashboard",
    cta: "Buka Dashboard",
  },
  {
    icon: CreditCard,
    title: "Paket & Pembayaran",
    desc: "Perbedaan paket gratis dan premium serta status transaksi Anda.",
    href: "/dashboard/transaksi",
    cta: "Lihat Transaksi",
  },
];

export const metadata = {
  title: "Pusat Bantuan — Meduta",
  description:
    "Pusat bantuan Meduta: panduan membuat undangan, foto, musik, tamu, RSVP, dan kontak dukungan.",
};

export default function PusatBantuanPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
        Bantuan
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
        Pusat Bantuan
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-500">
        Temukan panduan penggunaan Meduta berdasarkan topik. Untuk pertanyaan
        singkat, kunjungi halaman{" "}
        <Link href="/faq" className="font-medium text-pink-600 hover:underline">
          Tanya Jawab (FAQ)
        </Link>
        .
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-pink-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 transition group-hover:bg-pink-600 group-hover:text-white">
              <t.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-zinc-900">
              {t.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {t.desc}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pink-600">
              {t.cta}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-zinc-200 bg-gradient-to-br from-pink-50 to-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-white">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Masih butuh bantuan?
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Tim kami siap membantu. Respon tercepat melalui WhatsApp - sertakan
          nama akun atau email terdaftar serta tangkapan layar masalahnya agar
          penanganan lebih cepat.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://wa.me/6282399889992"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            WhatsApp 0823 9988 9992
          </a>
          <a
            href="mailto:adi.skreative@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-pink-300 hover:text-pink-600"
          >
            <Mail className="h-4 w-4" />
            adi.skreative@gmail.com
          </a>
        </div>
      </div>
    </article>
  );
}
