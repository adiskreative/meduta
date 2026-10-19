import type { Metadata } from "next";

/**
 * Halaman Kebijakan Privasi layanan Meduta.
 */

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Meduta",
  description:
    "Bagaimana Meduta mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const SECTIONS = [
  {
    title: "1. Data yang Kami Kumpulkan",
    paras: [
      "Data akun: nama, alamat email, dan kata sandi (tersimpan dalam bentuk terenkripsi) saat Anda mendaftar.",
      "Data undangan: konten yang Anda isi sendiri - nama mempelai, tanggal & lokasi acara, foto, galeri, musik, serta nama tamu yang Anda tambahkan untuk membuat link undangan personal.",
      "Data tamu Anda: jawaban RSVP dan ucapan yang dikirim tamu melalui undangan Anda. Data ini milik Anda sebagai pembuat undangan.",
      "Data teknis: informasi perangkat & log server standar untuk menjaga keamanan dan kinerja layanan.",
    ],
  },
  {
    title: "2. Penggunaan Data",
    paras: [
      "Menjalankan layanan: menampilkan undangan, memproses RSVP & ucapan, serta mengelola daftar tamu Anda.",
      "Komunikasi: mengirim informasi penting seputar akun dan transaksi Anda.",
      "Perbaikan layanan: analitik agregat untuk memahami penggunaan dan meningkatkan kualitas produk.",
      "Kami tidak menjual data pribadi Anda kepada pihak mana pun.",
    ],
  },
  {
    title: "3. Berbagi Data",
    paras: [
      "Data Anda dibagikan hanya sebatas kebutuhan: kepada penyedia infrastruktur (hosting & basis data) dan penyedia layanan email/pembayaran yang bekerja atas instruksi kami dengan kewajiban kerahasiaan.",
      "Undangan yang Anda publikasikan akan dapat diakses oleh tamu yang menerima link undangan Anda - pastikan Anda hanya membagikannya kepada pihak yang diinginkan.",
      "Kami dapat mengungkap data bila diwajibkan oleh hukum atau perintah lembaga berwenang.",
    ],
  },
  {
    title: "4. Penyimpanan & Keamanan",
    paras: [
      "Data disimpan di server yang dikelola penyedia infrastruktur terkemuka dengan enkripsi saat transit (HTTPS/TLS).",
      "Kami menerapkan kontrol akses berbasis peran: hanya Anda yang dapat mengelola isi undangan Anda; data tamu hanya dapat diakses melalui akun Anda.",
      "Meskipun kami berupaya melindungi data dengan baik, tidak ada sistem yang sepenuhnya bebas risiko. Kami menyarankan kata sandi yang kuat dan tidak dibagikan.",
    ],
  },
  {
    title: "5. Retensi & Penghapusan",
    paras: [
      "Data undangan disimpan selama akun Anda aktif. Anda dapat menghapus undangan kapan saja dari dashboard.",
      "Menghapus undangan akan menghapus konten undangan beserta data RSVP & ucapan yang terkait. Penghapusan akun dapat diminta melalui kontak kami dan akan diproses dalam waktu wajar.",
      "Beberapa data dapat disimpan lebih lama bila diwajibkan hukum atau untuk keperluan pencatatan transaksi.",
    ],
  },
  {
    title: "6. Hak Anda",
    paras: [
      "Anda berhak mengakses, memperbaiki, dan menghapus data pribadi Anda; menarik persetujuan pemasaran; serta mengajukan pertanyaan tentang pemrosesan data Anda.",
      "Permintaan dapat dikirim ke admin@meduta.my.id - kami akan merespons dalam waktu wajar sesuai peraturan yang berlaku.",
    ],
  },
  {
    title: "7. Data Anak",
    paras: [
      "Layanan Meduta tidak ditujukan bagi anak di bawah usia 17 tahun. Kami tidak dengan sengaja mengumpulkan data pribadi anak-anak.",
    ],
  },
  {
    title: "8. Perubahan Kebijakan",
    paras: [
      "Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini dengan tanggal pembaruan di bagian atas.",
    ],
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
        Kebijakan Privasi
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
