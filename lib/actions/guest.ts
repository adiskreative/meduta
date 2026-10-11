"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail, EMAIL_DELAY_MS } from "@/lib/email";
import { getEventName } from "@/lib/invitation-data";
import { createNotification } from "@/lib/notifications";
import { type Invitation, type Guest } from "@/generated/prisma/client";
import { buildUniqueLink } from "@/lib/guest-link";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const guestSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120).trim(),
  email: z
    .union([z.string().email("Email tidak valid").trim(), z.literal("")])
    .optional()
    .transform((value) => value || undefined),
});

export type GuestState = {
  errors?: { names?: string[]; emails?: string[] };
  message?: string;
  success?: boolean;
  createdGuests?: { name: string; uniqueLink: string; email?: string }[];
};

function getCoupleNames(data: unknown): string {
  const record = (data ?? {}) as Record<string, unknown>;
  const groom =
    record.groom && typeof record.groom === "object"
      ? (record.groom as Record<string, unknown>).name
      : undefined;
  const bride =
    record.bride && typeof record.bride === "object"
      ? (record.bride as Record<string, unknown>).name
      : undefined;
  return [groom, bride].filter(Boolean).join(" & ");
}

type EmailContext = {
  eventName: string;
  coupleNames: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
};

function buildEmailContext(invitation: Invitation): EmailContext {
  const data =
    invitation.data && typeof invitation.data === "object"
      ? (invitation.data as Record<string, unknown>)
      : {};
  return {
    eventName: getEventName(invitation.data) ?? "Pernikahan",
    coupleNames: getCoupleNames(invitation.data) || "Pasangan",
    eventDate: typeof data.eventDate === "string" ? data.eventDate : undefined,
    eventTime: typeof data.eventTime === "string" ? data.eventTime : undefined,
    location: typeof data.location === "string" ? data.location : undefined,
  };
}

async function sendToGuest(
  guest: Guest,
  invitation: Invitation,
  appUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const email = guest.email;
  if (!email) {
    return { ok: false, error: "Tamu tidak memiliki alamat email." };
  }

  const ctx = buildEmailContext(invitation);
  const result = await sendInvitationEmail({
    to: email,
    guestName: guest.name,
    eventName: ctx.eventName,
    coupleNames: ctx.coupleNames,
    eventDate: ctx.eventDate,
    eventTime: ctx.eventTime,
    location: ctx.location,
    invitationUrl: `${appUrl}/u/${guest.uniqueLink}`,
  });

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      emailSent: result.ok,
      emailSentAt: result.ok ? new Date() : guest.emailSentAt,
      lastSendError: result.ok ? null : (result.error ?? "Gagal mengirim email"),
    },
  });

  return result;
}

async function createGuestsForInvitation(
  invitation: Invitation,
  guests: { name: string; email?: string }[],
  appUrl: string,
  sendEmail: boolean,
): Promise<{ name: string; uniqueLink: string; email?: string }[]> {
  const createdGuests: { name: string; uniqueLink: string; email?: string }[] =
    [];

  const ctx = buildEmailContext(invitation);
  let emailSentCount = 0;

  for (const guest of guests) {
    const validated = guestSchema.safeParse(guest);
    if (!validated.success) continue;

    const clean = validated.data.name;
    const email = validated.data.email;

    const existing = await prisma.guest.findFirst({
      where: { invitationId: invitation.id, name: clean },
    });
    if (existing) continue;

    const guestRecord = await prisma.guest.create({
      data: {
        invitationId: invitation.id,
        name: clean,
        email,
        uniqueLink: buildUniqueLink(invitation.slug, clean),
      },
    });

    createdGuests.push({
      name: clean,
      uniqueLink: guestRecord.uniqueLink,
      email,
    });

    // Hanya kirim email jika user mencentang opsi "kirim email"
    if (sendEmail && email) {
      await sendToGuest(
        {
          ...guestRecord,
          email,
        },
        invitation,
        appUrl,
      );
      emailSentCount++;
      await sleep(EMAIL_DELAY_MS);
    }
  }

  if (createdGuests.length > 0) {
    await createNotification({
      userId: invitation.userId,
      type: "SYSTEM",
      title: "Tamu undangan ditambahkan",
      body: `${createdGuests.length} tamu baru ditambahkan ke undangan "${ctx.eventName}".`,
      link: "/dashboard/rsvp",
    });
  }

  if (sendEmail && emailSentCount > 0) {
    await createNotification({
      userId: invitation.userId,
      type: "SYSTEM",
      title: "Email undangan terkirim",
      body: `${emailSentCount} email undangan berhasil dikirim.`,
      link: "/dashboard/rsvp",
    });
  }

  return createdGuests;
}

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

  const name = formData.get("name")?.toString()?.trim() ?? "";
  const phone = formData.get("phone")?.toString()?.trim() ?? "";
  const email = formData.get("email")?.toString()?.trim() ?? "";

  if (name.length < 2) {
    return { message: "Nama minimal 2 karakter.", success: false };
  }

  const existing = await prisma.guest.findFirst({
    where: { invitationId: invitation.id, name },
  });

  if (existing) {
    // Update phone jika sebelumnya kosong / berubah
    if (phone && existing.phone !== phone) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: { phone },
      });
    }
    revalidatePath("/dashboard/kirim-undangan");
    return {
      success: true,
      created: false,
      uniqueLink: existing.uniqueLink,
      message: `Tamu "${name}" sudah ada di daftar.`,
    };
  }

  const guestRecord = await prisma.guest.create({
    data: {
      invitationId: invitation.id,
      name,
      phone: phone || undefined,
      email: guestSchema.safeParse({ name, email: email }).success ? email || undefined : undefined,
      uniqueLink: buildUniqueLink(invitation.slug, name),
    },
  });

  await createNotification({
    userId: invitation.userId,
    type: "SYSTEM",
    title: "Tamu undangan ditambahkan",
    body: `${name} ditambahkan lewat share WhatsApp.`,
    link: "/dashboard/rsvp",
  });

  revalidatePath("/dashboard/kirim-undangan");
  revalidatePath("/dashboard/rsvp");

  return {
    success: true,
    created: true,
    uniqueLink: guestRecord.uniqueLink,
    message: `Tamu "${name}" berhasil ditambahkan.`,
  };
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
