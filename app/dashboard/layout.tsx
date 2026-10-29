import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEventName } from "@/lib/invitation-data";
import { getActiveInvitationId } from "@/lib/invitations";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [unreadNotifications, invitations, activeInvitationId] =
    await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
      prisma.invitation.findMany({
        where: { userId: session.user.id },
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      getActiveInvitationId(session.user.id),
    ]);

  return (
    <DashboardShell
      isAdmin={session.user.role === "ADMIN"}
      unreadNotifications={unreadNotifications}
      invitations={invitations.map((inv) => ({
        id: inv.id,
        label: getEventName(inv.data) ?? inv.slug,
        templateName: inv.template.name,
      }))}
      activeInvitationId={activeInvitationId}
    >
      {children}
    </DashboardShell>
  );
}
