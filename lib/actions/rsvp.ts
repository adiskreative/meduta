"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateStatusSchema = z.object({
  guestId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]),
});

export type RsvpActionState = { message?: string; success?: boolean };

export async function updateGuestStatus(
  guestId: string,
  formData: FormData,
): Promise<RsvpActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parse = updateStatusSchema.safeParse({
    guestId,
    status: formData.get("status"),
  });
  if (!parse.success) {
    return { success: false, message: "Data tidak valid." };
  }

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, invitation: { userId: session.user.id } },
  });
  if (!guest) {
    return { success: false, message: "Tamu tidak ditemukan." };
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: { rsvpStatus: parse.data.status },
  });

  revalidatePath("/dashboard/rsvp");
  return { success: true, message: "Status tamu diperbarui." };
}

export async function deleteGuest(guestId: string): Promise<RsvpActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, invitation: { userId: session.user.id } },
  });
  if (!guest) {
    return { success: false, message: "Tamu tidak ditemukan." };
  }

  await prisma.guest.delete({ where: { id: guestId } });

  revalidatePath("/dashboard/rsvp");
  return { success: true, message: "Tamu dihapus." };
}