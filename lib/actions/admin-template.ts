"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SAMPLE_DATA } from "@/lib/sample-data";

const REVALIDATE_SAMPLE_PATHS = ["/", "/preview/[key]", "/dashboard/pilih-tema"] as const;

function revalidateAfterSampleDataChange(templateId: string) {
  revalidatePath(`/admin/templates/${templateId}/sample-data`);
  revalidatePath("/admin/templates");
  for (const path of REVALIDATE_SAMPLE_PATHS) {
    revalidatePath(path, "page");
  }
}

const templateSchema = z.object({
  name: z.string().min(3, "Nama template minimal 3 karakter").max(120).trim(),
  thumbnailUrl: z
    .string()
    .min(1, "Thumbnail wajib diisi")
    .url("Thumbnail harus berupa URL yang valid")
    .max(500)
    .trim(),
  componentKey: z
    .string()
    .min(2, "Component key minimal 2 karakter")
    .max(60)
    .trim()
    .regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"),
  isPremium: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type AdminTemplateState = {
  errors?: {
    name?: string[];
    thumbnailUrl?: string[];
    componentKey?: string[];
  };
  message?: string;
  success?: boolean;
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

function parseForm(formData: FormData) {
  return templateSchema.safeParse({
    name: formData.get("name"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    componentKey: formData.get("componentKey"),
    isPremium: formData.get("isPremium") ?? "off",
  });
}

export async function createTemplate(
  _state: AdminTemplateState | undefined,
  formData: FormData,
): Promise<AdminTemplateState> {
  await requireAdmin();

  const result = parseForm(formData);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { name, thumbnailUrl, componentKey, isPremium } = result.data;

  const existing = await prisma.template.findUnique({
    where: { componentKey },
    select: { id: true },
  });
  if (existing) {
    return {
      message: `Component key "${componentKey}" sudah dipakai template lain.`,
      success: false,
      errors: { componentKey: ["Component key sudah digunakan."] },
    };
  }

  await prisma.template.create({
    data: { name, thumbnailUrl, componentKey, isPremium },
  });

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function updateTemplate(
  templateId: string,
  _state: AdminTemplateState | undefined,
  formData: FormData,
): Promise<AdminTemplateState> {
  await requireAdmin();

  const existingTemplate = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!existingTemplate) {
    return { message: "Template tidak ditemukan.", success: false };
  }

  const result = parseForm(formData);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { name, thumbnailUrl, componentKey, isPremium } = result.data;

  if (componentKey !== existingTemplate.componentKey) {
    const duplicate = await prisma.template.findUnique({
      where: { componentKey },
    });
    if (duplicate) {
      return {
        message: `Component key "${componentKey}" sudah dipakai template lain.`,
        success: false,
        errors: { componentKey: ["Component key sudah digunakan."] },
      };
    }
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { name, thumbnailUrl, componentKey, isPremium },
  });

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}`);
  return { success: true, message: "Template berhasil diperbarui." };
}

export async function deleteTemplate(templateId: string) {
  await requireAdmin();

  const existing = await prisma.template.findUnique({
    where: { id: templateId },
    include: { _count: { select: { invitations: true } } },
  });
  if (!existing) {
    throw new Error("Template tidak ditemukan.");
  }
  if (existing._count.invitations > 0) {
    throw new Error(
      "Template masih dipakai oleh undangan. Tidak bisa dihapus.",
    );
  }

  await prisma.template.delete({ where: { id: templateId } });

  revalidatePath("/admin/templates");
}

/* ------------------------------------------------------------------ */
/* Data contoh preview/thumbnail (Template.sampleData)                 */
/* ------------------------------------------------------------------ */

export type SampleDataState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Simpan data contoh dari form admin. Semua kolom opsional — kolom yang
 * dikosongkan otomatis kembali memakai nilai bawaan (lihat lib/sample-data).
 * Gaya field: sample.groom.name, sample.bride.photoUrl, dst (prefix "sample.").
 */
export async function updateSampleData(
  templateId: string,
  _state: SampleDataState | undefined,
  formData: FormData,
): Promise<SampleDataState> {
  await requireAdmin();

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, componentKey: true },
  });
  if (!template) {
    return { ok: false, message: "Template tidak ditemukan." };
  }

  const schema = z.object({
    "sample.eventName": z.string().max(120).trim().optional(),
    "sample.eventDate": z.string().max(40).trim().optional(),
    "sample.eventTime": z.string().max(60).trim().optional(),
    "sample.venueName": z.string().max(120).trim().optional(),
    "sample.location": z.string().max(200).trim().optional(),
    "sample.locationMap": z
      .union([z.string().url("URL peta tidak valid").max(500), z.literal("")])
      .optional(),
    "sample.customMessage": z.string().max(2000).trim().optional(),
    "sample.groom.name": z.string().max(120).trim().optional(),
    "sample.groom.nickname": z.string().max(60).trim().optional(),
    "sample.groom.parentName": z.string().max(160).trim().optional(),
    "sample.groom.bio": z.string().max(500).trim().optional(),
    "sample.groom.photoUrl": z
      .union([z.string().url("URL foto tidak valid").max(600), z.literal("")])
      .optional(),
    "sample.bride.name": z.string().max(120).trim().optional(),
    "sample.bride.nickname": z.string().max(60).trim().optional(),
    "sample.bride.parentName": z.string().max(160).trim().optional(),
    "sample.bride.bio": z.string().max(500).trim().optional(),
    "sample.bride.photoUrl": z
      .union([z.string().url("URL foto tidak valid").max(600), z.literal("")])
      .optional(),
    "sample.guestName": z.string().max(120).trim().optional(),
    "sample.giftProvider": z.string().max(60).trim().optional(),
    "sample.giftAccountNumber": z.string().max(40).trim().optional(),
    "sample.giftHolderName": z.string().max(120).trim().optional(),
  });

  const raw: Record<string, string> = {};
  for (const key of Object.keys(schema.shape)) {
    const v = formData.get(key);
    if (typeof v === "string") raw[key] = v;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const d = parsed.data;
  const str = (v?: string) => (v && v.length > 0 ? v : undefined);

  const override = {
    ...(str(d["sample.eventName"]) ? { eventName: str(d["sample.eventName"]) } : {}),
    ...(str(d["sample.eventDate"]) ? { eventDate: str(d["sample.eventDate"]) } : {}),
    ...(str(d["sample.eventTime"]) ? { eventTime: str(d["sample.eventTime"]) } : {}),
    ...(str(d["sample.venueName"]) ? { venueName: str(d["sample.venueName"]) } : {}),
    ...(str(d["sample.location"]) ? { location: str(d["sample.location"]) } : {}),
    ...(str(d["sample.locationMap"]) ? { locationMap: str(d["sample.locationMap"]) } : {}),
    ...(str(d["sample.customMessage"]) ? { customMessage: str(d["sample.customMessage"]) } : {}),
    groom: {
      ...(str(d["sample.groom.name"]) ? { name: str(d["sample.groom.name"]) } : {}),
      ...(str(d["sample.groom.nickname"]) ? { nickname: str(d["sample.groom.nickname"]) } : {}),
      ...(str(d["sample.groom.parentName"]) ? { parentName: str(d["sample.groom.parentName"]) } : {}),
      ...(str(d["sample.groom.bio"]) ? { bio: str(d["sample.groom.bio"]) } : {}),
      ...(str(d["sample.groom.photoUrl"])
        ? { photoUrl: str(d["sample.groom.photoUrl"]) }
        : {}),
    },
    bride: {
      ...(str(d["sample.bride.name"]) ? { name: str(d["sample.bride.name"]) } : {}),
      ...(str(d["sample.bride.nickname"]) ? { nickname: str(d["sample.bride.nickname"]) } : {}),
      ...(str(d["sample.bride.parentName"]) ? { parentName: str(d["sample.bride.parentName"]) } : {}),
      ...(str(d["sample.bride.bio"]) ? { bio: str(d["sample.bride.bio"]) } : {}),
      ...(str(d["sample.bride.photoUrl"])
        ? { photoUrl: str(d["sample.bride.photoUrl"]) }
        : {}),
    },
  };

  const overrideRecord = override as unknown as Record<string, unknown>;

  // Rekening contoh: hanya jika salah satu kolom terisi
  const giftProvider = str(d["sample.giftProvider"]);
  const giftAccount = str(d["sample.giftAccountNumber"]);
  const giftHolder = str(d["sample.giftHolderName"]);
  if (giftProvider || giftAccount || giftHolder) {
    overrideRecord.gifts = [
      {
        id: "sample-gift-1",
        provider: giftProvider ?? DEFAULT_SAMPLE_DATA.gifts![0].provider,
        name: giftProvider ?? DEFAULT_SAMPLE_DATA.gifts![0].name,
        accountNumber: giftAccount ?? DEFAULT_SAMPLE_DATA.gifts![0].accountNumber,
        holderName: giftHolder ?? DEFAULT_SAMPLE_DATA.gifts![0].holderName,
      },
    ];
  }

  // Nama tamu contoh (bukan bagian InvitationView — disimpan sebagai kunci
  // tambahan dan dibaca halaman preview)
  const guestName = str(d["sample.guestName"]);
  if (guestName) overrideRecord.guestName = guestName;

  // groom/bride selalu ada sebagai kunci (mungkin kosong) — override dianggap
  // ada bila ada kunci lain selain keduanya, ATAU isi di dalam keduanya.
  const hasOverride =
    Object.keys(overrideRecord).some((k) => k !== "groom" && k !== "bride") ||
    Object.keys(override.groom).length > 0 ||
    Object.keys(override.bride).length > 0;

  await prisma.template.update({
    where: { id: templateId },
    data: {
      sampleData: hasOverride
        ? (overrideRecord as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });

  revalidateAfterSampleDataChange(templateId);
  return { ok: true, message: "Data contoh berhasil disimpan." };
}

/** Kembalikan data contoh template ke bawaan sistem. */
export async function resetSampleData(templateId: string) {
  await requireAdmin();

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) throw new Error("Template tidak ditemukan.");

  await prisma.template.update({
    where: { id: templateId },
    data: { sampleData: Prisma.JsonNull },
  });

  revalidateAfterSampleDataChange(templateId);
}
