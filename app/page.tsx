import type { Metadata } from "next";
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
  Crown,
} from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import TemplateSlider from "@/components/landing/TemplateSlider";
import ContactForm from "@/components/landing/ContactForm";
import Navbar from "@/components/landing/Navbar";
import Logo from "@/components/Logo";
import { auth } from "@/lib/auth";

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
  {
    key: "enchanted",
    name: "Enchanted Garden",
    desc: "Taman bunga penuh warna: pintu gerbang mekar, kelopak jatuh, glass card pastel & gradasi rose-purple.",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=60",
    premium: true,
  },
  {
    key: "fairytale",
    name: "Fairytale Dream",
    desc: "Dongeng bunga penuh warna: kartu storybook, kupu-kupu animasi, partikel ajaib & wreath watercolor.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60",
    premium: true,
  },
  {
    key: "onyx",
    name: "Onyx Elegance",
    desc: "Gelap elegan beraksen fuchsia: ornamen cermin, bingkai quarter-arch, nama ber-shimmer & debu emas melayang.",
    image: "/design/onyx-corner.webp",
    premium: true,
  },
  {
    key: "purple",
    name: "Purple Blossom",
    desc: "Plum gelap berbunga watercolor: arch kain gorden, inisial emas, monstera & lavender yang bergoyang lembut tertiup angin.",
    image: "/design/purple-bouquet.webp",
    premium: true,
  },
  {
    key: "wedflix",
    name: "Wedflix Original",
    desc: "Gaya Netflix Original Series: gerbang Who's Watching, billboard hero, episode acara, Top 10 kisah cinta & amplop digital.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60",
    premium: true,
  },
  {
    key: "spotify",
    name: "Medify Album",
    desc: "Gaya player Spotify: gerbang Play Album, hero artwork, tracklist acara, Popular Tracks kisah cinta, discography galeri & player bar.",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=60",
    premium: true,
  },
  {
    key: "wayang",
    name: "Wayang Jawa",
    desc: "Nuansa tradisi Jawa: gerbang gunungan & wayang emas, ornamen batik kawung, parang candra, name card emas & amplop digital.",
    image:
      "https://images.unsplash.com/photo-1610173826608-8e2dc30fd461?w=600&q=60",
    premium: true,
  },
  {
    key: "senja",
    name: "Senja Editorial",
    desc: "Editorial dua kolom: gerbang beige-rose dengan ornamen floral, hero mempelai lengkung, countdown bermask, timeline kisah alternating & galeri offset dengan lightbox.",
    image:
      "https://images.unsplash.com/photo-1606216794074-714e54141d3f?w=600&q=60",
    premium: true,
  },
];

