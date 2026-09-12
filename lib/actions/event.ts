"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(120).trim().optional(),
  date: z.string().trim().optional(),
  time: z.string().trim().optional(),
  location: z.string().max(300).trim().optional(),
  locationMap: z.string().max(500).trim().optional(),
});

const mainSchema = z.object({
  eventDate: z.string().trim().optional(),
  eventTime: z.string().trim().optional(),
  location: z.string().max(300).trim().optional(),
  locationMap: z.string().max(500).trim().optional(),
  venueName: z.string().max(200).trim().optional(),
});

export type EventState = {
  errors?: {
    eventDate?: string[];
    eventTime?: string[];
    location?: string[];
    locationMap?: string[];
    venueName?: string[];
    events?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function saveEventInfo(
  invitationId: string,
  _state: EventState | undefined,
  formData: FormData,
): Promise<EventState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const main = mainSchema.safeParse({
    eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime"),
    location: formData.get("location"),
    locationMap: formData.get("locationMap"),
    venueName: formData.get("venueName"),
  });

  if (!main.success) {
    return { errors: main.error.flatten().fieldErrors };
  }

  // Parse acara tambahan (multiple). Form menyimpan dengan format: addlEvent.title[], addlEvent.date[], dst.
  const parseList = (key: string): string[] => {
    const raw = formData.getAll(`${key}[]`);
    return raw.map((v) => v?.toString().trim() ?? "");
  };

  const titles = parseList("addlEvent.title");
  const dates = parseList("addlEvent.date");
  const times = parseList("addlEvent.time");
  const locations = parseList("addlEvent.location");
  const maps = parseList("addlEvent.locationMap");

  const events = titles
    .map((_, i) =>
      eventSchema.parse({
        id: crypto.randomUUID(),
        title: titles[i] ?? "",
        date: dates[i] ?? "",
        time: times[i] ?? "",
        location: locations[i] ?? "",
        locationMap: maps[i] ?? "",
      }),
    )
    // Buang baris acara yang benar-benar kosong agar tidak tersimpan kartu hantu
    .filter((e) => e.title || e.date || e.time || e.location || e.locationMap);

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
        ...main.data,
        events,
      } as object,
    },
  });

  revalidatePath("/dashboard/informasi-acara");
  return { success: true, message: "Informasi acara tersimpan." };
}