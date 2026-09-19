"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Ganti foto galeri template (khusus admin).
 *
 * "Foto galeri" template = kumpulan foto contoh (data.gallery pada
 * sampleData) yang tampil di section galeri template saat pratinjau,
 * plus jadi sumber fallback foto gerbang. Foto ditetapkan dari fitur
 * Dekorasi template: Admin → Kelola Template → Dekorasi → Galeri.
 */

const gallerySchema = z.object({
  "gallery.url[]": z
    .array(z.union([z.string().url("URL foto tidak valid").max(600), z.literal("")]))
    .max(12, "Maksimal 12 foto galeri"),
  "gallery.caption[]": z.array(z.string().max(120).trim()).max(12),
});

export type TemplateGalleryState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function saveTemplateGallery(
  templateId: string,
  _state: TemplateGalleryState | undefined,
  formData: FormData,
): Promise<TemplateGalleryState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) {
    return { message: "Template tidak ditemukan." };
  }

  const urls = formData
    .getAll("gallery.url[]")
    .map((v) => (typeof v === "string" ? v.trim() : ""));
  const captions = formData
    .getAll("gallery.caption[]")
    .map((v) => (typeof v === "string" ? v.trim() : ""));

  const parsed = gallerySchema.safeParse({
    "gallery.url[]": urls,
    "gallery.caption[]": captions,
  });
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      message: "Periksa kembali isian galeri.",
    };
  }

  // Slot URL kosong diabaikan (baris tak terpakai di form).
  const gallery = urls
    .map((url, i) => ({ url, caption: captions[i] || undefined }))
    .filter((g) => g.url.length > 0)
    .map((g, i) => ({ id: `gallery-${i + 1}`, url: g.url, caption: g.caption }));

  const template2 = await prisma.template.findUnique({
    where: { id: templateId },
    select: { sampleData: true },
  });
  const sample = (template2?.sampleData ?? {}) as Record<string, unknown>;

  await prisma.template.update({
    where: { id: templateId },
    data: {
      sampleData: { ...sample, gallery } as object,
    },
  });

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}`);
  return { ok: true, message: `Galeri template tersimpan (${gallery.length} foto).` };
}

/** Simpan foto khusus gerbang template (layer admin, bukan pilihan user). */
export async function saveTemplateGatePhoto(
  templateId: string,
  _state: TemplateGalleryState | undefined,
  formData: FormData,
): Promise<TemplateGalleryState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const gatePhotoUrl = z
    .union([z.string().url("URL foto tidak valid").max(600), z.literal("")])
    .safeParse((formData.get("gatePhotoUrl") ?? "").toString().trim());
  if (!gatePhotoUrl.success) {
    return { errors: { gatePhotoUrl: ["URL foto gerbang tidak valid."] } };
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { sampleData: true },
  });
  if (!template) return { message: "Template tidak ditemukan." };

  const sample = (template.sampleData ?? {}) as Record<string, unknown>;
  await prisma.template.update({
    where: { id: templateId },
    data: {
      sampleData: {
        ...sample,
        gatePhotoUrl: gatePhotoUrl.data || undefined,
      } as object,
    },
  });

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}`);
  return {
    ok: true,
    message: gatePhotoUrl.data
      ? "Foto gerbang template tersimpan."
      : "Foto gerbang template dikosongkan (pakai bawaan).",
  };
}
