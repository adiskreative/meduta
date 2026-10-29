import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ShieldCheck, Share2, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import WhatsAppShareForm from "@/components/dashboard/WhatsAppShareForm";
import ShareGuestsForm from "@/components/dashboard/ShareGuestsForm";

type Props = {
  params: Promise<{ token: string }>;
};

// Panel bagikan-undangan rahasia — tidak boleh terindeks meski halamannya publik.
export const metadata: Metadata = {
  title: "Bagikan Undangan | Meduta",
  robots: { index: false, follow: false },
};

export default async function SharePanelPage({ params }: Props) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { shareToken: token },
    select: {
      slug: true,
      guests: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, uniqueLink: true },
        take: 500,
      },
    },
  });

  if (!invitation) notFound();

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3111";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-700">
            <Share2 className="h-4 w-4" />
            Sebarkan Undangan
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Bagikan Undangan</h1>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p>
            <strong>Note:</strong> Fitur <strong>Sebarkan Undangan</strong> dapat
            digunakan tanpa perlu login user. Berikan link di atas kepada orang
            yang ingin membagikan undangannya.
          </p>
        </div>

        {/* Link undangan utama (tanpa nama penerima) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Link Generator</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Link umum undangan | penerima akan melihat sapaan{" "}
            <em>&quot;Tamu Undangan&quot;</em>.
          </p>
          <div className="mt-3 flex flex-col gap-2 rounded-lg bg-zinc-50 px-4 py-3">
            <p className="truncate text-sm text-zinc-700">
              {appUrl}/u/{invitation.slug}
            </p>
            <a
              href={`${appUrl}/u/${invitation.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka undangan
            </a>
          </div>
        </div>

        <WhatsAppShareForm
          shareToken={token}
          invitationSlug={invitation.slug}
          appUrl={appUrl}
        />

        <ShareGuestsForm
          shareToken={token}
          appUrl={appUrl}
          savedGuests={invitation.guests.map((guest) => ({
            id: guest.id,
            name: guest.name,
            uniqueLink: guest.uniqueLink,
          }))}
        />
      </main>
    </div>
  );
}

// Membaca token & data DB — wajib dirender dinamis, tidak boleh ter-cache statis.
export const dynamic = "force-dynamic";
