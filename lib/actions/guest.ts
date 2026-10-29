"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createGuestsForInvitation,
  sendToGuest,
  sleep,
  upsertGuestForShare,
} from "@/lib/guest-creation";
import { EMAIL_DELAY_MS } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { type Guest } from "@/generated/prisma/client";

export type GuestState = {
  errors?: { names?: string[]; emails?: string[] };
  message?: string;
  success?: boolean;
  createdGuests?: { name: string; uniqueLink: string; email?: string }[];
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
    return {
      errors: { names: ["Masukkan minimal satu nama tamu."] },
      success: false,
    };
  }

  const sendEmail = formData.get("sendEmail") === "on";
  const appUrl =
    formData.get("appUrl")?.toString() ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";

  const guests = names.map((name) => ({ name }));

  const createdGuests = await createGuestsForInvitation(
    invitation,
    guests,
    appUrl,
    sendEmail,
  );

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
    message: `${createdGuests.length} tamu berhasil ditambahkan.${
      sendEmail ? " Email undangan dikirim." : ""
    }`,
    createdGuests,
  };
}

export type ImportGuestState = {
  errors?: { file?: string[] };
  message?: string;
  success?: boolean;
  createdGuests?: { name: string; uniqueLink: string; email?: string }[];
};

export async function importGuests(
  invitationId: string,
  _state: ImportGuestState | undefined,
  formData: FormData,
): Promise<ImportGuestState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });
  if (!invitation) {
    return { message: "Undangan tidak ditemukan.", success: false };
  }

  const rawRows = formData.get("rows");
  let rows: { name: string; email?: string }[] = [];

  if (rawRows) {
    try {
      const parsed = JSON.parse(rawRows.toString()) as unknown[];
      rows = parsed
        .filter(
          (r): r is { name: string; email?: string } =>
            !!r && typeof r === "object" && !!((r as { name?: unknown }).name),
        )
        .map((r) => ({
          name: String(r.name).trim(),
          email: r.email ? String(r.email).trim() : undefined,
        }))
        .filter((r) => r.name.length >= 2);
    } catch {
      return {
        errors: { file: ["Format data import tidak valid."] },
        success: false,
      };
    }
  }

  if (rows.length === 0) {
    return {
      errors: { file: ["Tidak ada baris valid yang ditemukan pada file."] },
      success: false,
    };
  }

  const appUrl =
    formData.get("appUrl")?.toString() ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";

  const sendEmail = formData.get("sendEmail") === "on";

  const createdGuests = await createGuestsForInvitation(
    invitation,
    rows,
    appUrl,
    sendEmail,
  );

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
    message: `${createdGuests.length} tamu berhasil diimpor.${
      sendEmail ? " Email undangan dikirim ke tamu yang punya email." : ""
    }`,
    createdGuests,
  };
}

export type ShareGuestState = {
  message?: string;
  success?: boolean;
  created?: boolean;
  uniqueLink?: string;
};

export async function addGuestFromShare(
  invitationId: string,
  formData: FormData,
): Promise<ShareGuestState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });
  if (!invitation) {
    return { message: "Undangan tidak ditemukan.", success: false };
  }

  return upsertGuestForShare(invitation, formData);
}

async function requireOwnedGuest(
  guestId: string,
  userId: string,
): Promise<Guest | null> {
  return prisma.guest.findFirst({
    where: {
      id: guestId,
      invitation: { userId },
    },
  });
}

export async function resendGuestInvitation(
  guestId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const guest = await requireOwnedGuest(guestId, session.user.id);
  if (!guest) return;

  const invitation = await prisma.invitation.findUnique({
    where: { id: guest.invitationId },
  });
  if (!invitation) return;

  const appUrl =
    formData.get("appUrl")?.toString() ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";

  await sendToGuest(guest, invitation, appUrl);

  revalidatePath("/dashboard/rsvp");
  revalidatePath("/dashboard/kirim-undangan");
}

export async function resendAllPendingInvitations(
  invitationId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
  });
  if (!invitation) return;

  const appUrl =
    formData.get("appUrl")?.toString() ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";

  const guests = await prisma.guest.findMany({
    where: {
      invitationId: invitation.id,
      email: { not: null },
      OR: [{ emailSent: false }, { lastSendError: { not: null } }],
    },
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const guest of guests) {
    const result = await sendToGuest(guest, invitation, appUrl);
    if (result.ok) {
      sentCount++;
    } else {
      failedCount++;
    }
    await sleep(EMAIL_DELAY_MS);
  }

  revalidatePath("/dashboard/rsvp");
  revalidatePath("/dashboard/kirim-undangan");

  if (sentCount > 0) {
    await createNotification({
      userId: session.user.id,
      type: "SYSTEM",
      title: "Email undangan dikirim ulang",
      body: `${sentCount} email undangan berhasil dikirim ulang.${
        failedCount > 0 ? ` ${failedCount} gagal.` : ""
      }`,
      link: "/dashboard/rsvp",
    });
  }
}
