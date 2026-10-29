import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { InvitationData } from "@/lib/invitation-data";

/**
 * Cookie yang menyimpan id undangan aktif di dashboard.
 * Nilai kosong/tidak valid → fallback ke undangan terbaru user.
 */
export const ACTIVE_INVITATION_COOKIE = "meduta_active_invitation";

export async function getActiveInvitationId(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_INVITATION_COOKIE)?.value;
  if (activeId) {
    const owned = await prisma.invitation.findFirst({
      where: { id: activeId, userId },
      select: { id: true },
    });
    if (owned) return owned.id;
  }
  const latest = await prisma.invitation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return latest?.id ?? null;
}

/** Undangan aktif (dipakai semua halaman dashboard). */
export async function getActiveInvitation(userId: string) {
  const activeId = await getActiveInvitationId(userId);
  if (!activeId) return null;
  return prisma.invitation.findFirst({
    where: { id: activeId, userId },
  });
}

export async function updateInvitationData(
  userId: string,
  invitationId: string,
  data: InvitationData,
) {
  const belongsToUser = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true },
  });

  if (!belongsToUser) {
    throw new Error("Undangan tidak ditemukan atau bukan milik user ini.");
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { data: data as unknown as object },
  });
}