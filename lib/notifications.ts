import { type NotificationType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  if (!userId) return;

  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        link,
      },
    });
  } catch (error) {
    console.error("[notifications] Gagal membuat notifikasi:", error);
  }
}
