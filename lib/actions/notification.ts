"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationRead(notificationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/notifikasi");
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/notifikasi");
}
