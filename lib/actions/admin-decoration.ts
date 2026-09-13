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

// Input kosong ("") dari form harus dianggap "tidak diisi", bukan 0 —
// tanpa ini, kolom kosong gagal validasi diam-diam (cth. width=0 < 1).
const optionalNumber = (schema: z.ZodType<number>) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), schema.optional());

const decorationSchema = z.object({
  assetId: z.string().min(1, "Pilih aset."),
  placement: z.enum(["cover", "section", "floating"]),
  layer: z.enum(["decor", "frame", "background"]),
  zIndex: z.preprocess(
    (v) => (v === "" || v == null ? 1 : v),
    z.coerce.number().int().min(0).max(1000).default(1),
  ),
  rotated: optionalNumber(z.coerce.number().min(-360).max(360)),
  positionX: optionalNumber(z.coerce.number().int()),
  positionY: optionalNumber(z.coerce.number().int()),
  width: optionalNumber(z.coerce.number().int().min(1)),
  height: optionalNumber(z.coerce.number().int().min(1)),
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
      // Background selalu paling dasar — di bawah semua konten & dekorasi
      zIndex: layer === "background" ? 0 : zIndex,
      rotated: rotated ?? null,
      ...(positionX != null || positionY != null
        ? { position: { x: positionX ?? 0, y: positionY ?? 0 } }
        : {}),
      ...(width != null || height != null ? { size: { width, height } } : {}),
    },
  });

  revalidatePath(`/admin/templates/${templateId}/decorations`);
  // Background/dekorasi tampil di undangan publik — revalidate juga agar
  // perubahan langsung terlihat (tidak menunggu cache ISR kedaluwarsa).
  revalidatePath("/");
  revalidatePath("/u/[slug]", "page");
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
  revalidatePath("/");
  revalidatePath("/u/[slug]", "page");
}

const REVALIDATE_PUBLIC_PATHS = ["/", "/u/[slug]", "/preview/[key]"] as const;

function revalidatePublicAfterBackgroundChange(templateId: string) {
  revalidatePath("/admin/backgrounds");
  revalidatePath(`/admin/templates/${templateId}/decorations`);
  for (const path of REVALIDATE_PUBLIC_PATHS) {
    revalidatePath(path, "page");
  }
}

/**
 * Pasang aset BACKGROUND sebagai latar template (mengganti yang lama).
 * Dipakai halaman Admin → Background.
 */
export async function setBackground(templateId: string, assetId: string) {
  await requireAdmin();

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Template tidak ditemukan.");

  const asset = await prisma.templateAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Aset tidak ditemukan.");
  if (asset.type !== "BACKGROUND") {
    throw new Error("Aset harus bertipe BACKGROUND.");
  }

  // Ganti total: hapus background lama, pasang yang baru (satu background per template)
  await prisma.templateDecoration.deleteMany({
    where: { templateId, layer: "background" },
  });
  await prisma.templateDecoration.create({
    data: {
      templateId,
      assetId,
      placement: "cover",
      layer: "background",
      zIndex: 0,
    },
  });

  revalidatePublicAfterBackgroundChange(templateId);
}

/** Kembalikan latar template ke bawaannya (hapus background kustom). */
export async function removeBackground(templateId: string) {
  await requireAdmin();

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) throw new Error("Template tidak ditemukan.");

  await prisma.templateDecoration.deleteMany({
    where: { templateId, layer: "background" },
  });

  revalidatePublicAfterBackgroundChange(templateId);
}
