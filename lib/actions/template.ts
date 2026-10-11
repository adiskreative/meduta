"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, isPremiumUser } from "@/lib/premium";

export async function useTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!template) {
    throw new Error("Template tidak ditemukan.");
  }

  const existing = await prisma.invitation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, data: true },
  });

  if (existing) {
    // Wariskan musik default template hanya bila pengguna belum menyetel musik sendiri
    const currentData = (existing.data ?? {}) as Record<string, unknown>;
    const hasOwnMusic = typeof currentData.musicUrl === "string" && currentData.musicUrl !== "";
    const nextData = !hasOwnMusic && template.defaultMusicUrl
      ? { ...currentData, musicUrl: template.defaultMusicUrl }
      : currentData;

    await prisma.invitation.update({
      where: { id: existing.id },
      data: { templateId, data: nextData as object },
    });
  } else {
    const slug = `undangan-${Math.random().toString(36).slice(2, 8)}`;
    // Masa aktif: gratis 1 bulan, premium tanpa kadaluarsa.
    const premium = await isPremiumUser(userId);
    await prisma.invitation.create({
      data: {
        userId,
        templateId,
        slug,
        expiresAt: computeExpiresAt(premium),
        data: template.defaultMusicUrl ? { musicUrl: template.defaultMusicUrl } : {},
      },
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/pengaturan-umum");
}
