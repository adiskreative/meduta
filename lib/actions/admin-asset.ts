"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deriveAssetName,
  ensureAssetBucket,
  isValidAssetType,
  uploadAssetFile,
  validateAssetFiles,
} from "@/lib/asset-storage";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session.user.id;
}

export type AdminAssetState = {
  errors?: {
    name?: string[];
    type?: string[];
    url?: string[];
    thumbnail?: string[];
    file?: string[];
  };
  message?: string;
  success?: boolean;
  /** Nama file yang berhasil diunggah — dipakai form untuk membersihkan pilihan. */
  uploadedNames?: string[];
};

// Buat aset dari URL eksternal (tidak upload file)
export async function createAssetFromUrl(
  _state: AdminAssetState | undefined,
  formData: FormData,
): Promise<AdminAssetState> {
  const adminId = await requireAdmin();

  const schema = z.object({
    type: z.enum(["IMAGE", "FRAME", "DECOR", "BACKGROUND", "MUSIC", "GALLERY"]),
    url: z.string().min(1, "URL wajib diisi").url("URL tidak valid").max(500).trim(),
    thumbnail: z.string().url("Thumbnail harus URL").trim().optional().or(z.literal("")),
  });

  const result = schema.safeParse({
    type: formData.get("type"),
    url: formData.get("url"),
    thumbnail: formData.get("thumbnail") ?? "",
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Nama otomatis dari segmen terakhir URL (tanpa ekstensi)
  let fileName: string | null = null;
  try {
    fileName = new URL(result.data.url).pathname.split("/").filter(Boolean).pop() ?? null;
  } catch {
    fileName = null;
  }

  await prisma.templateAsset.create({
    data: {
      adminId,
      name: deriveAssetName(fileName, result.data.type),
      type: result.data.type,
      url: result.data.url,
      thumbnail: result.data.thumbnail || null,
      meta: {},
    },
  });

  revalidatePath("/admin/assets");
  revalidatePath("/admin/music");
  revalidatePath("/dashboard/background-music");
  return { success: true, message: "Aset berhasil ditambahkan." };
}

// Buat aset dengan upload file ke Supabase. Musik bisa beberapa file sekaligus.
// Unggah musik dari form memakai route handler /api/admin/music/upload agar
// body tidak terpotong batas buffer proxy (lihat proxyClientMaxBodySize).
export async function createAssetFromUpload(
  _state: AdminAssetState | undefined,
  formData: FormData,
): Promise<AdminAssetState> {
  const adminId = await requireAdmin();

  const type = String(formData.get("type") ?? "");
  if (!isValidAssetType(type)) {
    return { errors: { type: ["Tipe aset tidak valid."] } };
  }

  const files = formData
    .getAll("file")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return { errors: { file: ["Pilih file terlebih dahulu."] } };
  }

  const isMusic = type === "MUSIC";
  // Aset desain tetap satu file per unggah; musik boleh sekaligus banyak.
  const selectedFiles = isMusic ? files : files.slice(0, 1);

  const validationErrors = validateAssetFiles(selectedFiles, type);
  if (validationErrors.length > 0) {
    return { errors: { file: validationErrors } };
  }

  const bucketError = await ensureAssetBucket();
  if (bucketError) {
    return { errors: { file: [bucketError] } };
  }

  const folder = type.toLowerCase();
  const uploaded: string[] = [];
  const failures: string[] = [];

  for (const file of selectedFiles) {
    const result = await uploadAssetFile(file, folder);
    if ("error" in result) {
      failures.push(result.error);
      continue;
    }

    await prisma.templateAsset.create({
      data: {
        adminId,
        name: deriveAssetName(file.name, type),
        type,
        url: result.url,
        // Musik tidak butuh thumbnail — halaman /admin/music memakai audio player.
        thumbnail: isMusic ? null : result.url,
        meta: {},
      },
    });
    uploaded.push(file.name);
  }

  revalidatePath("/admin/assets");
  revalidatePath("/admin/music");
  revalidatePath("/dashboard/background-music");

  if (uploaded.length === 0) {
    return { errors: { file: failures }, success: false, uploadedNames: [] };
  }

  const message = isMusic
    ? `${uploaded.length} musik berhasil diunggah.`
    : "Aset berhasil diunggah.";
  const failureNote =
    failures.length > 0 ? ` ${failures.length} file gagal: ${failures.join(" ")}` : "";

  return {
    success: failures.length === 0,
    message: `${message}${failureNote}`,
    uploadedNames: uploaded,
  };
}

export async function deleteAsset(assetId: string) {
  await requireAdmin();

  const asset = await prisma.templateAsset.findUnique({
    where: { id: assetId },
    include: { _count: { select: { decorations: true } } },
  });
  if (!asset) throw new Error("Aset tidak ditemukan.");
  if (asset._count.decorations > 0) {
    throw new Error("Aset masih dipakai dekorasi template. Hapus dekorasinya dulu.");
  }

  await prisma.templateAsset.delete({ where: { id: assetId } });
  revalidatePath("/admin/assets");
  revalidatePath("/admin/music");
  revalidatePath("/admin/templates");
  revalidatePath("/dashboard/background-music");
}
