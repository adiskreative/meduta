"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    select: { id: true },
  });

  if (existing) {
    await prisma.invitation.update({
      where: { id: existing.id },
      data: { templateId },
    });
  } else {
    const slug = `undangan-${Math.random().toString(36).slice(2, 8)}`;
    await prisma.invitation.create({
      data: { userId, templateId, slug, data: {} },
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/pengaturan-umum");
}
