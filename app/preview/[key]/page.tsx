import { notFound } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mapDecorations } from "@/lib/decoration";
import TemplateRenderer from "@/components/templates";
import type { InvitationView } from "@/components/templates/types";

type Props = {
  params: Promise<{ key: string }>;
};

const VALID = new Set(["classic", "minimal", "floral"]);

export const metadata: Metadata = {
  title: "Pratinjau Template | Meduta",
};

const sampleData: InvitationView = {
  eventName: "Pernikahan Reni & Andi",
  eventDate: "2026-12-12T14:00:00Z",
  eventTime: "14:00 WIB",
  venueName: "Ballroom Hotel Grand",
  location: "Jl. Sudirman No. 10, Jakarta",
  locationMap: "https://maps.google.com/?q=Jakarta",
  customMessage:
    "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.",
  groom: {
    name: "Andi Pratama",
    nickname: "Andi",
    parentName: "Bpk. Slamet & Ibu Sri",
    bio: "Anak kedua dari tiga bersaudara.",
  },
  bride: {
    name: "Reni Kartika",
    nickname: "Reni",
    parentName: "Bpk. Hendra & Ibu Dewi",
    bio: "Anak pertama dari dua bersaudara.",
  },
  musicUrl: "https://example.com/music.mp3",
  events: [
    {
      id: "evt1",
      title: "Akad Nikah",
      date: "2026-12-12T08:00:00Z",
      time: "08.00 - 10.00 WIB",
      location: "Ballroom Hotel Grand",
      locationMap: "https://maps.google.com/?q=Jakarta",
    },
    {
      id: "evt2",
      title: "Resepsi",
      date: "2026-12-12T14:00:00Z",
      time: "14.00 - 17.00 WIB",
      location: "Ballroom Hotel Grand",
      locationMap: "https://maps.google.com/?q=Jakarta",
    },
  ],
};

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

export default async function PreviewPage({ params }: Props) {
  const { key } = await params;
  if (!VALID.has(key)) notFound();

  const template = await prisma.template.findUnique({
    where: { componentKey: key },
    select: {
      decorations: {
        include: { asset: { select: { url: true } } },
        orderBy: { zIndex: "asc" },
      },
    },
  });
  const decorations = mapDecorations(template?.decorations ?? []);

  return (
    <div className="relative">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
        <p className="text-sm font-medium text-zinc-700">
          Pratinjau {key === "classic" ? "Elegant Classic" : key === "minimal" ? "Modern Minimal" : "Floral Premium"}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <X className="h-4 w-4" />
            Tutup
          </Link>
        </div>
      </div>

      <TemplateRenderer
        componentKey={key}
        invitationId="preview-id"
        slug="preview"
        guestName="Bapak Ahmad & Ibu Siti"
        data={sampleData}
        isPublished
        wishes={sampleWishes}
        decorations={decorations}
      />
    </div>
  );
}
