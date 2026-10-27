import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const unreadNotifications = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <DashboardShell
      isAdmin={session.user.role === "ADMIN"}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </DashboardShell>
  );
}
