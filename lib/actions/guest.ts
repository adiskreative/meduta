"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import { getEventName } from "@/lib/invitation-data";
import { createNotification } from "@/lib/notifications";
import { type Invitation } from "@/generated/prisma/client";
import { buildUniqueLink } from "@/lib/guest-link";

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

async function createGuestsForInvitation(
  invitation: Invitation,
  guests: { name: string; email?: string }[],
  appUrl: string,
): Promise<{ name: string; uniqueLink: string; email?: string }[]> {
  const createdGuests: { name: string; uniqueLink: string; email?: string }[] =
    [];

  const data =
    invitation.data && typeof invitation.data === "object"
      ? (invitation.data as Record<string, unknown>)
      : {};
  const eventName = getEventName(invitation.data) ?? "Pernikahan";
  const coupleNames = getCoupleNames(invitation.data) || "Pasangan";
  const eventDate =
    typeof data.eventDate === "string" ? data.eventDate : undefined;
  const eventTime =
    typeof data.eventTime === "string" ? data.eventTime : undefined;
  const location =
    typeof data.location === "string" ? data.location : undefined;

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

    const invitationUrl = `${appUrl}/u/${guestRecord.uniqueLink}`;

    if (email) {
      await sendInvitationEmail({
        to: email,
        guestName: clean,
        eventName,
        coupleNames,
        eventDate,
        eventTime,
        location,
        invitationUrl,
      });
    }
  }

  if (createdGuests.length > 0) {
    await createNotification({
      userId: invitation.userId,
      type: "SYSTEM",
      title: "Tamu undangan ditambahkan",
      body: `${createdGuests.length} tamu baru ditambahkan ke undangan "${eventName}".`,
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

  const createdGuests =
    await createGuestsForInvitation(invitation, guests, appUrl);

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

  const createdGuests =
    await createGuestsForInvitation(invitation, rows, appUrl);

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
    message: `${createdGuests.length} tamu berhasil diimpor.`,
    createdGuests,
  };
}
