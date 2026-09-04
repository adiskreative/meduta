"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedInvitation(invitationId: string, userId: string) {
  return prisma.invitation.findFirst({
    where: { id: invitationId, userId },
  });
}

function readArray(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((v) => v?.toString().trim() ?? "");
}

const storyItemSchema = z.object({
  id: z.string().optional(),
  date: z.string().max(60).trim().optional(),
  title: z.string().max(200).trim().optional(),
  description: z.string().max(1000).trim().optional(),
});

export type StoryState = {
  errors?: { story?: string[] };
  message?: string;
  success?: boolean;
};

export async function saveStory(
  invitationId: string,
  _state: StoryState | undefined,
  formData: FormData,
): Promise<StoryState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dates = readArray(formData, "story.date[]");
  const titles = readArray(formData, "story.title[]");
  const descriptions = readArray(formData, "story.description[]");

  const story = titles.map((_, i) =>
    storyItemSchema.parse({
      id: crypto.randomUUID(),
      date: dates[i],
      title: titles[i],
      description: descriptions[i],
    }),
  );

  const invitation = await getOwnedInvitation(invitationId, session.user.id);
  if (!invitation) return { message: "Undangan tidak ditemukan.", success: false };

  const currentData = (invitation.data ?? {}) as Record<string, unknown>;
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { data: { ...currentData, story } as object },
  });

  revalidatePath("/dashboard/cerita-cinta");
  return { success: true, message: "Cerita cinta tersimpan." };
}

const galleryItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().max(500).trim().optional(),
  caption: z.string().max(200).trim().optional(),
});

export type GalleryState = {
  errors?: { gallery?: string[] };
  message?: string;
  success?: boolean;
};

export async function saveGallery(
  invitationId: string,
  _state: GalleryState | undefined,
  formData: FormData,
): Promise<GalleryState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const urls = readArray(formData, "gallery.url[]");
  const captions = readArray(formData, "gallery.caption[]");

  const gallery = urls.map((_, i) =>
    galleryItemSchema.parse({
      id: crypto.randomUUID(),
      url: urls[i],
      caption: captions[i],
    }),
  );

  const invitation = await getOwnedInvitation(invitationId, session.user.id);
  if (!invitation) return { message: "Undangan tidak ditemukan.", success: false };

  const currentData = (invitation.data ?? {}) as Record<string, unknown>;
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { data: { ...currentData, gallery } as object },
  });

  revalidatePath("/dashboard/galeri");
  return { success: true, message: "Galeri tersimpan." };
}

const giftItemSchema = z.object({
  id: z.string().optional(),
  provider: z.string().max(120).trim().optional(),
  name: z.string().max(120).trim().optional(),
  accountNumber: z.string().max(60).trim().optional(),
  holderName: z.string().max(200).trim().optional(),
});

export type GiftState = {
  errors?: { gifts?: string[] };
  message?: string;
  success?: boolean;
};

export async function saveGifts(
  invitationId: string,
  _state: GiftState | undefined,
  formData: FormData,
): Promise<GiftState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const providers = readArray(formData, "gift.provider[]");
  const names = readArray(formData, "gift.name[]");
  const accountNumbers = readArray(formData, "gift.accountNumber[]");
  const holderNames = readArray(formData, "gift.holderName[]");

  const gifts = providers.map((_, i) =>
    giftItemSchema.parse({
      id: crypto.randomUUID(),
      provider: providers[i],
      name: names[i],
      accountNumber: accountNumbers[i],
      holderName: holderNames[i],
    }),
  );

  const invitation = await getOwnedInvitation(invitationId, session.user.id);
  if (!invitation) return { message: "Undangan tidak ditemukan.", success: false };

  const currentData = (invitation.data ?? {}) as Record<string, unknown>;
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { data: { ...currentData, gifts } as object },
  });

  revalidatePath("/dashboard/kado-nikah");
  return { success: true, message: "Daftar kado nikah tersimpan." };
}

export type MusicState = {
  errors?: { musicUrl?: string[] };
  message?: string;
  success?: boolean;
};

export async function saveMusic(
  invitationId: string,
  _state: MusicState | undefined,
  formData: FormData,
): Promise<MusicState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const musicUrl = z
    .string()
    .max(500)
    .trim()
    .optional()
    .or(z.literal(""))
    .safeParse(formData.get("musicUrl") ?? "");
  if (!musicUrl.success) {
    return { errors: { musicUrl: ["Link musik tidak valid."] } };
  }

  const invitation = await getOwnedInvitation(invitationId, session.user.id);
  if (!invitation) return { message: "Undangan tidak ditemukan.", success: false };

  const currentData = (invitation.data ?? {}) as Record<string, unknown>;
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { data: { ...currentData, musicUrl: musicUrl.data } as object },
  });

  revalidatePath("/dashboard/background-music");
  return { success: true, message: "Musik latar tersimpan." };
}
