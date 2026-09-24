import type { Metadata } from "next";

/**
 * Halaman Syarat & Ketentuan layanan Meduta.
 */

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Meduta",
  description:
    "Syarat dan ketentuan penggunaan layanan undangan digital Meduta.",
};

const SECTIONS = [
  {
    title: "1. Penerimaan Syarat",
    paras: [
      "Dengan mendaftar dan menggunakan Meduta, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini. Jika Anda tidak menyetujui salah satu ketentuan, mohon untuk tidak menggunakan layanan kami.",
      "Meduta berhak memperbarui ketentuan ini sewaktu-waktu. Perubahan berlaku sejak dipublikasikan di halaman ini; kami menyarankan Anda meninjau halaman ini secara berkala.",
    ],
  },
  {
    title: "2. Layanan Kami",
    paras: [
      "Meduta menyediakan platform pembuatan undangan pernikahan digital: pemilihan template, pengisian konten (mempelai, acara, galeri, musik), undangan personal per tamu, konfirmasi kehadiran (RSVP), serta dinding ucapan.",
      "Paket dasar tersedia gratis dengan fitur terbatas. Fitur atau template premium dapat ditawarkan dengan biaya sesuai paket yang dipilih dan akan dinyatakan dengan jelas sebelum transaksi.",
    ],
  },
  {
    title: "3. Akun Pengguna",
    paras: [
      "Anda bertanggung jawab menjaga kerahasiaan akun dan kata sandi Anda. Seluruh aktivitas yang terjadi melalui akun Anda dianggap atas persetujuan Anda.",
      "Satu akun diperuntukkan bagi satu pengguna sebagaimana ketentuan paket. Dilarang menjual, menyewakan, atau membagikan akses akun kepada pihak lain tanpa izin tertulis dari kami.",
    ],
  },
  {
    title: "4. Konten yang Anda Unggah",
    paras: [
      "Anda memegang hak penuh atas konten yang Anda unggah (foto, teks, musik, dan lainnya) dan menyatakan berhak menggunakan konten tersebut.",
      "Dilarang mengunggah konten yang melanggar hukum, melanggar hak cipta pihak lain, mengandung SARA, kekerasan, pornografi, atau menyesatkan. Kami berhak menghapus konten yang melanggar tanpa pemberitahuan.",
      "Anda memberikan Meduta izin terbatas untuk menyimpan dan menampilkan konten tersebut sebatas yang diperlukan untuk menjalankan layanan undangan Anda.",
    ],
  },
  {
    title: "5. Pembayaran & Paket",
    paras: [
      "Bila Anda membeli paket berbayar, Anda setuju pada harga yang tercantum saat pembelian. Transaksi diproses melalui mitra pembayaran; kami tidak menyimpan data kartu Anda.",
      "Biaya yang telah dibayar untuk paket digital tidak dapat ditarik kembali (non-refundable), kecuali diatur lain oleh hukum yang berlaku atau keputusan khusus dari tim kami.",
    ],
  },
  {
    title: "6. Pembatasan Tanggung Jawab",
    paras: [
      "Meduta disediakan \"sebagaimana adanya\". Kami berupaya menjaga layanan tetap tersedia dan aman, namun tidak menjamin layanan bebas gangguan sepenuhnya - termasuk gangguan jaringan, perangkat tamu, atau pihak ketiga di luar kendali kami.",
      "Sejauh diizinkan hukum, Meduta tidak bertanggung jawab atas kerugian tidak langsung akibat penggunaan atau ketidakmampuan menggunakan layanan.",
    ],
  },
  {
    title: "7. Penghentian Layanan",
    paras: [
      "Anda dapat menghentikan penggunaan layanan kapan saja. Kami dapat menangguhkan atau menghentikan akun yang melanggar ketentuan ini, disalahgunakan, atau membahayakan layanan/pengguna lain.",
      "Kami berupaya memberitahukan sebelum penghentian akun, kecuali hal itu tidak memungkinkan secara hukum atau akun terbukti melanggar hukum.",
    ],
  },
  {
    title: "8. Kontak",
    paras: [
      "Pertanyaan tentang Syarat & Ketentuan ini dapat disampaikan melalui email adi.skreative@gmail.com atau WhatsApp 0823 9988 9992 (Jl Jalur II Lebo,  Btn Graha Bidara Blok G.6, Kec. Parigi).",
    ],
  },
];

export default function SyaratKetentuanPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        Terakhir diperbarui: September 2026
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-zinc-900">{s.title}</h2>
            {s.paras.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-zinc-600">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
