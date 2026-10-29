"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShareToken } from "@/lib/share-token";
import { createGuestsForInvitation, upsertGuestForShare } from "@/lib/guest-creation";
import type { GuestState } from "@/lib/actions/guest";
import type { Invitation } from "@/generated/prisma/client";

/**
 * Semua aksi di file ini mengotentifikasi lewat `shareToken` (bukan session):
 * halaman /share/[token] adalah panel "Sebarkan Undangan" yang bisa dipakai
 * tanpa login, sebagaimana panel share pada referensi linkundangan.
 */

export async function getInvitationByShareToken(
  shareToken: string,
): Promise<Invitation | null> {
  return prisma.invitation.findUnique({ where: { shareToken } });
}

/** Autentikasi pemilik (butuh login) — dipakai di dashboard. */
export async function getOrCreateShareToken(
  invitationId: string,
): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true, shareToken: true },
  });
  if (!invitation) return null;

  if (invitation.shareToken) return invitation.shareToken;

  const shareToken = generateShareToken();
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { shareToken },
  });

  // Supaya halaman dashboard yang sedang terbuka langsung mendapat token baru.
  revalidatePath("/dashboard/kirim-undangan");
  return shareToken;
}

/** Rotasi token (mis. link tersebar ke tangan yang salah) — butuh login. */
export async function regenerateShareToken(invitationId: string): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const owned = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return null;

  const shareToken = generateShareToken();
  await prisma.invitation.update({
    where: { id: owned.id },
    data: { shareToken },
  });

  // Link lama otomatis mati karena token berubah.
  revalidatePath("/dashboard/kirim-undangan");
  return shareToken;
}

/** Tambah tamu dari panel share tanpa login (otentifikasi via token). */
export async function addGuestFromShareToken(
  shareToken: string,
  formData: FormData,
): Promise<{ message?: string; success?: boolean; created?: boolean; uniqueLink?: string }> {
  const invitation = await getInvitationByShareToken(shareToken);
  if (!invitation) {
    return { message: "Link bagikan tidak valid.", success: false };
  }

  return upsertGuestForShare(invitation, formData);
}

export type ShareGuestsState = GuestState;

/** Generate link tamu dari panel share tanpa login (tanpa opsi kirim email). */
export async function createGuestsByShareToken(
  shareToken: string,
  _state: ShareGuestsState | undefined,
  formData: FormData,
): Promise<ShareGuestsState> {
  const invitation = await getInvitationByShareToken(shareToken);
  if (!invitation) {
    return { message: "Link bagikan tidak valid.", success: false };
  }

  const raw = formData.get("names");
  const names = (raw?.toString() ?? "")
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return {
      errors: { names: ["Masukkan minimal satu nama tamu."] },
      success: false,
    };
  }

  const appUrl =
    formData.get("appUrl")?.toString() ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  const createdGuests = await createGuestsForInvitation(invitation, names.map((name) => ({ name })), appUrl, false);

  revalidatePath("/dashboard/rsvp");
  revalidatePath(`/share/${shareToken}`);

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
