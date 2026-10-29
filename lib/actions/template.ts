"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, isPremiumUser } from "@/lib/premium";
import { generateShareToken } from "@/lib/share-token";
import {
  ACTIVE_INVITATION_COOKIE,
  getActiveInvitation,
} from "@/lib/invitations";

function randomSlug(): string {
  return `undangan-${Math.random().toString(36).slice(2, 8)}`;
}

/** Ganti template pada undangan AKTIF (data undangan dipertahankan). */
export async function useTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!template) {
    throw new Error("Template tidak ditemukan.");
  }

  const invitation = await getActiveInvitation(userId);
  if (!invitation) {
    // Belum punya undangan sama sekali → buat baru.
    await createInvitation(templateId);
    return;
  }

  // Template premium hanya boleh bila akun premium atau undangan ini premium.
  if (template.isPremium && !invitation.isPremium) {
    const accountPremium = await isPremiumUser(userId);
    if (!accountPremium) {
      redirect(`/dashboard/upgrade?undangan=${invitation.id}`);
    }
  }

  // Wariskan musik default template hanya bila pengguna belum menyetel musik sendiri
  const currentData = (invitation.data ?? {}) as Record<string, unknown>;
  const hasOwnMusic = typeof currentData.musicUrl === "string" && currentData.musicUrl !== "";
  const nextData = !hasOwnMusic && template.defaultMusicUrl
    ? { ...currentData, musicUrl: template.defaultMusicUrl }
    : currentData;

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { templateId, data: nextData as object },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard/pengaturan-umum");
}

/**
 * Buat undangan BARU (satu user boleh punya banyak undangan).
 * Template premium mengharuskan pembayaran per-undangan — user diarahkan
 * ke halaman pembayaran dengan konteks undangan baru tersebut.
 */
export async function createInvitation(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!template) {
    throw new Error("Template tidak ditemukan.");
  }

  const accountPremium = await isPremiumUser(userId);
  const invitationPremium = template.isPremium && accountPremium;

  const invitation = await prisma.invitation.create({
    data: {
      userId,
      templateId,
      slug: randomSlug(),
      shareToken: generateShareToken(),
      isPremium: invitationPremium,
      // Masa aktif: undangan premium (akun atau terbayar) tanpa kadaluarsa;
      // undangan dengan pembayaran menunggu → dihitung gratis sampai dibayar.
      expiresAt: computeExpiresAt(invitationPremium),
      data: template.defaultMusicUrl ? { musicUrl: template.defaultMusicUrl } : {},
    },
  });

  // Aktifkan undangan yang baru dibuat agar dashboard langsung mengarah ke sana.
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_INVITATION_COOKIE, invitation.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");

  if (template.isPremium && !accountPremium && !invitationPremium) {
    redirect(`/dashboard/upgrade?undangan=${invitation.id}`);
  }
  redirect("/dashboard/pengaturan-umum");
}

/** Pindah undangan aktif di dashboard (switcher di header). */
export async function setActiveInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const owned = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) {
    throw new Error("Undangan tidak ditemukan atau bukan milik Anda.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_INVITATION_COOKIE, invitationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
}
