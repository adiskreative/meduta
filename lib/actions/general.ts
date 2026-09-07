"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const generalSchema = z.object({
  eventName: z.string().min(3, "Nama acara minimal 3 karakter").max(120).trim(),
  slug: z
    .string()
    .min(3, "Link minimal 3 karakter")
    .max(60)
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"),
  customMessage: z.string().max(500).trim().optional(),
});

export type GeneralState = {
  errors?: {
    eventName?: string[];
    slug?: string[];
    customMessage?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function saveGeneralSettings(
  invitationId: string,
  _state: GeneralState | undefined,
  formData: FormData,
): Promise<GeneralState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = generalSchema.safeParse({
    eventName: formData.get("eventName"),
    slug: formData.get("slug"),
    customMessage: formData.get("customMessage"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { eventName, slug, customMessage } = result.data;

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });

  if (!invitation) {
    return { message: "Undangan tidak ditemukan.", success: false };
  }

  if (slug !== invitation.slug) {
    if (invitation.slugChangeCount >= 3) {
      return {
        message: "Batas ganti link (3x) sudah habis.",
        success: false,
        errors: { slug: ["Batas ganti link sudah 3x"] },
      };
    }

    const duplicate = await prisma.invitation.findUnique({ where: { slug } });
    if (duplicate) {
      return {
        message: "Link sudah dipakai.",
        success: false,
        errors: { slug: ["Link ini sudah digunakan undangan lain"] },
      };
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        slug,
        slugChangeCount: { increment: 1 },
      },
    });
  }

  const currentData = (invitation.data ?? {}) as Record<string, unknown>;
  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      data: {
        ...currentData,
        eventName,
        customMessage,
      },
    },
  });

  revalidatePath("/dashboard/pengaturan-umum");
  return { success: true, message: "Pengaturan tersimpan." };
}

export async function setInvitationStatus(
  invitationId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });
  if (!invitation) return;

  const status = formData.get("status")?.toString();
  const next = status === "published" ? "published" : "draft";

  if (invitation.status !== next) {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: next },
    });
  }

  revalidatePath("/dashboard/pengaturan-umum");
  revalidatePath("/dashboard");
  revalidatePath(`/u/${invitation.slug}`);
}