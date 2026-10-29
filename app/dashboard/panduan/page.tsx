import { redirect } from "next/navigation";
import {
  auth,
} from "@/lib/auth";
import {
  Image as ImageIcon,
  Music,
  ClipboardList,
  CircleCheck,
  Camera,
  FileAudio,
  ListChecks,
  Share2,
} from "lucide-react";

export const metadata = { title: "Panduan | Meduta" };

const steps = [
  {
    title: "Pilih Tema",
    desc: "Tentukan desain undangan. Gunakan tombol Preview untuk melihat hasilnya sebelum memutuskan.",
  },
  {
    title: "Lengkapi Mempelai",
    desc: "Isi nama, putra/putri dari, dan foto pengantin. Foto bisa diunggah langsung dari HP.",
  },
  {
    title: "Isi Cerita & Acara",
    desc: "Tambahkan kisah cinta, tanggal, jam, dan lokasi acara — boleh lebih dari satu acara (akad, resepsi).",
  },
  {
    title: "Poles Konten",
    desc: "Unggah foto galeri, musik latar, dan rekening kado digital sesuai selera.",
  },
  {
    title: "Bagikan",
    desc: "Gunakan Kirim Undangan untuk membuat link pribadi tiap tamu dan menyebarkannya sekali jalan.",
  },
];

const photoRules = [
  {
    label: "Foto mempelai",
    ratio: "Persegi 1:1",
    example: "800×800 px",
    why: "Tampil bulat di undangan - wajah di tengah agar tidak terpotong.",
  },
  {
    label: "Foto galeri",
    ratio: "Potret 4:5",
    example: "960×1200 px",
    why: "Mengisi frame galeri sempurna tanpa terpotong.",
  },
  {
    label: "Batas ukuran",
    ratio: "Maks 3MB",
    example: "JPG / PNG / WebP",
    why: "Lebih dari 3MB? Tetap bisa - foto dikompres otomatis saat diunggah.",
  },
];

const musicRules = [
  "Format MP3, WAV, OGG, M4A, atau AAC dengan ukuran maksimal 10MB.",
  "MP3 adalah pilihan terbaik - ukurannya kecil dan didukung semua browser tamu.",
  "Musik otomatis diputar saat tamu menekan tombol Buka Undangan, dan bisa dimatikan lewat tombol speaker di undangan.",
  "Musik berputar terus (loop) selama undangan dibuka - pilih lagu yang tenang agar tidak melelahkan.",
  "Belum punya file? Template tertentu sudah punya musik bawaan yang langsung aktif.",
];

const fillingTips = [
  "Gunakan Preview di setiap halaman form untuk memastikan tampilan sebelum dibagikan.",
  "Nama tamu otomatis muncul di cover lewat link pribadi - tidak perlu tulis satu per satu di undangan.",
  "Aktifkan RSVP agar tamu bisa konfirmasi kehadiran dan jumlah orang yang datang.",
  "Pantau Doa & Ucapan secara berkala; moderation tersedia bila ada ucapan yang perlu dihapus.",
  "Tanggal acara memakai kalender picker - undangan otomatis menampilkannya dalam format panjang yang rapi.",
];

export default async function PanduanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Panduan Singkat</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Semua yang perlu Anda tahu agar undangan selesai cepat dan tamu nyaman melihatnya.
        </p>
      </div>

      {/* Urutan langkah */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ListChecks className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold text-zinc-900">
            5 Langkah Sampai Undangan Siap
          </h2>
        </div>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Tips foto */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
            <Camera className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold text-zinc-900">Tips Foto</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {photoRules.map((rule) => (
            <div
              key={rule.label}
              className="rounded-xl border border-zinc-200 p-4"
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                <ImageIcon className="h-4 w-4 text-zinc-400" />
                {rule.label}
              </p>
              <p className="mt-2 text-xl font-bold text-rose-600">{rule.ratio}</p>
              <p className="text-xs font-medium text-zinc-500">{rule.example}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{rule.why}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700">
          Foto kamera HP biasanya 4-8MB - tidak perlu diresize manual. Sistem
          otomatis mengecilkan fotonya saat diunggah, lalu memberi tahu Anda
          hasil kompresinya.
        </p>
      </section>

      {/* Tips musik */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Music className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold text-zinc-900">Tips Musik Latar</h2>
        </div>
        <ul className="space-y-2.5">
          {musicRules.map((rule) => (
            <li key={rule} className="flex gap-2.5 text-sm text-zinc-600">
              <FileAudio className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {/* Tips pengisian & penyebaran */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Share2 className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold text-zinc-900">
            Tips Pengisian &amp; Penyebaran
          </h2>
        </div>
        <ul className="space-y-2.5">
          {fillingTips.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-sm text-zinc-600">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <p className="flex items-start gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-xs leading-relaxed text-zinc-500">
        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
        Semua perubahan tersimpan per bagian - Anda bisa mengisi sedikit demi
        sedikit dan kembali kapan saja. Undangan baru terlihat tamu setelah
        dipublikasikan dari halaman Kirim Undangan.
      </p>
    </div>
  );
}

// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
