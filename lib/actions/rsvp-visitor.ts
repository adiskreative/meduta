"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    await prisma.guest.create({
      data: {
        invitationId,
        name: guestName,
        uniqueLink: invitation.slug,
        rsvpStatus: status,
        guestCount: guestCount ?? 1,
        submittedAt: new Date(),
      },
    });
    message = status === "CONFIRMED"
      ? "Terima kasih, konfirmasi kehadiran Anda telah tercatat."
      : "Terima kasih, ketidakhadiran Anda telah kami catat.";
  }

  revalidatePath(`/u/${invitation.slug}`);
  return { success: true, message, submitted: true };
}
