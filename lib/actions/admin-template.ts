"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
