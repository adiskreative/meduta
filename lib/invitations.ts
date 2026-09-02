import { prisma } from "@/lib/prisma";
import { InvitationData } from "@/lib/invitation-data";

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