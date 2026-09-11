import Link from "next/link";
import {
  Heart,
  Sparkles,
  CalendarHeart,
  MessagesSquare,
  MapPin,
  Download,
  Check,
  ArrowRight,
  Presentation,
} from "lucide-react";
import TemplateCard from "@/components/landing/TemplateCard";

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
    icon: Sparkles,
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
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10173f]/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-600 text-white">
            <Heart className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Meduta</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
          <a href="#fitur" className="transition hover:text-white">Fitur</a>
          <a href="#cara-kerja" className="transition hover:text-white">Cara Kerja</a>
          <a href="#harga" className="transition hover:text-white">Harga</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-200 transition hover:text-white"
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
              <Sparkles className="h-4 w-4" />
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
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard key={t.name} template={t} />
          ))}
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
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white">
            <Heart className="h-4 w-4" />
          </span>
          <span className="font-bold text-white">Meduta</span>
        </div>
        <p className="text-sm text-zinc-400">
          © {new Date().getFullYear()} Meduta. Undangan digital untuk momen spesial Anda.
        </p>
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
