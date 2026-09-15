import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mapDecorations } from "@/lib/decoration";
import { DEFAULT_SAMPLE_DATA, mergeSampleData } from "@/lib/sample-data";
import TemplateRenderer from "@/components/templates";
import PreviewShell from "@/components/templates/PreviewShell";
import type { InvitationView } from "@/components/templates/types";

type Props = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ embed?: string }>;
};

const VALID = new Set(["classic", "minimal", "floral", "rustic", "berkreative", "garden", "botanical"]);

export const metadata: Metadata = {
  title: "Pratinjau Template | Meduta",
};

// Data contoh: bawaan sistem (lib/sample-data) yang dapat dioverride per
// template lewat Admin Panel → Kelola Template → Data Contoh.
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

export default async function PreviewPage({ params, searchParams }: Props) {
  const { key } = await params;
  const { embed } = await searchParams;
  if (!VALID.has(key)) notFound();

  const template = await prisma.template.findUnique({
    where: { componentKey: key },
    select: {
      defaultMusicUrl: true,
      sampleData: true,
      decorations: {
        include: { asset: { select: { url: true } } },
        orderBy: { zIndex: "asc" },
      },
    },
  });
  const decorations = mapDecorations(template?.decorations ?? []);
  const mergedSample = mergeSampleData(template?.sampleData);
  const { guestName: sampleGuest, ...sampleData } = mergedSample as InvitationView & {
    guestName?: string;
  };

  const templateNode = (
    <TemplateRenderer
      componentKey={key}
      invitationId="preview-id"
      slug="preview"
      guestName={sampleGuest ?? "Bapak Ahmad & Ibu Siti"}
      data={{ ...sampleData, musicUrl: sampleData.musicUrl || template?.defaultMusicUrl || undefined }}
      isPublished
      embedded={embed === "1"}
      wishes={sampleWishes}
      decorations={decorations}
    />
  );

  // Mode embed (?embed=1): template polos untuk dijadikan thumbnail live
  // via iframe di landing page / dashboard — tanpa mockup & badge shell.
  // Scrollbar disembunyikan & interaksi dimatikan via <style> (aman SSR,
  // tanpa mutasi DOM yang memicu hydration mismatch).
  if (embed === "1") {
    return (
      <>
        <style>{`
          html, body { scrollbar-width: none; overflow-x: hidden; }
          body::-webkit-scrollbar { display: none; }
          body { pointer-events: none; }
        `}</style>
        {templateNode}
      </>
    );
  }

  return <PreviewShell>{templateNode}</PreviewShell>;
}
