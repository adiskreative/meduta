import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getEventName } from "@/lib/invitation-data";
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
      template: { select: { componentKey: true, name: true } },
    },
  });

  if (!invitation) notFound();

  const data = (invitation.data ?? {}) as InvitationData;
  const guestName = to ? decodeURIComponent(to).replace(/-/g, " ") : undefined;

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
      />
    </div>
  );
}
