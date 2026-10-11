import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEventName } from "@/lib/invitation-data";
import { mapDecorations } from "@/lib/decoration";
import { isExpired } from "@/lib/premium";
import ExpiredPage from "@/components/invitation/ExpiredPage";
import TemplateRenderer from "@/components/templates";
import type { InvitationData } from "@/lib/invitation-data";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: { template: { select: { name: true } } },
  });

  if (!invitation) return { title: "Undangan Tidak Ditemukan" };

  const eventName = getEventName(invitation.data) ?? invitation.template.name;

  return {
    title: eventName,
    description: `Kami mengundang Anda untuk menghadiri ${eventName}.`,
    openGraph: {
      title: eventName,
      description: `Kami mengundang Anda untuk menghadiri ${eventName}.`,
    },
  };
}

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { to } = await searchParams;

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true } },
      template: {
        select: {
          componentKey: true,
          name: true,
          decorations: {
            include: { asset: { select: { url: true, name: true } } },
            orderBy: { zIndex: "asc" },
          },
        },
      },
    },
  });

  if (!invitation) notFound();

  // Pemilik undangan tetap bisa melihat & edit meski masa aktif habis;
  // tamu (user biasa atau anonim) melihat halaman expired.
  const session = await auth();
  if (
    isExpired(invitation.expiresAt) &&
    invitation.userId !== session?.user?.id
  ) {
    return <ExpiredPage owner={invitation.user?.name ?? null} />;
  }

  const data = (invitation.data ?? {}) as InvitationData;
  const guestName = to ? decodeURIComponent(to).replace(/-/g, " ") : undefined;

  const decorations = mapDecorations(invitation.template.decorations);

  const wishes =
    invitation.status === "published"
      ? await prisma.wish.findMany({
          where: { invitationId: invitation.id, isHidden: false },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            guestName: true,
            message: true,
            createdAt: true,
          },
        })
      : [];

  return (
    <div className="w-full">
      <TemplateRenderer
        componentKey={invitation.template.componentKey}
        invitationId={invitation.id}
        slug={invitation.slug}
        guestName={guestName}
        data={data}
        isPublished={invitation.status === "published"}
        wishes={wishes.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }))}
        decorations={decorations}
      />
    </div>
  );
}
