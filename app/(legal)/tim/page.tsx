import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Mail, MessageCircle } from "lucide-react";

/**
 * Halaman Tim Kami — memperkenalkan tim di balik Meduta.
 * Nama & peran mudah diedit lewat konstanta TEAM di bawah.
 */

export const metadata: Metadata = {
  title: "Tim Kami - Meduta",
  description: "Orang-orang di balik Meduta, platform undangan digital pernikahan.",
};

const TEAM = [
  {
    name: "Adi Swandi",
    role: "Founder & Developer",
    bio: "Merancang dan membangun sistem Meduta.",
    initials: "AS",
    accent: "from-pink-600 to-rose-500",
  },

  {
    name: "Rahmatika",
    role: "Template Designer",
    bio: "Merancang dan membangun tampilan template yang indah dan menarik.",
    initials: "Ra",
    accent: "from-pink-600 to-rose-500",
  },
];

const VALUES = [
  {
    icon: Heart,
    title: "Berawal dari kepedulian",
    desc: "Kami percaya momen bahagia layak dibagikan dengan indah - tanpa ribet, tanpa mahal.",
  },
  {
    icon: Mail,
    title: "Dukungan responsif",
    desc: "Pertanyaan dan kendala Anda kami jawab langsung melalui Email & WhatsApp.",
  },
  {
    icon: MessageCircle,
    title: "Dibangun bersama pengguna",
    desc: "Banyak fitur Meduta lahir dari masukan pengguna. Sampaikan ide Anda - kami mendengarkan.",
  },
];

export default function TimPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
        Tentang Kami
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
        Tim Kami
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
        Meduta dibangun oleh tim kecil yang percaya bahwa membagikan kabar
        bahagia seharusnya semudah tersenyum. Kenali orang-orang di baliknya.
      </p>

      {/* Kartu anggota tim */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {TEAM.map((m) => (
          <div
            key={m.name}
            className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:shadow-md"
          >
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${m.accent} text-xl font-bold text-white shadow-lg`}
            >
              {m.initials}
            </div>
            <h2 className="mt-5 text-lg font-semibold text-zinc-900">{m.name}</h2>
            <p className="text-sm font-medium text-pink-600">{m.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{m.bio}</p>
          </div>
        ))}

        {/* Kartu CTA: bergabung / kolaborasi */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 to-rose-500 p-8 text-white shadow-xl shadow-pink-600/20">
          <h2 className="text-lg font-semibold">Anda?</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            Kami terbuka untuk kolaborasi - desainer template, fotografer, dan
            kreator konten pernikahan. Perkenalkan diri Anda kepada kami.
          </p>
          <Link
            href="mailto:admin@meduta.my.id"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
          >
            <Mail className="h-4 w-4" />
            Hubungi Kami
          </Link>
        </div>
      </div>

      {/* Nilai tim */}
      <h2 className="mt-16 text-xl font-bold text-zinc-900">
        Cara Kami Bekerja
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {VALUES.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <v.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-zinc-900">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{v.desc}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
