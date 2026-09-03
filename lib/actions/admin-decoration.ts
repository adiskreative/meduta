"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session.user.id;
}

const decorationSchema = z.object({
  assetId: z.string().min(1, "Pilih aset."),
  placement: z.enum(["cover", "section", "floating"]),
  layer: z.enum(["decor", "frame"]),
  zIndex: z.coerce.number().int().min(0).max(1000).default(1),
  rotated: z.coerce.number().min(-360).max(360).optional(),
  positionX: z.coerce.number().int().optional(),
  positionY: z.coerce.number().int().optional(),
  width: z.coerce.number().int().min(1).optional(),
  height: z.coerce.number().int().min(1).optional(),
});

export type AdminDecorationState = {
  errors?: {
    assetId?: string[];
    placement?: string[];
    layer?: string[];
    zIndex?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function addDecoration(
  templateId: string,
  _state: AdminDecorationState | undefined,
  formData: FormData,
): Promise<AdminDecorationState> {
  await requireAdmin();

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) return { message: "Template tidak ditemukan.", success: false };

  const result = decorationSchema.safeParse({
    assetId: formData.get("assetId"),
    placement: formData.get("placement"),
    layer: formData.get("layer"),
    zIndex: formData.get("zIndex") ?? "1",
    rotated: formData.get("rotated") ?? undefined,
    positionX: formData.get("positionX") ?? undefined,
    positionY: formData.get("positionY") ?? undefined,
    width: formData.get("width") ?? undefined,
    height: formData.get("height") ?? undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { assetId, placement, layer, zIndex, rotated, positionX, positionY, width, height } =
    result.data;

  const asset = await prisma.templateAsset.findUnique({ where: { id: assetId } });
  if (!asset) return { message: "Aset tidak ditemukan.", success: false };

  await prisma.templateDecoration.create({
    data: {
      templateId,
      assetId,
      placement,
      layer,
      zIndex,
      rotated: rotated ?? null,
      ...(positionX != null || positionY != null
        ? { position: { x: positionX ?? 0, y: positionY ?? 0 } }
        : {}),
      ...(width != null || height != null ? { size: { width, height } } : {}),
    },
  });

  revalidatePath(`/admin/templates/${templateId}/decorations`);
  return { success: true, message: "Dekorasi berhasil ditambahkan." };
}

export async function deleteDecoration(decorationId: string) {
  await requireAdmin();

  const decoration = await prisma.templateDecoration.findUnique({
    where: { id: decorationId },
    select: { templateId: true },
  });
  if (!decoration) throw new Error("Dekorasi tidak ditemukan.");

  await prisma.templateDecoration.delete({ where: { id: decorationId } });
  revalidatePath(`/admin/templates/${decoration.templateId}/decorations`);
  revalidatePath("/admin/templates");
}
