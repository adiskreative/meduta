import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mapDecorations } from "@/lib/decoration";
import TemplateRenderer from "@/components/templates";
import PreviewShell from "@/components/templates/PreviewShell";
import type { InvitationView } from "@/components/templates/types";

type Props = {
  params: Promise<{ key: string }>;
};

const VALID = new Set(["classic", "minimal", "floral", "rustic"]);

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
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
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
  story: [
    {
      id: "st1",
      date: "2019-02-14T00:00:00Z",
      title: "Pertama Bertemu",
      description:
        "Kami bertemu melalui seorang sahabat dan langsung merasa nyambung sejak percakapan pertama.",
    },
    {
      id: "st2",
      date: "2023-08-17T00:00:00Z",
      title: "Lamaran",
      description:
        "Setelah berjalan beberapa tahun, kami melangkah ke jenjang yang lebih serius dengan lamaran yang sakral.",
    },
  ],
  gallery: [
    { id: "g1", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=60", caption: "Pre-wedding di Pantai" },
    { id: "g2", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60", caption: "Hari Akad" },
    { id: "g3", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=60", caption: "Resepsi" },
    { id: "g4", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=60", caption: "Bersama Keluarga" },
  ],
  gifts: [
    { id: "kf1", provider: "BRI", name: "Bank Rakyat Indonesia", accountNumber: "1234 5678 9012", holderName: "Andi Pratama" },
    { id: "kf2", provider: "BCA", name: "Bank Central Asia", accountNumber: "9876 5432 1098", holderName: "Reni Kartika" },
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
    <PreviewShell>
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
    </PreviewShell>
  );
}
