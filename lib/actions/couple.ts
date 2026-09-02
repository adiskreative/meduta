"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const personSchema = z.object({
  name: z.string().max(120).trim().optional(),
  nickname: z.string().max(60).trim().optional(),
  childOf: z.string().max(20).trim().optional(),
  parentName: z.string().max(200).trim().optional(),
  bio: z.string().max(300).trim().optional(),
  instagram: z.string().max(120).trim().optional(),
  photoUrl: z.string().max(500).trim().optional(),
});

export type PersonField = keyof z.infer<typeof personSchema>;

export type CoupleState = {
  errors?: Partial<Record<`${"groom" | "bride"}.${PersonField}`, string[]>>;
  message?: string;
  success?: boolean;
};

export async function saveCouple(
  invitationId: string,
  _state: CoupleState | undefined,
  formData: FormData,
): Promise<CoupleState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const groom = personSchema.safeParse({
    name: formData.get("groom.name"),
    nickname: formData.get("groom.nickname"),
    childOf: formData.get("groom.childOf"),
    parentName: formData.get("groom.parentName"),
    bio: formData.get("groom.bio"),
    instagram: formData.get("groom.instagram"),
    photoUrl: formData.get("groom.photoUrl"),
  });
  const bride = personSchema.safeParse({
    name: formData.get("bride.name"),
    nickname: formData.get("bride.nickname"),
    childOf: formData.get("bride.childOf"),
    parentName: formData.get("bride.parentName"),
    bio: formData.get("bride.bio"),
    instagram: formData.get("bride.instagram"),
    photoUrl: formData.get("bride.photoUrl"),
  });

  const errors: CoupleState["errors"] = {};
  if (!groom.success) {
    for (const [key, messages] of Object.entries(groom.error.flatten().fieldErrors)) {
      errors[`groom.${key}` as keyof NonNullable<CoupleState["errors"]>] = messages;
    }
  }
  if (!bride.success) {
    for (const [key, messages] of Object.entries(bride.error.flatten().fieldErrors)) {
      errors[`bride.${key}` as keyof NonNullable<CoupleState["errors"]>] = messages;
    }
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });
  if (!invitation) {
    return { message: "Undangan tidak ditemukan.", success: false };
  }

  const currentData = (invitation.data ?? {}) as Record<string, unknown>;

  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      data: {
        ...currentData,
        groom,
        bride,
      } as object,
    },
  });

  revalidatePath("/dashboard/mempelai");
  return { success: true, message: "Data mempelai tersimpan." };
}