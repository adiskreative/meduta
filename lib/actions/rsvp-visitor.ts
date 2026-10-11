"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { buildUniqueLink } from "@/lib/guest-link";

const rsvpSchema = z.object({
  guestName: z.string().min(2, "Nama minimal 2 karakter").max(120).trim(),
  status: z.enum(["CONFIRMED", "DECLINED"]),
  guestCount: z.coerce.number().int().min(1).max(20).optional(),
});

export type RsvpVisitorState = {
  errors?: {
    guestName?: string[];
    status?: string[];
    guestCount?: string[];
  };
  message?: string;
  success?: boolean;
  submitted?: boolean;
};

// Dipakai dari halaman publik undangan (tanpa login)
export async function submitRsvp(
  invitationId: string,
  _state: RsvpVisitorState | undefined,
  formData: FormData,
): Promise<RsvpVisitorState> {
  const parse = rsvpSchema.safeParse({
    guestName: formData.get("guestName"),
    status: formData.get("status"),
    guestCount: formData.get("guestCount") ? Number(formData.get("guestCount")) : undefined,
  });

  if (!parse.success) {
    return { errors: parse.error.flatten().fieldErrors, success: false };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation) {
    return { success: false, message: "Undangan tidak ditemukan." };
  }

  const { guestName, status, guestCount } = parse.data;

  const guest = await prisma.guest.findFirst({
    where: { invitationId, name: guestName },
  });

  let message: string;
  if (guest) {
    await prisma.guest.update({
      where: { id: guest.id },
      data: {
        rsvpStatus: status,
        guestCount: guestCount ?? guest.guestCount ?? 1,
        submittedAt: new Date(),
      },
    });
    message =
      status === "CONFIRMED"
        ? "Terima kasih, konfirmasi kehadiran Anda telah tercatat."
        : "Terima kasih, ketidakhadiran Anda telah kami catat.";
  } else {
    // uniqueLink bersifat @unique — jangan pakai slug mentah (bentrok pada
    // tamu anonim kedua). Gunakan pola link undangan + fallback update bila
    // tamu dengan nama yang sama sudah ada.
    const uniqueLink = buildUniqueLink(invitation.slug, guestName);
    try {
      await prisma.guest.create({
        data: {
          invitationId,
          name: guestName,
          uniqueLink,
          rsvpStatus: status,
          guestCount: guestCount ?? 1,
          submittedAt: new Date(),
        },
      });
    } catch (error) {
      const existing = await prisma.guest.findUnique({ where: { uniqueLink } });
      if (!existing) throw error;
      await prisma.guest.update({
        where: { id: existing.id },
        data: {
          rsvpStatus: status,
          guestCount: guestCount ?? existing.guestCount ?? 1,
          submittedAt: new Date(),
        },
      });
    }
    message = status === "CONFIRMED"
      ? "Terima kasih, konfirmasi kehadiran Anda telah tercatat."
      : "Terima kasih, ketidakhadiran Anda telah kami catat.";
  }

  await createNotification({
    userId: invitation.userId,
    type: "RSVP",
    title:
      status === "CONFIRMED"
        ? `${guestName} mengonfirmasi kehadiran`
        : `${guestName} berhalangan hadir`,
    body:
      status === "CONFIRMED"
        ? `Tamu ${guestName} akan hadir${guestCount ? ` (${guestCount} orang)` : ""}.`
        : `Tamu ${guestName} tidak dapat hadir.`,
    link: "/dashboard/rsvp",
  });

  revalidatePath(`/u/${invitation.slug}`);
  return { success: true, message, submitted: true };
}
