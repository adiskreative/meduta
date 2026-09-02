"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const guestSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120).trim(),
});

export type GuestState = {
  errors?: { names?: string[] };
  message?: string;
  success?: boolean;
  createdGuests?: { name: string; uniqueLink: string }[];
};

export async function createGuests(
  invitationId: string,
  _state: GuestState | undefined,
  formData: FormData,
): Promise<GuestState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });
  if (!invitation) {
    return { message: "Undangan tidak ditemukan.", success: false };
  }

  const raw = formData.get("names");
  const names = (raw?.toString() ?? "")
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return { errors: { names: ["Masukkan minimal satu nama tamu."] }, success: false };
  }

  const slug = invitation.slug;
  const createdGuests: { name: string; uniqueLink: string }[] = [];

  for (const name of names) {
    const validated = guestSchema.safeParse({ name });
    if (!validated.success) continue;

    const clean = validated.data.name;
    // cari guest yang sudah ada dengan nama sama untuk undangan ini
    const existing = await prisma.guest.findFirst({
      where: { invitationId, name: clean },
    });
    if (existing) continue;

    const toParam = clean.toLowerCase().replace(/\s+/g, "-");
    const guest = await prisma.guest.create({
      data: {
        invitationId,
        name: clean,
        uniqueLink: `${slug}?to=${encodeURIComponent(toParam)}`,
      },
    });

    createdGuests.push({ name: clean, uniqueLink: guest.uniqueLink });
  }

  revalidatePath("/dashboard/kirim-undangan");
  revalidatePath("/dashboard/rsvp");

  if (createdGuests.length === 0) {
    return {
      message: "Tidak ada tamu baru ditambahkan (mungkin sudah ada).",
      success: true,
      createdGuests,
    };
  }

  return {
    success: true,
    message: `${createdGuests.length} tamu berhasil ditambahkan.`,
    createdGuests,
  };
}