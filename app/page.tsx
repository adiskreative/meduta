import Link from "next/link";
import {
  Heart,
  CalendarHeart,
  MessagesSquare,
  MapPin,
  Download,
  Check,
  ArrowRight,
  Presentation,
  Camera,
  Music,
  ListChecks,
  Mail,
  MessageCircle,
  Building2,
} from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import TemplateSlider from "@/components/landing/TemplateSlider";
import ContactForm from "@/components/landing/ContactForm";
import Logo from "@/components/Logo";

const templates = [
  {
    key: "classic",
    name: "Elegant Classic",
    desc: "Serif mewah dengan nuansa klasik yang hangat.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70",
    premium: false,
  },
  {
    key: "minimal",
    name: "Modern Minimal",
    desc: "Desain bersih dan simpel, fokus pada konten.",
    image:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=70",
    premium: false,
  },
  {
    key: "floral",
    name: "Floral Premium",
    desc: "Sentuhan floral elegan untuk kesan romantis.",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=70",
    premium: true,
  },
  {
    key: "rustic",
    name: "Rustic Wedding",
    desc: "Nuansa earthy hangat dengan aksen hijau yang menenangkan.",
    image:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=600&q=70",
    premium: false,
  },
  {
    key: "berkreative",
    name: "Berkreative Royale",
    desc: "Full color: navy berpola, gradasi pink-violet-emas, glassmorphism.",
    image: "/design/bg-new-opt.jpg",
    premium: true,
  },
  {
    key: "garden",
    name: "Garden Royale",
    desc: "Stationery taman kerajaan: arch bunga, wreath mawar, gazebo & merpati emas.",
    image:
      "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates/background/45d062d5-746e-4476-8891-862c0d6ae302.jpg",
    premium: true,
  },
  {
    key: "botanical",
    name: "Botanical Garden",
    desc: "Sage green & ivory bertekstur kertas: countdown save-the-date, galeri lightbox, frame blob organik.",
    image:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=60",
    premium: true,
  },
  {
    key: "zen",
    name: "Zen Minimalist",
    desc: "Hening & berkelas: off-white bertekstur, stempel hanko merah, countdown & galeri grayscale.",
    image:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=60",
    premium: true,
  },
  {
    key: "vogue",
    name: "Vogue Editorial",
    desc: "Gaya majalah fashion: masthead editorial, cover story grayscale, countdown & lookbook.",
    image:
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=60",
    premium: true,
  },
  {
    key: "celestial",
    name: "Celestial Night",
    desc: "Langit malam berbintang: teks emas berkilau, canvas bintang & meteor, glass card bercahaya.",
    image:
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=60",
    premium: true,
  },
  {
    key: "scrapbook",
    name: "Scrapbook Album",
    desc: "Album foto vintage: polaroid washi tape, tulisan tangan, tone terakota hangat & film 35mm.",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=60",
    premium: true,
  },
];

export const metadata = {
  title: "Meduta — Undangan Digital Pernikahan",
  description:
    "Buat undangan pernikahan digital yang elegan. Pilih tema, bagikan link, pantau RSVP & ucapan tamu dalam satu tempat.",
};

const features = [
  {
    icon: Presentation,
    title: "Template Elegan & Responsif",
    desc: "Beragam desain undangan siap pakai yang tampil sempurna di HP maupun desktop.",
  },
  {
    icon: CalendarHeart,
    title: "RSVP Terintegrasi",
    desc: "Tamu konfirmasi kehadiran langsung lewat undangan dan bisa menambah jumlah tamu.",
  },
  {
    icon: MessagesSquare,
    title: "Ucapan & Doa (Wedding Wall)",
    desc: "Kumpulkan doa dan ucapan tamu di satu halaman, lengkap dengan moderasi.",
  },
  {
    icon: MapPin,
    title: "Lokasi & Peta",
    desc: "Cantumkan lokasi acara dengan tombol buka peta agar tamu mudah datang.",
  },
  {
    icon: Download,
    title: "Link Undangan Pribadi",
    desc: "Buat link undangan unik per tamu dan kirim massal sekali jalan.",
  },
  {
    icon: RingIcon,
    title: "Mudah Dikelola",
    desc: "Kelola semua data dari dashboard yang rapi, tanpa perlu keahlian teknis.",
  },
];

const steps = [
  {
    title: "Daftar & Login",
    desc: "Buat akun gratis dalam hitungan detik.",
  },
  {
    title: "Pilih Template",
    desc: "Pilih desain undangan yang paling cocok.",
  },
  {
    title: "Isi Data Undangan",
    desc: "Lengkapi mempelai, acara, dan lokasi dengan mudah.",
  },
  {
    title: "Bagikan & Pantau",
    desc: "Kirim link, pantau RSVP dan ucapan tamu secara real-time.",
  },
];

