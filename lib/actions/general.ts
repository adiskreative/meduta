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
  // Kutipan (judul / isi / sumber) — bebas dirubah sesuai kepercayaan.
  // Kosong = pakai bawaan template (mis. Ar-Rum: 21 untuk Wayang).
  quoteTitle: z.string().max(120).trim().optional(),
  quoteText: z.string().max(900).trim().optional(),
  quoteSource: z.string().max(120).trim().optional(),
  // Checkbox "Tampilkan kutipan": "on" saat dicentang, null saat tidak.
  quoteHidden: z.string().optional(),
});

export type GeneralState = {
  errors?: {
    eventName?: string[];
    slug?: string[];
    customMessage?: string[];
    quoteTitle?: string[];
    quoteText?: string[];
    quoteSource?: string[];
    quoteHidden?: string[];
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
    quoteTitle: formData.get("quoteTitle"),
    quoteText: formData.get("quoteText"),
    quoteSource: formData.get("quoteSource"),
    quoteHidden: formData.get("quoteHidden")
      ? formData.get("quoteHidden")!.toString()
      : undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { eventName, slug, customMessage, quoteTitle, quoteText, quoteSource } = result.data;
  // Checkbox tidak dikirim saat tidak dicentang → "off"
  const quoteHidden = !result.data.quoteHidden;

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
        quoteTitle,
        quoteText,
        quoteSource,
        quoteHidden,
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

export async function deleteInvitation(
  invitationId: string,
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!invitation) {
    return { success: false, message: "Undangan tidak ditemukan." };
  }

  // Guest dan Wish tak punya onDelete: Cascade di schema, jadi hapus dulu
  // secara eksplisit agar tidak melanggar foreign key.
  await prisma.$transaction([
    prisma.wish.deleteMany({ where: { invitationId } }),
    prisma.guest.deleteMany({ where: { invitationId } }),
    prisma.invitation.delete({ where: { id: invitationId } }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pengaturan-umum");
  revalidatePath(`/u/${invitation.slug}`);
  return { success: true, message: "Undangan dihapus." };
}