export const metadata: Metadata = {
  title: "Meduta – Undangan Pernikahan Digital Online",
  description:
    "Buat undangan pernikahan digital yang elegan. Pilih tema, bagikan link, pantau RSVP & ucapan tamu dalam satu tempat.",
  alternates: { canonical: "https://meduta.my.id" },
  robots: { index: true, follow: true },
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
    period: "1 bulan",
    desc: "Coba semua fitur dasar untuk satu undangan.",
    features: [
      "undangan pernikahan terbatas",
      "Masa aktif 1 bulan",
      "Upload 5 Gambar",
      "Bebas Ganti Background & Musik Latar",
      "Template dasar",
      "RSVP & wedding wall",
      "Link undangan pribadi",
      "Fitur Terbatas",
      "Watermark Meduta",
    ],
    highlighted: false,
    cta: "Mulai Gratis",
    href: "/register",
  },
  {
    name: "Premium",
    price: "Rp50.000",
    period: "1 tahun",
    desc: "Fitur lengkap untuk momen spesial Anda.",
    features: [
      "Unlimited undangan - Bebas Ganti-Ganti Template Sesuai Selera",
      "Masa aktif 1 tahun",
      "Semua template premium",
      "Bebas Ganti Background & Musik Latar",
      "Upload Galeri foto Tanpa Batas",
      "Pantau RSVP & ucapan tamu",
      "Kustomisasi domain & branding",
      "Integrasi pembayaran & donasi",
      "Dukungan prioritas",
      "Hapus watermark Meduta",
      "Semua Fitur Lengkap",
      
    ],
    highlighted: true,
    cta: "Mulai Premium",
    href: "/register",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans text-zinc-900">
      <Navbar isLoggedIn={Boolean(session?.user)} />
      <Hero />
      <Features />
      <Templates />
      <Steps />
      <Panduan />
      <Tentang />
      <Pricing isLoggedIn={Boolean(session?.user)} />
      <CTA />
      <Kontak />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section id="Home" className="relative scroll-mt-16 overflow-hidden bg-[#10173f]">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/design/bg-new-opt.jpg')" }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#10173f]/95 via-[#10173f]/85 to-[#10173f]/55" />
      <div aria-hidden className="absolute -right-32 top-12 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl" />
      <div aria-hidden className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24">
        <div className="text-center lg:text-left">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-pink-300/25 bg-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-pink-200 lg:mx-0">
            <RingIcon className="h-4 w-4" />
            Hari istimewa, undangan istimewa
          </p>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:mx-0 lg:text-6xl">
            Undangan pernikahan digital yang{" "}
            <span className="text-pink-300">elegan dan personal.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-200 sm:text-lg sm:leading-8 lg:mx-0">
            Buat undangan cantik dalam beberapa langkah, bagikan satu tautan ke
            orang tersayang, lalu pantau RSVP dan ucapan dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/register"
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-pink-600 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-pink-950/30 transition hover:-translate-y-0.5 hover:bg-pink-500 sm:w-auto"
            >
              Buat Undangan Gratis
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <a
              href="#template"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/25 bg-white/[0.06] px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
            >
              Jelajahi Template
            </a>
          </div>
          <p className="mt-5 text-sm text-zinc-300">
            Mulai gratis <span className="px-1 text-pink-300">·</span> Upgrade
            kapan saja
          </p>
          <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-zinc-200 lg:mx-0 lg:justify-start">
            {["RSVP praktis", "Link tamu personal", "Nyaman di ponsel"].map(
              (benefit) => (
                <span key={benefit} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-pink-300" />
                  {benefit}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[480px]">
          <div aria-hidden className="absolute inset-8 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/[0.08] p-2 shadow-2xl shadow-black/30 backdrop-blur-sm sm:rounded-[2.5rem] sm:p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/ilustrasi.webp"
              alt="Ilustrasi pasangan pengantin dengan buket bunga"
              className="animate-float-slow w-full rounded-[1.5rem] object-contain sm:rounded-[2rem]"
            />
          </div>
          <div className="absolute -bottom-5 left-2 flex items-center gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-xl shadow-black/20 sm:-left-8 sm:px-5 sm:py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-zinc-900">
                Siap dibagikan
              </span>
              <span className="block text-xs text-zinc-500">
                Satu tautan untuk semua tamu
              </span>
            </span>
          </div>
          <div className="absolute -right-2 top-8 hidden rounded-2xl border border-white/15 bg-[#171e4e]/90 px-4 py-3 text-left shadow-xl backdrop-blur sm:block sm:-right-6">
            <span className="block text-xs text-zinc-300">Semua momen</span>
            <span className="mt-1 block text-sm font-semibold text-white">
              Dalam satu undangan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Fitur"
          title="Semua yang Anda Butuhkan Ada di Sini"
          desc="Fitur lengkap, Halaman User Yang Mudah Digunakan, dan Template Undangan yang Elegan. Semua dalam satu platform."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm shadow-zinc-900/[0.025] transition duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-950/5"
            >
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 transition duration-300 group-hover:bg-pink-600 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Templates() {
  return (
    <section id="template" className="scroll-mt-20 bg-[#fbf8f7] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
    <section id="cara-kerja" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Cara Kerja"
          title="Mulai Hanya dalam 4 Langkah"
          desc="Proses cepat dan sederhana, undangan Anda siap dibagikan."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl border border-zinc-200/80 bg-[#fbf8f7] p-6 sm:p-7">
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-sm font-bold text-pink-700">
                {String(i + 1).padStart(2, "0")}
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
      "Foto mempelai: persegi 1:1 (cth. 800×800px) - tampil bulat dengan wajah di tengah",
      "Foto galeri: potret 4:5 (cth. 960×1200px) - mengisi frame sempurna",
      "Format JPG/PNG/WebP - foto besar dikompres otomatis saat diunggah",
    ],
  },
  {
    icon: Music,
    title: "Tips Musik Latar",
    points: [
      "Format MP3/WAV/OGG/M4A, maksimal 10MB - MP3 paling ringan",
      "Musik otomatis mengalun saat tamu menekan Buka Undangan",
      "Tamu bisa mematikan musik lewat tombol speaker di undangan",
    ],
  },
  {
    icon: ListChecks,
    title: "Tips Pengisian",
    points: [
      "Isi bertahap - semua perubahan tersimpan per bagian",
      "Gunakan Preview di setiap form untuk memastikan tampilan",
      "Nama tamu otomatis muncul di cover lewat link pribadi",
    ],
  },
];

function Panduan() {
  return (
    <section id="panduan" className="scroll-mt-20 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
  email: "admin@meduta.my.id",
  wa: "6282399889992",
  waDisplay: "0823 9988 9992",
  alamat: "Kab. Parigi Moutong, Kec. Parigi, Jl. Jalur Dua Lebo, Btn Graha Bidara Blok G.6",
};

function Tentang() {
  return (
    <section id="tentang" className="scroll-mt-20 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
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
              membuat, mengelola, dan membagikan undangan ke semua tamu - cukup
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
                <p className="text-3xl font-bold text-pink-600">10+</p>
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
            <p className="mt-4 text-sm text-white/80">- Tim Meduta</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/20 pt-5 text-sm font-medium">
              <Link href="/tim" className="text-white/90 underline-offset-4 transition hover:text-white hover:underline">
                Tim Kami
              </Link>
              <Link href="/faq" className="text-white/90 underline-offset-4 transition hover:text-white hover:underline">
                FAQ
              </Link>
              <Link href="/pusat-bantuan" className="text-white/90 underline-offset-4 transition hover:text-white hover:underline">
                Pusat Bantuan
              </Link>
              <Link href="/syarat-ketentuan" className="text-white/90 underline-offset-4 transition hover:text-white hover:underline">
                Syarat & Ketentuan
              </Link>
              <Link href="/kebijakan-privasi" className="text-white/90 underline-offset-4 transition hover:text-white hover:underline">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Kontak() {
  return (
    <section id="kontak" className="scroll-mt-20 bg-zinc-50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

function Pricing({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section id="harga" className="scroll-mt-20 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
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
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {plan.name}
                {plan.highlighted && (
                  <Crown
                    aria-label="Paket Premium"
                    className="h-5 w-5 text-amber-500"
                  />
                )}
              </h3>
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
                href={isLoggedIn && plan.highlighted ? "/dashboard" : plan.href}
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
    <section className="bg-zinc-900 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Siap Membuat Undangan Anda?
        </h2>
        <p className="mt-4 text-lg text-zinc-400">
          Mulai gratis sekarang dan bagikan momen bahagia Anda kepada orang-orang tercinta.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-pink-700 sm:w-auto"
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
            <a
              href={`mailto:${KONTAK.email}`}
              aria-label="Email Meduta"
              title={KONTAK.email}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-pink-600 hover:text-white"
            >
              <Mail className="h-4.5 w-4.5" />
            </a>
            <a
              href={`https://wa.me/${KONTAK.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Meduta"
              title={`WA: ${KONTAK.waDisplay}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-emerald-500 hover:text-white"
            >
              <MessageCircle className="h-4.5 w-4.5" />
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-400 sm:justify-end">
            <Link href="/syarat-ketentuan" className="transition hover:text-white">
              Syarat & Ketentuan
            </Link>
            <span className="text-zinc-600" aria-hidden>
              |
            </span>
            <Link href="/kebijakan-privasi" className="transition hover:text-white">
              Kebijakan Privasi
            </Link>
            <span className="text-zinc-600" aria-hidden>
              |
            </span>
            <Link href="/tim" className="transition hover:text-white">
              Tim Kami
            </Link>
            <span className="text-zinc-600" aria-hidden>
              |
            </span>
            <Link href="/faq" className="transition hover:text-white">
              FAQ
            </Link>
            <span className="text-zinc-600" aria-hidden>
              |
            </span>
            <Link href="/pusat-bantuan" className="transition hover:text-white">
              Pusat Bantuan
            </Link>
          </div>
          <p className="text-sm text-zinc-400">
            Copyright © {new Date().getFullYear()} Meduta. All rights reserved.
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
      <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      <p className="mt-4 text-zinc-600">{desc}</p>
    </div>
  );
}