const plans = [
  {
    name: "Gratis",
    price: "Rp0",
    period: "selamanya",
    desc: "Coba semua fitur dasar untuk satu undangan.",
    features: [
      "1 undangan pernikahan",
      "Template dasar",
      "RSVP & wedding wall",
      "Link undangan pribadi",
    ],
    highlighted: false,
    cta: "Mulai Gratis",
    href: "/register",
  },
  {
    name: "Premium",
    price: "Segera",
    period: "harga menyusul",
    desc: "Fitur lengkap untuk momen spesial Anda.",
    features: [
      "Unlimited undangan",
      "Semua template premium",
      "Musik latar & galeri foto",
      "Prioritas dukungan",
    ],
    highlighted: true,
    cta: "Hubungi Kami",
    href: "#",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-900">
      <Navbar />
      <Hero />
      <Features />
      <Templates />
      <Steps />
      <Panduan />
      <Tentang />
      <Pricing />
      <CTA />
      <Kontak />
      <Footer />
    </main>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10173f]/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
          <a href="#fitur" className="transition hover:text-white">Fitur</a>
          <a href="#cara-kerja" className="transition hover:text-white">Cara Kerja</a>
          <a href="#panduan" className="transition hover:text-white">Panduan</a>
          <a href="#tentang" className="transition hover:text-white">Tentang</a>
          <a href="#harga" className="transition hover:text-white">Harga</a>
          <a href="#kontak" className="transition hover:text-white">Kontak</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex min-h-[44px] items-center px-3 text-sm font-medium text-zinc-200 transition hover:text-white"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
          >
            Daftar
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#10173f]">
      {/* Background pola daun navy (layer normal, di atas bg fallback section) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/design/bg-new-opt.jpg')" }}
      />
      {/* Lapisan penggelap halus agar teks terbaca */}
      <div aria-hidden className="absolute inset-0 bg-[#0d1340]/35" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
          {/* Kiri: teks */}
          <div className="text-center lg:text-left">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-pink-600/30 lg:mx-0">
              <RingIcon className="h-4 w-4" />
              Undangan Digital untuk Momen Spesial Anda
            </p>
            <h1 className="mt-6 text-4xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-5xl">
              Undangan Pernikahan{" "}
              <span className="text-pink-500">Digital Yang</span> Elegan
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-zinc-200 lg:mx-0">
              Buat undangan digital yang mudah, bagikan linknya ke tamu, dan pantau
              RSVP serta ucapan mereka — semua dalam satu tempat.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-600/40 transition hover:bg-pink-500"
              >
                Buat Undangan Gratis
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
              >
                Lihat Cara Kerja
              </a>
            </div>
            <p className="mt-5 text-xs text-zinc-400">
              Gratis untuk memulai • Tanpa kartu kredit
            </p>
          </div>

          {/* Kanan: ilustrasi utuh (arch + pasangan + bunga) — versi kecil di ponsel */}
          <div className="relative mx-auto w-full max-w-[240px] sm:max-w-[360px] lg:max-w-[440px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/ilustrasi.webp"
              alt="Ilustrasi pasangan pengantin dengan buket bunga"
              className="animate-float-slow w-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="fitur" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Fitur"
          title="Semua yang Anda Butuhkan untuk Undangan Digital"
          desc="Fitur lengkap agar undangan Anda terlihat profesional dan mudah dikelola."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200 p-6 transition hover:border-pink-200 hover:shadow-md"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Templates() {
  return (
    <section id="template" className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Template"
          title="Pilih Desain Undangan"
          desc="Lihat beberapa template siap pakai. Tampil sempurna di ponsel tamu Anda."
        />
        {/* Slider: 6 template tampil sekaligus di desktop (2 baris × 3 kolom),
            sisanya diakses lewat tombol next/prev */}
        <div className="mt-14">
          <TemplateSlider templates={templates} />
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section id="cara-kerja" className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Cara Kerja"
          title="Mulai Hanya dalam 4 Langkah"
          desc="Proses cepat dan sederhana, undangan Anda siap dibagikan."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-zinc-200 bg-white p-6">
              <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="font-semibold text-zinc-900">{s.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const panduanTips = [
  {
    icon: Camera,
    title: "Tips Foto",
    points: [
      "Foto mempelai: persegi 1:1 (cth. 800×800px) — tampil bulat dengan wajah di tengah",
      "Foto galeri: potret 4:5 (cth. 960×1200px) — mengisi frame sempurna",
      "Format JPG/PNG/WebP — foto besar dikompres otomatis saat diunggah",
    ],
  },
  {
    icon: Music,
    title: "Tips Musik Latar",
    points: [
      "Format MP3/WAV/OGG/M4A, maksimal 10MB — MP3 paling ringan",
      "Musik otomatis mengalun saat tamu menekan Buka Undangan",
      "Tamu bisa mematikan musik lewat tombol speaker di undangan",
    ],
  },
  {
    icon: ListChecks,
    title: "Tips Pengisian",
    points: [
      "Isi bertahap — semua perubahan tersimpan per bagian",
      "Gunakan Preview di setiap form untuk memastikan tampilan",
      "Nama tamu otomatis muncul di cover lewat link pribadi",
    ],
  },
];

function Panduan() {
  return (
    <section id="panduan" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Panduan"
          title="Persiapan Sebelum Membuat Undangan"
          desc="Ketahui ketentuan foto, musik, dan cara pengisian agar undangan Anda selesai cepat tanpa hambatan."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {panduanTips.map((tip) => (
            <div
              key={tip.title}
              className="rounded-2xl border border-zinc-200 p-6 transition hover:border-pink-200 hover:shadow-md"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <tip.icon className="h-6 w-6" />
              </span>
              <h3 className="font-semibold text-zinc-900">{tip.title}</h3>
              <ul className="mt-3 space-y-2">
                {tip.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm leading-relaxed text-zinc-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const KONTAK = {
  email: "adi.skreative@gmail.com",
  wa: "6282399889992",
  waDisplay: "0823 9988 9992",
  alamat: "Btn Graha Bidara Blok G.6",
};

function Tentang() {
  return (
    <section id="tentang" className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading
          eyebrow="Tentang"
          title="Tentang Meduta"
          desc="Platform undangan digital yang membantu Anda membagikan momen bahagia dengan cara yang elegan."
        />
        <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-base leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-900">Meduta</span> adalah
              layanan undangan pernikahan digital yang memudahkan pasangan
              membuat, mengelola, dan membagikan undangan ke semua tamu — cukup
              dari satu tempat.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              Kami percaya undangan bukan sekadar informasi acara, melainkan
              kesan pertama dari hari bahagia Anda. Karena itu setiap template
              kami dirancang elegan, mudah diisi tanpa keahlian teknis, dan
              lengkap dengan fitur yang tamu butuhkan: RSVP, ucapan, musik,
              galeri, dan peta lokasi.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-bold text-pink-600">4+</p>
                <p className="text-sm text-zinc-500">Desain template elegan</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-pink-600">100%</p>
                <p className="text-sm text-zinc-500">Responsif di ponsel</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-pink-600">Gratis</p>
                <p className="text-sm text-zinc-500">Mulai tanpa biaya</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-pink-600 to-rose-500 p-8 text-white shadow-xl shadow-pink-600/20">
            <Heart className="h-10 w-10" />
            <p className="mt-4 text-lg font-medium leading-relaxed">
              “Membagikan kabar bahagia seharusnya semudah tersenyum.”
            </p>
            <p className="mt-4 text-sm text-white/80">— Tim Meduta</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Kontak() {
  return (
    <section id="kontak" className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Kontak"
          title="Hubungi Kami"
          desc="Ada pertanyaan atau butuh bantuan? Kirim pesan atau hubungi kami langsung."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Kiri: info kontak */}
          <div className="space-y-4">
            <a
              href={`mailto:${KONTAK.email}`}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-pink-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 transition group-hover:scale-110">
                <Mail className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-500">Email</h3>
                <p className="break-all text-sm font-medium text-zinc-900 group-hover:text-pink-600">
                  {KONTAK.email}
                </p>
              </div>
            </a>
            <a
              href={`https://wa.me/${KONTAK.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-pink-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 transition group-hover:scale-110">
                <MessageCircle className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-500">WhatsApp</h3>
                <p className="text-sm font-medium text-zinc-900 group-hover:text-pink-600">
                  {KONTAK.waDisplay}
                </p>
              </div>
            </a>
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-500">Alamat</h3>
                <p className="text-sm font-medium text-zinc-900">{KONTAK.alamat}</p>
              </div>
            </div>
            <p className="rounded-xl bg-pink-50 px-5 py-4 text-xs leading-relaxed text-pink-700">
              Respon tercepat via WhatsApp. Untuk pertanyaan teknis, sertakan
              nama akun atau email yang terdaftar agar kami bisa membantu lebih cepat.
            </p>
          </div>

          {/* Kanan: form pesan */}
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="harga" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading
          eyebrow="Harga"
          title="Pilih Paket yang Sesuai"
          desc="Mulai gratis, upgrade kapan pun sesuai kebutuhan Anda."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-8 ${
                plan.highlighted
                  ? "border-pink-200 bg-pink-50 shadow-lg"
                  : "border-zinc-200"
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-zinc-500">/ {plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="h-4 w-4 shrink-0 text-pink-600" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block rounded-xl px-6 py-3 text-center font-semibold transition ${
                  plan.highlighted
                    ? "bg-pink-600 text-white hover:bg-pink-700"
                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-zinc-900 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Siap Membuat Undangan Anda?
        </h2>
        <p className="mt-4 text-lg text-zinc-400">
          Mulai gratis sekarang dan bagikan momen bahagia Anda kepada orang-orang tercinta.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-pink-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-pink-700"
        >
          Daftar Sekarang
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#10173f] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center">
          <Logo className="h-9 w-auto" />
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <a href={`mailto:${KONTAK.email}`} className="transition hover:text-white">
              {KONTAK.email}
            </a>
            <a
              href={`https://wa.me/${KONTAK.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              WA: {KONTAK.waDisplay}
            </a>
          </div>
          <p className="text-sm text-zinc-400">
            © {new Date().getFullYear()} Meduta. Undangan digital untuk momen spesial Anda.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-pink-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-zinc-600">{desc}</p>
    </div>
  );
}
