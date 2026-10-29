import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail, EMAIL_DELAY_MS } from "@/lib/email";
import { getEventName } from "@/lib/invitation-data";
import { createNotification } from "@/lib/notifications";
import { type Invitation, type Guest } from "@/generated/prisma/client";
import { buildUniqueLink } from "@/lib/guest-link";
import { z } from "zod";

/**
 * Logika pembuatan tamu undangan — modul biasa (bukan "use server") agar bisa
 * dipakai bersama oleh actions berlogin (lib/actions/guest.ts) dan actions
 * berbasis token tanpa login (lib/actions/share.ts), tanpa mengekspos helper
 * ber-argumen entitas mentah sebagai server action publik.
 */

export const guestSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120).trim(),
  email: z
    .union([z.string().email("Email tidak valid").trim(), z.literal("")])
    .optional()
    .transform((value) => value || undefined),
});

export type CreatedGuest = { name: string; uniqueLink: string; email?: string };

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export function buildEmailContext(invitation: Invitation): EmailContext {
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

export async function sendToGuest(
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

/**
 * Logika bersama tambah-tamu-via-share ("Sebarkan Undangan"): dipakai versi
 * berlogin (actions/guest.ts) maupun versi token tanpa login (actions/share.ts).
 */
export async function upsertGuestForShare(
  invitation: Invitation,
  formData: FormData,
): Promise<{
  message?: string;
  success?: boolean;
  created?: boolean;
  uniqueLink?: string;
}> {
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
      email: guestSchema.safeParse({ name, email: email }).success
        ? email || undefined
        : undefined,
      uniqueLink: buildUniqueLink(invitation.slug, name),
    },
  });

  await createNotification({
    userId: invitation.userId,
    type: "SYSTEM",
    title: "Tamu undangan ditambahkan",
    body: `${name} ditambahkan lewat panel bagikan undangan.`,
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

export async function createGuestsForInvitation(
  invitation: Invitation,
  guests: { name: string; email?: string }[],
  appUrl: string,
  sendEmail: boolean,
): Promise<CreatedGuest[]> {
  const createdGuests: CreatedGuest[] = [];

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
