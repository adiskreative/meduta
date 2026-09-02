"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const wishSchema = z.object({
  guestName: z.string().min(2, "Nama minimal 2 karakter").max(120).trim(),
  message: z.string().min(3, "Ucapan minimal 3 karakter").max(2000).trim(),
});

export type WishState = {
  errors?: {
    guestName?: string[];
    message?: string[];
  };
  success?: boolean;
  message?: string;
};

// Dipakai dari halaman publik undangan (tanpa login)
export async function submitWish(
  invitationId: string,
  _state: WishState | undefined,
  formData: FormData,
): Promise<WishState> {
  const parse = wishSchema.safeParse({
    guestName: formData.get("guestName"),
    message: formData.get("message"),
  });

  if (!parse.success) {
    return { errors: parse.error.flatten().fieldErrors, success: false };
  }

  const invitation = await prisma.invitation.findFirst({ where: { id: invitationId } });
  if (!invitation) {
    return { success: false, message: "Undangan tidak ditemukan." };
  }

  await prisma.wish.create({
    data: {
      invitationId,
      guestName: parse.data.guestName,
      message: parse.data.message,
    },
  });

  return { success: true, message: "Ucapan berhasil terkirim." };
}

// Moderasi (dari dashboard, dengan login)
export async function toggleHideWish(
  wishId: string,
  hidden: boolean,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wish = await prisma.wish.findFirst({
    where: { id: wishId, invitation: { userId: session.user.id } },
  });
  if (!wish) return;

  await prisma.wish.update({
    where: { id: wishId },
    data: { isHidden: hidden },
  });

  revalidatePath("/dashboard/ucapan");
}

export async function deleteWish(wishId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wish = await prisma.wish.findFirst({
    where: { id: wishId, invitation: { userId: session.user.id } },
  });
  if (!wish) return;

  await prisma.wish.delete({ where: { id: wishId } });

  revalidatePath("/dashboard/ucapan");
}